#!/usr/bin/env node
// Visits r/GamesOnReddit, switches to the "New" tab of the Games Launchpad,
// clicks each game tile in turn, captures the URL it opens, trims it down
// to just the subreddit root, and saves a JSON list.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const LAUNCHPAD_URL = "https://www.reddit.com/r/GamesOnReddit/";

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

// Pulls the current URL from `agent-browser get url`.
const currentUrl = () => abSafe(`get url`, { timeout: 8000 }).trim();

// Finds a button ref by its exact "Play <name>" label in the snapshot.
const findPlayRef = (snapshot, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`button "Play ${escaped}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

const findButtonRef = (snapshot, label) => {
  const re = new RegExp(`button "${label}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

// Extracts unique "Play <name>" labels from a snapshot.
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

// "https://www.reddit.com/r/NuzzleThePuzzle/comments/1xy/foo/?x=1" → "https://www.reddit.com/r/NuzzleThePuzzle"
const trimToSubreddit = (url) => {
  if (!url) return null;
  const m = url.match(/^(https?:\/\/(?:www\.)?reddit\.com\/r\/[^/?#]+)/i);
  return m ? m[1] : null;
};

// Navigate to the launchpad and switch to the New tab. Returns the
// fresh interactive snapshot.
const openNewTab = () => {
  abSafe(`eval "window.location.href='${LAUNCHPAD_URL}'"`, { timeout: 15000 });
  jitterWait(4500);
  try { ab(`wait --text "Games Launchpad" --timeout 20000`); } catch {}
  jitterWait(800);

  let snap = ab(`snapshot -i -c`);
  const newRef = findButtonRef(snap, "New");
  if (!newRef) throw new Error("Could not find 'New' tab button.");
  ab(`click ${newRef}`);
  jitterWait(2000);
  snap = ab(`snapshot -i -c`);
  return snap;
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));

  console.log("Loading launchpad, switching to New...");
  let snap = openNewTab();
  const names = extractGameNames(snap);
  console.log(`Found ${names.length} games in New: ${names.join(", ")}`);

  const results = [];
  for (let i = 0; i < names.length; i++) {
    const name = names[i];
    console.log(`\n[${i + 1}/${names.length}] ${name}`);

    // After the first iteration the launchpad is gone (we navigated away).
    if (i > 0) snap = openNewTab();

    const ref = findPlayRef(snap, name);
    if (!ref) {
      console.warn(`  ! no ref for "${name}", skipping`);
      results.push({ name, error: "ref-not-found" });
      continue;
    }

    // Tiles past the 5th are off-screen in the horizontal launchpad carousel.
    // Scroll the target tile into view (and wait for any lazy render) before
    // clicking, otherwise the click is a no-op.
    abSafe(`scrollintoview ${ref}`, { timeout: 8000 });
    jitterWait(800);

    abSafe(`click ${ref}`, { timeout: 12000 });
    jitterWait(3500);

    const landed = currentUrl();
    const subreddit = trimToSubreddit(landed);
    console.log(`  landed: ${landed}`);
    console.log(`  → ${subreddit ?? "(no match)"}`);

    results.push({ name, landedUrl: landed, subreddit });
  }

  const scrapedAt = new Date().toISOString();
  const data = {
    source: LAUNCHPAD_URL,
    tab: "new",
    scrapedAt,
    count: results.length,
    games: results,
  };

  const stamp = scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `new-tab-urls-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "new-tab-urls-latest.json"), JSON.stringify(data, null, 2));

  const ok = results.filter((r) => r.subreddit).length;
  console.log(`\nSaved: ${outPath}`);
  console.log(`Captured ${ok}/${results.length} subreddit URLs.`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
