#!/usr/bin/env node
// Fetches the tracked-games list from /api/reddit-games, visits each
// subreddit via agent-browser, and scrapes the community sidebar:
//   - created date (ISO + display string)
//   - moderator usernames
// Writes a timestamped JSON snapshot to ../reddit-data-logs/.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const GAMES_API = "https://anomalyint.vercel.app/api/reddit-games";

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

const parseEval = (raw) => {
  try {
    const trimmed = (raw || "").trim();
    if (!trimmed || trimmed === "null") return null;
    const once = trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed;
    return typeof once === "string" ? JSON.parse(once) : once;
  } catch { return null; }
};

// Returns { createdIso, createdDisplay, description }.
// Description lives inside a shadow root on some subs, so we walk shadow DOMs.
const readCommunityInfo = () => {
  const script = `
    (() => {
      const details = document.querySelector('[slot="community-details"]');
      let createdIso = null, createdDisplay = null;
      if (details) {
        const t = details.querySelector('time[datetime]');
        if (t) createdIso = t.getAttribute('datetime');
        const text = (details.innerText || details.textContent || '').trim();
        const m = text.match(/Created\\s+([A-Z][a-z]+\\s+\\d{1,2},\\s*\\d{4})/);
        if (m) createdDisplay = m[1];
      }
      const findDesc = (root) => {
        if (!root || !root.querySelector) return null;
        const hit = root.querySelector('#description, .i18n-subreddit-description');
        if (hit) return hit;
        const all = root.querySelectorAll('*');
        for (const el of all) {
          if (el.shadowRoot) {
            const inner = findDesc(el.shadowRoot);
            if (inner) return inner;
          }
        }
        return null;
      };
      const descEl = findDesc(document);
      const description = descEl ? (descEl.innerText || descEl.textContent || '').trim() : null;
      return JSON.stringify({ createdIso, createdDisplay, description });
    })()
  `.replace(/\s+/g, " ").trim();
  return parseEval(abSafe(`eval ${JSON.stringify(script)}`, { timeout: 10000 }));
};

const fetchGames = async () => {
  const res = await fetch(GAMES_API);
  if (!res.ok) throw new Error(`API ${res.status}`);
  const json = await res.json();
  return (json.games || []).filter((g) => g.sub_address);
};

const scrapeGame = (game) => {
  console.log(`\n→ ${game.game_name} (${game.sub_address})`);
  abSafe(`eval "window.location.href='${game.sub_address}'"`, { timeout: 15000 });

  jitterWait(4500);
  jitterWait(0);

  // Scroll the sidebar into view so it's hydrated.
  abSafe(
    `eval "document.querySelector('[slot=\\"community-details\\"]')?.scrollIntoView({block:'center'})"`,
    { timeout: 8000 }
  );
  jitterWait(1000);

  const info = readCommunityInfo() || {};
  console.log(
    `  created=${info.createdIso ?? info.createdDisplay ?? "—"}  desc=${info.description ? "yes" : "—"}`
  );

  return {
    id: game.id,
    game_name: game.game_name,
    sub_address: game.sub_address,
    listings: game.listings,
    genre: game.genre,
    createdIso: info.createdIso ?? null,
    createdDisplay: info.createdDisplay ?? null,
    description: info.description ?? null,
  };
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Fetching games list from ${GAMES_API}...`);
  const games = await fetchGames();
  console.log(`Found ${games.length} games with sub_address.`);

  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));

  const results = [];
  for (const game of games) {
    try {
      results.push(scrapeGame(game));
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
    scrapedAt: new Date().toISOString(),
    count: results.length,
    games: results,
  };

  const stamp = data.scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `games-community-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "games-community-latest.json"), JSON.stringify(data, null, 2));

  const withDate = results.filter((r) => r.createdIso || r.createdDisplay).length;
  const withDesc = results.filter((r) => r.description).length;
  console.log(`\nSaved: ${outPath}`);
  console.log(`Dates: ${withDate}/${results.length} | Descriptions: ${withDesc}/${results.length}`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
