#!/usr/bin/env node
// Scrapes r/GamesOnReddit Games Launchpad (Popular + New) via agent-browser
// and writes a timestamped JSON snapshot to ../reddit-data-logs/.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const URL = "https://www.reddit.com/r/GamesOnReddit/";
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

const extractGames = (snapshot) => {
  const games = [];
  const re = /button "Play (.+?)"\s*\[ref=/g;
  let m;
  while ((m = re.exec(snapshot)) !== null) {
    const name = m[1].trim();
    if (name && !games.includes(name)) games.push(name);
  }
  return games;
};

const findButtonRef = (snapshot, label) => {
  const re = new RegExp(`button "${label}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Launching headed Chrome (default profile)...`);
  // `open <url>` blocks until full load on Reddit (challenge keeps network busy),
  // so we open blank, navigate via JS, and poll for the launchpad iframe instead.
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));
  console.log(abSafe(`eval "window.location.href='${URL}'"`, { timeout: 15000 }));

  console.log("Waiting for launchpad to render...");
  try { ab(`wait --text "Games Launchpad" --timeout 30000`); }
  catch { ab(`wait 8000`); }
  ab(`wait 1500`);

  console.log("Snapshotting Popular tab...");
  let snap = ab(`snapshot -i -c`);
  const popular = extractGames(snap);

  const newRef = findButtonRef(snap, "New");
  let neu = [];
  if (newRef) {
    console.log(`Clicking ${newRef} (New)...`);
    ab(`click ${newRef}`);
    ab(`wait 2000`);
    snap = ab(`snapshot -i -c`);
    neu = extractGames(snap);
  } else {
    console.warn("Could not locate 'New' button ref.");
  }

  const data = {
    source: URL,
    scrapedAt: new Date().toISOString(),
    sections: {
      popular: { count: popular.length, games: popular },
      new: { count: neu.length, games: neu },
    },
  };

  const stamp = data.scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `games-launchpad-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "games-launchpad-latest.json"), JSON.stringify(data, null, 2));

  console.log(`\nSaved: ${outPath}`);
  console.log(`Popular: ${popular.length} games | New: ${neu.length} games`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
