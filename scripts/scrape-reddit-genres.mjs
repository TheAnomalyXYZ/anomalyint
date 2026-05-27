#!/usr/bin/env node
// Visits r/GamesOnReddit, opens the Games Launchpad "Browse" tab, and for each
// genre chip clicks in, lists the games in that genre, then returns to Browse
// and moves to the next genre. Saves a genre -> games map as JSON.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const LAUNCHPAD_URL = "https://www.reddit.com/r/GamesOnReddit/";

// Launchpad navigation/control buttons that are not genre chips.
const NON_GENRE = new Set(["Recent", "Popular", "New", "Browse", "Search"]);

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
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`button "${escaped}"\\s*\\[ref=(e\\d+)\\]`);
  const m = snapshot.match(re);
  return m ? `@${m[1]}` : null;
};

// All button labels in the snapshot (used to discover genre chips).
const extractButtonLabels = (snapshot) => {
  const labels = [];
  const re = /button "(.+?)"\s*\[ref=/g;
  let m;
  while ((m = re.exec(snapshot)) !== null) {
    const l = m[1].trim();
    if (l && !labels.includes(l)) labels.push(l);
  }
  return labels;
};

// Re-snapshot until a "Play <name>" tile (or a given label) is present.
const snapshotUntil = (test, attempts = 6) => {
  let snap = ab(`snapshot -i -c`);
  for (let i = 0; i < attempts && !test(snap); i++) {
    jitterWait(1500);
    snap = ab(`snapshot -i -c`);
  }
  return snap;
};

// Navigate to the launchpad and click the Browse tab. Returns
// { snap, baselineLabels } where baselineLabels are the button labels present
// BEFORE Browse was clicked (page chrome, nav, Play tiles) — used to isolate
// genre chips, which only render after clicking Browse.
const openBrowse = () => {
  abSafe(`eval "window.location.href='${LAUNCHPAD_URL}'"`, { timeout: 15000 });
  jitterWait(4500);
  try { ab(`wait --text "Games Launchpad" --timeout 25000`); } catch {}
  jitterWait(800);

  const preSnap = snapshotUntil((s) => findButtonRef(s, "Browse"));
  const baselineLabels = new Set(extractButtonLabels(preSnap));

  const browseRef = findButtonRef(preSnap, "Browse");
  if (!browseRef) throw new Error("Could not find 'Browse' tab button.");
  ab(`click ${browseRef}`);
  jitterWait(1800);
  return { snap: ab(`snapshot -i -c`), baselineLabels };
};

// Genre chips = buttons that appear only after clicking Browse, are not
// "Play …" tiles, and aren't the Browse tab itself.
const discoverGenres = (snap, baselineLabels) =>
  extractButtonLabels(snap).filter(
    (l) => !baselineLabels.has(l) && !l.startsWith("Play ") && !NON_GENRE.has(l)
  );

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));

  console.log("Opening Browse tab...");
  let { snap, baselineLabels } = openBrowse();

  const genres = discoverGenres(snap, baselineLabels);
  console.log(`Found ${genres.length} genres: ${genres.join(", ")}`);

  const byGenre = {};
  for (let i = 0; i < genres.length; i++) {
    const genre = genres[i];
    console.log(`\n[${i + 1}/${genres.length}] ${genre}`);

    // Ensure we're on the Browse view, then click the genre chip.
    let genreRef = findButtonRef(snap, genre);
    if (!genreRef) {
      ({ snap, baselineLabels } = openBrowse());
      genreRef = findButtonRef(snap, genre);
    }
    if (!genreRef) {
      console.warn(`  ! genre chip not found, skipping`);
      byGenre[genre] = { error: "chip-not-found", games: [] };
      continue;
    }

    ab(`click ${genreRef}`);
    jitterWait(2000);
    const genreSnap = snapshotUntil((s) => /button "Play /.test(s) || findButtonRef(s, "Browse"));
    const games = extractGameNames(genreSnap);
    console.log(`  ${games.length} games: ${games.join(", ") || "(none)"}`);
    byGenre[genre] = { count: games.length, games };

    // Go back to Browse for the next genre.
    const backRef = findButtonRef(genreSnap, "Browse");
    if (backRef) {
      ab(`click ${backRef}`);
      jitterWait(1500);
      snap = ab(`snapshot -i -c`);
    } else {
      // Fallback: reload Browse from scratch.
      ({ snap, baselineLabels } = openBrowse());
    }
  }

  const scrapedAt = new Date().toISOString();
  const data = {
    source: LAUNCHPAD_URL,
    scrapedAt,
    genreCount: genres.length,
    genres: byGenre,
  };

  const stamp = scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `genres-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "genres-latest.json"), JSON.stringify(data, null, 2));

  const totalGames = Object.values(byGenre).reduce((n, g) => n + (g.games?.length || 0), 0);
  console.log(`\nSaved: ${outPath}`);
  console.log(`Genres: ${genres.length} | Game listings captured: ${totalGames}`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Genre scrape failed:", e.message);
  process.exit(1);
});
