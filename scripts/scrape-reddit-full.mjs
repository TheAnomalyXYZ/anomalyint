#!/usr/bin/env node
// Full pipeline:
//   1. Read the Launchpad (Popular + New) and compare against the API
//      (https://anomalyint.vercel.app/api/reddit-games) to find:
//        - games not yet tracked by the API
//        - games whose popular/new listing changed
//   2. For games missing a sub_address (brand-new or never resolved), click
//      their Launchpad tile to capture the subreddit URL.
//   3. Visit every resolvable subreddit and scrape created date, description,
//      and weekly active-users / contributions counts.
//   4. Log everything to a timestamped JSON in ../reddit-data-logs/.
//
// This script only READS + writes local JSON. Uploading to the server is a
// separate step.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const SHOT_DIR = join(OUT_DIR, "screenshots");
const GAMES_API = "https://anomalyint.vercel.app/api/reddit-games";
const LAUNCHPAD_URL = "https://www.reddit.com/r/GamesOnReddit/";
const TILE_SELECTOR = "devvit2-custom-post";

/* ------------------------------- agent-browser ------------------------------ */

const ab = (args, opts = {}) => {
  const cmd = `agent-browser ${args}`;
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 20000,
    ...opts,
  });
};

const abSafe = (args, opts = {}) => {
  try { return ab(args, opts); } catch (e) { return `[ab error: ${e.message.split("\n")[0]}]`; }
};

const jitterWait = (baseMs = 0) => {
  const total = baseMs + Math.floor(Math.random() * 2000);
  ab(`wait ${total}`);
};

const currentUrl = () => abSafe(`get url`, { timeout: 8000 }).trim();

const parseEval = (raw) => {
  try {
    const trimmed = (raw || "").trim();
    if (!trimmed || trimmed === "null") return null;
    const once = trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed;
    return typeof once === "string" ? JSON.parse(once) : once;
  } catch { return null; }
};

/* --------------------------------- helpers ---------------------------------- */

const parseCount = (raw) => {
  if (!raw) return null;
  const m = String(raw).match(/([\d.,]+)\s*([kKmM])?/);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  const suf = (m[2] || "").toLowerCase();
  if (suf === "k") return Math.round(n * 1000);
  if (suf === "m") return Math.round(n * 1_000_000);
  return Math.round(n);
};

// Normalizes a game name for comparison (case/space/punct-insensitive).
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Screenshot the <devvit2-custom-post> game tile and crop to it. Assumes the
// browser is already on the game's subreddit page.
const captureGameTile = (name, stamp) => {
  abSafe(
    `eval "(()=>{const host=document.querySelector('${TILE_SELECTOR}');if(!host)return;const inner=host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div')||host;inner.scrollIntoView({block:'center'});})()"`,
    { timeout: 8000 }
  );
  jitterWait(1200);

  const rectScript = `
    (() => {
      const host = document.querySelector('${TILE_SELECTOR}');
      if (!host) return null;
      const inner = host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div') || host;
      const r = inner.getBoundingClientRect();
      return JSON.stringify({ x:r.x, y:r.y, w:r.width, h:r.height, dpr: window.devicePixelRatio || 1 });
    })()
  `.replace(/\s+/g, " ").trim();
  const rect = parseEval(abSafe(`eval ${JSON.stringify(rectScript)}`, { timeout: 8000 }));

  const base = `${slugify(name)}-${stamp}`;
  const fullPath = join(SHOT_DIR, `${base}-full.png`);
  const cropPath = join(SHOT_DIR, `${base}.png`);

  abSafe(`screenshot "${fullPath}"`, { timeout: 20000 });

  if (!rect || !rect.w || !rect.h) {
    return { full: relative(OUT_DIR, fullPath).replace(/\\/g, "/"), crop: null, error: "no-rect" };
  }
  const dpr = rect.dpr || 1;
  const cx = Math.max(0, Math.round(rect.x * dpr));
  const cy = Math.max(0, Math.round(rect.y * dpr));
  const cw = Math.round(rect.w * dpr);
  const ch = Math.round(rect.h * dpr);
  const src = PNG.sync.read(readFileSync(fullPath));
  const w = Math.min(cw, src.width - cx);
  const h = Math.min(ch, src.height - cy);
  if (w <= 0 || h <= 0) {
    return { full: relative(OUT_DIR, fullPath).replace(/\\/g, "/"), crop: null, error: "out-of-bounds" };
  }
  const dst = new PNG({ width: w, height: h });
  PNG.bitblt(src, dst, cx, cy, w, h, 0, 0);
  writeFileSync(cropPath, PNG.sync.write(dst));
  return {
    full: relative(OUT_DIR, fullPath).replace(/\\/g, "/"),
    crop: relative(OUT_DIR, cropPath).replace(/\\/g, "/"),
    rect: { x: cx, y: cy, w, h, dpr },
  };
};

const trimToSubreddit = (url) => {
  if (!url) return null;
  const m = url.match(/^(https?:\/\/(?:www\.)?reddit\.com\/r\/[^/?#]+)/i);
  return m ? m[1] : null;
};

const extractGameNames = (snapshot) => {
  const names = [];
  const re = /button "Play (.+?)"\s*\[ref=/g;
  let m;
  while ((m = re.exec(snapshot)) !== null) {
    const name = m[1].trim();
    if (name && !names.includes(name)) names.push(name);
  }
  return names;
};

const findButtonRef = (snapshot, label) => {
  const re = new RegExp(`button "${label}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

const findPlayRef = (snapshot, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`button "Play ${escaped}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

/* ----------------------------- browser routines ----------------------------- */

const openBrowser = () => {
  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));
};

// Navigate to the Launchpad. If tab === "new", switch to the New tab.
// Returns a fresh interactive snapshot.
// Snapshot, retrying until at least one "Play <name>" tile is present
// (the carousel renders after the heading, so a single early snapshot misses it).
const snapshotWithTiles = (attempts = 6) => {
  let snap = ab(`snapshot -i -c`);
  for (let i = 0; i < attempts && !/button "Play /.test(snap); i++) {
    jitterWait(1500);
    snap = ab(`snapshot -i -c`);
  }
  return snap;
};

const openLaunchpad = (tab = "popular") => {
  abSafe(`eval "window.location.href='${LAUNCHPAD_URL}'"`, { timeout: 15000 });
  jitterWait(4500);
  try { ab(`wait --text "Games Launchpad" --timeout 25000`); } catch {}
  jitterWait(800);

  let snap = snapshotWithTiles();
  if (tab === "new") {
    const newRef = findButtonRef(snap, "New");
    if (newRef) {
      ab(`click ${newRef}`);
      jitterWait(2000);
      snap = snapshotWithTiles();
    }
  }
  return snap;
};

// Click a game's tile in the given tab and return the trimmed subreddit URL.
const resolveSubredditUrl = (name, tab) => {
  const snap = openLaunchpad(tab);
  const ref = findPlayRef(snap, name);
  if (!ref) return { error: "ref-not-found" };

  abSafe(`scrollintoview ${ref}`, { timeout: 8000 });
  jitterWait(800);
  abSafe(`click ${ref}`, { timeout: 12000 });
  jitterWait(3500);

  const landed = currentUrl();
  const subreddit = trimToSubreddit(landed);
  return { landedUrl: landed, subreddit };
};

// Visit a subreddit and scrape created date, description, weekly counts.
const scrapeSubreddit = (subUrl) => {
  abSafe(`eval "window.location.href='${subUrl}'"`, { timeout: 15000 });
  jitterWait(4500);
  abSafe(
    `eval "document.querySelector('[slot=\\"community-details\\"]')?.scrollIntoView({block:'center'})"`,
    { timeout: 8000 }
  );
  jitterWait(1000);

  const script = `
    (() => {
      const deepQuery = (sel) => {
        const find = (root) => {
          if (!root || !root.querySelector) return null;
          const hit = root.querySelector(sel);
          if (hit) return hit;
          const all = root.querySelectorAll('*');
          for (const el of all) {
            if (el.shadowRoot) { const inner = find(el.shadowRoot); if (inner) return inner; }
          }
          return null;
        };
        return find(document);
      };
      const txt = (el) => el ? (el.innerText || el.textContent || '').trim() : null;
      const usersEl = deepQuery('[slot="weekly-active-users-count"]');
      const contribEl = deepQuery('[slot="weekly-contributions-count"]');
      const details = document.querySelector('[slot="community-details"]');
      let createdIso = null, createdDisplay = null;
      if (details) {
        const t = details.querySelector('time[datetime]');
        if (t) createdIso = t.getAttribute('datetime');
        const text = (details.innerText || details.textContent || '').trim();
        const m = text.match(/Created\\s+([A-Z][a-z]+\\s+\\d{1,2},\\s*\\d{4})/);
        if (m) createdDisplay = m[1];
      }
      const descEl = deepQuery('#description, .i18n-subreddit-description');
      return JSON.stringify({
        weeklyActiveUsersRaw: txt(usersEl),
        weeklyContributionsRaw: txt(contribEl),
        createdIso, createdDisplay,
        description: txt(descEl),
      });
    })()
  `.replace(/\s+/g, " ").trim();
  return parseEval(abSafe(`eval ${JSON.stringify(script)}`, { timeout: 12000 })) || {};
};

/* ----------------------------------- API ------------------------------------ */

const fetchApiGames = async () => {
  const res = await fetch(GAMES_API);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return json.games || [];
};

/* ----------------------------------- run ------------------------------------ */

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(SHOT_DIR, { recursive: true });
  const runStamp = new Date().toISOString().replace(/[:.]/g, "-");

  // --- API snapshot ---
  console.log(`Fetching API: ${GAMES_API}`);
  const apiGames = await fetchApiGames();
  const apiByNorm = new Map(apiGames.map((g) => [norm(g.game_name), g]));
  console.log(`API has ${apiGames.length} games.`);

  openBrowser();

  // --- Step 1: read the Launchpad (popular + new) ---
  console.log("\nReading Launchpad: Popular...");
  let snap = openLaunchpad("popular");
  const popularNames = extractGameNames(snap);
  console.log(`  Popular: ${popularNames.length}`);

  console.log("Reading Launchpad: New...");
  snap = openLaunchpad("new");
  const newNames = extractGameNames(snap);
  console.log(`  New: ${newNames.length}`);

  // Build current listings per game name from the Launchpad.
  const launchpadListings = new Map(); // norm -> { name, listings:Set }
  const addListing = (name, tag) => {
    const key = norm(name);
    if (!launchpadListings.has(key)) launchpadListings.set(key, { name, listings: new Set() });
    launchpadListings.get(key).listings.add(tag);
  };
  popularNames.forEach((n) => addListing(n, "popular"));
  newNames.forEach((n) => addListing(n, "new"));

  // --- Step 1b: diff against the API ---
  // The Launchpad UI only exposes Popular + New tabs, so those are the only
  // tags we can observe. "featured" (and any other API-only tag) is preserved
  // from the API and excluded from the diff to avoid false "dropped" changes.
  const OBSERVABLE = ["popular", "new"];
  const observable = (arr) => [...arr].filter((t) => OBSERVABLE.includes(t)).sort();

  const newGames = [];        // in Launchpad, not in API
  const listingChanges = [];  // observable listing set differs
  for (const [key, { name, listings }] of launchpadListings) {
    const api = apiByNorm.get(key);
    const current = observable(listings);
    if (!api) {
      newGames.push({ game_name: name, listings: current });
    } else {
      const prev = observable(api.listings || []);
      if (prev.join(",") !== current.join(",")) {
        listingChanges.push({ game_name: name, from: prev, to: current });
      }
    }
  }
  console.log(`\nDiff vs API: ${newGames.length} new game(s), ${listingChanges.length} listing change(s).`);
  newGames.forEach((g) => console.log(`  + NEW: ${g.game_name} [${g.listings.join(", ")}]`));
  listingChanges.forEach((c) => console.log(`  ~ ${c.game_name}: ${c.from.join("/")} -> ${c.to.join("/")}`));

  // --- Step 2: resolve subreddit URLs where missing ---
  // Need a URL for: brand-new games, and tracked games whose sub_address is null.
  const needUrl = [];
  for (const [key, { name, listings }] of launchpadListings) {
    const api = apiByNorm.get(key);
    if (!api || !api.sub_address) {
      const tab = listings.has("new") ? "new" : "popular";
      needUrl.push({ key, name, tab, isNew: !api });
    }
  }
  console.log(`\nResolving subreddit URLs for ${needUrl.length} game(s)...`);
  const resolvedUrls = new Map(); // key -> subreddit
  for (const item of needUrl) {
    const res = resolveSubredditUrl(item.name, item.tab);
    if (res.subreddit) {
      resolvedUrls.set(item.key, res.subreddit);
      console.log(`  ${item.name} -> ${res.subreddit}`);
    } else {
      console.warn(`  ! ${item.name}: ${res.error || "no url"}`);
    }
  }

  // --- Step 3: scrape every resolvable subreddit ---
  // Combine API games + launchpad games into one set keyed by norm name.
  const allKeys = new Set([...apiByNorm.keys(), ...launchpadListings.keys()]);
  console.log(`\nScraping ${allKeys.size} subreddits for weekly counts + metadata...`);

  const results = [];
  let i = 0;
  for (const key of allKeys) {
    i++;
    const api = apiByNorm.get(key);
    const lp = launchpadListings.get(key);
    const name = lp?.name || api?.game_name || key;
    const subUrl = api?.sub_address || resolvedUrls.get(key) || null;

    // Observable tags (popular/new) come from the Launchpad when present;
    // API-only tags (e.g. "featured") are carried over so we don't lose them.
    const observed = lp ? observable(lp.listings) : observable(api?.listings || []);
    const apiOnly = [...(api?.listings || [])].filter((t) => !OBSERVABLE.includes(t));
    const listings = [...new Set([...observed, ...apiOnly])].sort();

    console.log(`\n[${i}/${allKeys.size}] ${name}`);
    if (!subUrl) {
      console.warn(`  ! no subreddit URL, skipping scrape`);
      results.push({
        id: api?.id ?? null,
        game_name: name,
        sub_address: null,
        listings,
        inApi: !!api,
        inLaunchpad: !!lp,
        isNew: !api && !!lp,
        error: "no-subreddit-url",
      });
      continue;
    }

    const info = scrapeSubreddit(subUrl);
    console.log(
      `  users=${info.weeklyActiveUsersRaw ?? "—"} contribs=${info.weeklyContributionsRaw ?? "—"} created=${info.createdIso ?? info.createdDisplay ?? "—"} desc=${info.description ? "yes" : "—"}`
    );

    // Screenshot the game tile only for newly listed games (in the Launchpad
    // but not yet tracked by the API). We're already on the subreddit page.
    const isNew = !api && !!lp;
    let screenshot = null;
    if (isNew) {
      try {
        screenshot = captureGameTile(name, runStamp);
        console.log(`  screenshot: ${screenshot.crop ?? screenshot.full} ${screenshot.error ? `(${screenshot.error})` : ""}`);
      } catch (e) {
        console.warn(`  ! screenshot failed: ${e.message}`);
        screenshot = { error: e.message };
      }
    }

    results.push({
      id: api?.id ?? null,
      game_name: name,
      sub_address: subUrl,
      listings,
      genre: api?.genre ?? null,
      inApi: !!api,
      inLaunchpad: !!lp,
      isNew,
      urlNewlyResolved: resolvedUrls.has(key),
      weeklyActiveUsers: { raw: info.weeklyActiveUsersRaw ?? null, value: parseCount(info.weeklyActiveUsersRaw) },
      weeklyContributions: { raw: info.weeklyContributionsRaw ?? null, value: parseCount(info.weeklyContributionsRaw) },
      createdIso: info.createdIso ?? null,
      createdDisplay: info.createdDisplay ?? null,
      description: info.description ?? null,
      screenshot,
    });
  }

  // --- Step 4: log everything ---
  const scrapedAt = new Date().toISOString();
  const data = {
    sources: { launchpad: LAUNCHPAD_URL, api: GAMES_API },
    scrapedAt,
    launchpad: {
      popular: { count: popularNames.length, games: popularNames },
      new: { count: newNames.length, games: newNames },
    },
    diff: {
      newGames,
      listingChanges,
      resolvedUrls: [...resolvedUrls.entries()].map(([k, sub]) => ({
        game_name: launchpadListings.get(k)?.name ?? k,
        subreddit: sub,
      })),
    },
    count: results.length,
    games: results,
  };

  const stamp = scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `reddit-full-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "reddit-full-latest.json"), JSON.stringify(data, null, 2));

  const withUsers = results.filter((r) => r.weeklyActiveUsers?.value != null).length;
  console.log(`\nSaved: ${outPath}`);
  console.log(
    `Games: ${results.length} | New: ${newGames.length} | Listing changes: ${listingChanges.length} | URLs resolved: ${resolvedUrls.size} | Weekly counts: ${withUsers}`
  );

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Pipeline failed:", e.message);
  process.exit(1);
});
