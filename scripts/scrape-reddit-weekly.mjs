#!/usr/bin/env node
// Scrapes r/PathOfBaa weekly active-user and contribution counts via
// agent-browser and writes a timestamped JSON snapshot to ../reddit-data-logs/.

import { execSync } from "node:child_process";
import { writeFileSync, mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const URL = "https://www.reddit.com/r/PathOfBaa";

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

// Parses "24k", "1.2k", "120" into a number.
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
  // agent-browser eval prints a result line; strip surrounding quotes/whitespace.
  const trimmed = s.trim().replace(/^"|"$/g, "").trim();
  if (!trimmed || trimmed === "null" || trimmed.startsWith("[ab error")) return null;
  return trimmed;
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Launching headed Chrome (default profile)...`);
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));
  console.log(abSafe(`eval "window.location.href='${URL}'"`, { timeout: 15000 }));

  console.log("Waiting for subreddit to render...");
  try { ab(`wait @e1 --timeout 30000`); } catch {}
  ab(`wait 4000`);

  console.log("Reading weekly stats...");
  const rawUsers = cleanEvalOutput(readBySlot("weekly-active-users-count"));
  const rawContribs = cleanEvalOutput(readBySlot("weekly-contributions-count"));

  const data = {
    source: URL,
    scrapedAt: new Date().toISOString(),
    stats: {
      weeklyActiveUsers: { raw: rawUsers, value: parseCount(rawUsers) },
      weeklyContributions: { raw: rawContribs, value: parseCount(rawContribs) },
    },
  };

  const stamp = data.scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `games-scraped-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "games-scraped-latest.json"), JSON.stringify(data, null, 2));

  console.log(`\nSaved: ${outPath}`);
  console.log(`Active users: ${rawUsers} (${data.stats.weeklyActiveUsers.value})`);
  console.log(`Contributions: ${rawContribs} (${data.stats.weeklyContributions.value})`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Scrape failed:", e.message);
  process.exit(1);
});
