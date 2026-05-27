#!/usr/bin/env node
// Fetches the tracked-games list from /api/reddit-games, visits each
// subreddit via agent-browser, and scrapes in a single pass:
//   - weekly active-users / contributions counts
//   - community created date (ISO + display)
//   - community description (shadow-DOM aware)
//   - cropped screenshot of the <devvit2-custom-post> game tile
// Writes a timestamped JSON snapshot to ../reddit-data-logs/.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const SHOT_DIR = join(OUT_DIR, "screenshots");
const GAMES_API = "https://anomalyint.vercel.app/api/reddit-games";
const SELECTOR = "devvit2-custom-post";

const ab = (args, opts = {}) => {
  const cmd = `agent-browser ${args}`;
  return execSync(cmd, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
    timeout: 25000,
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

const parseEval = (raw) => {
  try {
    const trimmed = (raw || "").trim();
    if (!trimmed || trimmed === "null") return null;
    const once = trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed;
    return typeof once === "string" ? JSON.parse(once) : once;
  } catch { return null; }
};

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

const slugify = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// One eval pulls weekly counts + created date + description, walking shadow DOMs.
const readAll = () => {
  const script = `
    (() => {
      const deepQuery = (sel) => {
        const find = (root) => {
          if (!root || !root.querySelector) return null;
          const hit = root.querySelector(sel);
          if (hit) return hit;
          const all = root.querySelectorAll('*');
          for (const el of all) {
            if (el.shadowRoot) {
              const inner = find(el.shadowRoot);
              if (inner) return inner;
            }
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
        createdIso,
        createdDisplay,
        description: txt(descEl),
      });
    })()
  `.replace(/\s+/g, " ").trim();
  return parseEval(abSafe(`eval ${JSON.stringify(script)}`, { timeout: 12000 }));
};

const captureGameTile = (game, stamp) => {
  abSafe(
    `eval "(()=>{const host=document.querySelector('${SELECTOR}');if(!host)return;const inner=host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div')||host;inner.scrollIntoView({block:'center'});})()"`,
    { timeout: 8000 }
  );
  jitterWait(1200);

  const rectScript = `
    (() => {
      const host = document.querySelector('${SELECTOR}');
      if (!host) return null;
      const inner = host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div') || host;
      const r = inner.getBoundingClientRect();
      return JSON.stringify({ x:r.x, y:r.y, w:r.width, h:r.height, dpr: window.devicePixelRatio || 1 });
    })()
  `.replace(/\s+/g, " ").trim();
  const rect = parseEval(abSafe(`eval ${JSON.stringify(rectScript)}`, { timeout: 8000 }));

  const base = `${slugify(game.game_name)}-${stamp}`;
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

const fetchGames = async () => {
  const res = await fetch(GAMES_API);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return (json.games || []).filter(
    (g) => g.sub_address && Array.isArray(g.listings) && g.listings.includes("new")
  );
};

const scrapeGame = (game, stamp) => {
  console.log(`\n→ ${game.game_name} (${game.sub_address})`);
  abSafe(`eval "window.location.href='${game.sub_address}'"`, { timeout: 15000 });

  jitterWait(4500);
  jitterWait(0);

  abSafe(
    `eval "document.querySelector('[slot=\\"community-details\\"]')?.scrollIntoView({block:'center'})"`,
    { timeout: 8000 }
  );
  jitterWait(1000);

  const info = readAll() || {};
  console.log(
    `  users=${info.weeklyActiveUsersRaw ?? "—"}  contribs=${info.weeklyContributionsRaw ?? "—"}  created=${info.createdIso ?? info.createdDisplay ?? "—"}  desc=${info.description ? "yes" : "—"}`
  );

  let screenshot = null;
  try {
    screenshot = captureGameTile(game, stamp);
    console.log(`  screenshot: ${screenshot.crop ?? screenshot.full} ${screenshot.error ? `(${screenshot.error})` : ""}`);
  } catch (e) {
    console.warn(`  ! screenshot failed: ${e.message}`);
    screenshot = { error: e.message };
  }

  return {
    id: game.id,
    game_name: game.game_name,
    sub_address: game.sub_address,
    listings: game.listings,
    genre: game.genre,
    weeklyActiveUsers: { raw: info.weeklyActiveUsersRaw ?? null, value: parseCount(info.weeklyActiveUsersRaw) },
    weeklyContributions: { raw: info.weeklyContributionsRaw ?? null, value: parseCount(info.weeklyContributionsRaw) },
    createdIso: info.createdIso ?? null,
    createdDisplay: info.createdDisplay ?? null,
    description: info.description ?? null,
    screenshot,
  };
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(SHOT_DIR, { recursive: true });

  console.log(`Fetching games list from ${GAMES_API}...`);
  const games = await fetchGames();
  console.log(`Found ${games.length} games with sub_address.`);

  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));

  const scrapedAt = new Date().toISOString();
  const stamp = scrapedAt.replace(/[:.]/g, "-");

  const results = [];
  for (const game of games) {
    try {
      results.push(scrapeGame(game, stamp));
    } catch (e) {
      console.warn(`  ! failed: ${e.message}`);
      results.push({
        id: game.id,
        game_name: game.game_name,
        sub_address: game.sub_address,
        error: e.message,
      });
    }
  }

  const data = {
    source: GAMES_API,
    scrapedAt,
    count: results.length,
    games: results,
  };

  const outPath = join(OUT_DIR, `games-combined-with-screenshot-new-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(
    join(OUT_DIR, "games-combined-with-screenshot-new-latest.json"),
    JSON.stringify(data, null, 2)
  );

  const withUsers = results.filter((r) => r.weeklyActiveUsers?.value != null).length;
  const withDate = results.filter((r) => r.createdIso || r.createdDisplay).length;
  const withDesc = results.filter((r) => r.description).length;
  const withShot = results.filter((r) => r.screenshot?.crop).length;
  console.log(`\nSaved: ${outPath}`);
  console.log(`Users: ${withUsers}/${results.length} | Dates: ${withDate}/${results.length} | Descs: ${withDesc}/${results.length} | Shots: ${withShot}/${results.length}`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
