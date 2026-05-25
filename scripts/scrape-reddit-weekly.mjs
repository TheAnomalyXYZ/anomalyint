#!/usr/bin/env node
// Fetches the tracked-games list from /api/reddit-games, then visits each
// subreddit via agent-browser to scrape weekly active-users / contributions
// counts. Writes a timestamped JSON snapshot to ../reddit-data-logs/.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
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

// Wait `baseMs` plus a random 0-2000ms jitter to avoid throttling patterns.
const jitterWait = (baseMs = 0) => {
  const total = baseMs + Math.floor(Math.random() * 2000);
  ab(`wait ${total}`);
};

// Reads the text of an element by slot name (descends into shadow roots).
const readBySlot = (slot) => {
  const sel = `[slot="${slot}"]`;
  const script = `
    (() => {
      const find = (root) => {
        if (!root || !root.querySelector) return null;
        const hit = root.querySelector(${JSON.stringify(sel)});
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
      const el = find(document);
      return el ? (el.innerText || el.textContent || '').trim() : null;
    })()
  `.replace(/\s+/g, " ").trim();
  return abSafe(`eval ${JSON.stringify(script)}`, { timeout: 10000 });
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

const cleanEvalOutput = (s) => {
  if (!s) return null;
  const trimmed = s.trim().replace(/^"|"$/g, "").trim();
  if (!trimmed || trimmed === "null" || trimmed.startsWith("[ab error")) return null;
  return trimmed;
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

  jitterWait(4000);
  jitterWait(0);

  const rawUsers = cleanEvalOutput(readBySlot("weekly-active-users-count"));
  const rawContribs = cleanEvalOutput(readBySlot("weekly-contributions-count"));

  const result = {
    id: game.id,
    game_name: game.game_name,
    sub_address: game.sub_address,
    listings: game.listings,
    genre: game.genre,
    weeklyActiveUsers: { raw: rawUsers, value: parseCount(rawUsers) },
    weeklyContributions: { raw: rawContribs, value: parseCount(rawContribs) },
  };

  console.log(`  users=${rawUsers ?? "—"}  contribs=${rawContribs ?? "—"}`);
  return result;
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
  const outPath = join(OUT_DIR, `games-scraped-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "games-scraped-latest.json"), JSON.stringify(data, null, 2));

  console.log(`\nSaved: ${outPath}`);
  const withData = results.filter((r) => r.weeklyActiveUsers?.value != null).length;
  console.log(`Scraped ${withData}/${results.length} with weekly counts.`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
