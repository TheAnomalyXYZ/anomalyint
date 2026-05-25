#!/usr/bin/env node
// Test script: visits r/PathOfBaa, scrolls the <devvit2-custom-post> element
// into view, and screenshots just that element into
// ../reddit-data-logs/screenshots/.

import { execSync } from "node:child_process";
import { mkdirSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SHOT_DIR = join(__dirname, "..", "reddit-data-logs", "screenshots");
const URL = "https://www.reddit.com/r/PathOfBaa/";
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

const run = async () => {
  mkdirSync(SHOT_DIR, { recursive: true });

  console.log("Launching headed Chrome (default profile)...");
  console.log(abSafe(`open --headed --profile default`, { timeout: 25000 }));
  console.log(abSafe(`eval "window.location.href='${URL}'"`, { timeout: 15000 }));

  console.log("Waiting for subreddit to render...");
  jitterWait(5000);
  try { ab(`wait --text "Path of Baa" --timeout 20000`); } catch {}
  jitterWait(2000);

  console.log(`Scrolling ${SELECTOR} into view...`);
  abSafe(
    `eval "document.querySelector('${SELECTOR}')?.scrollIntoView({block:'center'})"`,
    { timeout: 8000 }
  );
  jitterWait(1500);

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outPath = join(SHOT_DIR, `pathofbaa-custom-post-${stamp}.png`);

  console.log(`Capturing ${SELECTOR} → ${outPath}`);
  console.log(abSafe(`screenshot "${SELECTOR}" "${outPath}"`, { timeout: 20000 }));

  console.log(`\nDone: ${outPath}`);
  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Screenshot test failed:", e.message);
  process.exit(1);
});
