#!/usr/bin/env node
// Test script: visits r/PathOfBaa, scrolls the <devvit2-custom-post> element
// into view, and screenshots just that element into
// ../reddit-data-logs/screenshots/.

import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

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

  console.log(`Centering ${SELECTOR} in viewport...`);
  abSafe(
    `eval "(()=>{const host=document.querySelector('${SELECTOR}');if(!host)return;const inner=host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div')||host;inner.scrollIntoView({block:'center'});})()"`,
    { timeout: 8000 }
  );
  jitterWait(1500);

  // Grab the on-screen rect of the inner game element + the devicePixelRatio,
  // so we can crop the viewport screenshot precisely.
  const rectScript = `
    (() => {
      const host = document.querySelector('${SELECTOR}');
      if (!host) return null;
      const inner = host.shadowRoot?.querySelector('devvit-blocks-renderer,iframe,div') || host;
      const r = inner.getBoundingClientRect();
      return JSON.stringify({ x:r.x, y:r.y, w:r.width, h:r.height, dpr: window.devicePixelRatio || 1 });
    })()
  `.replace(/\s+/g, " ").trim();
  const rectRaw = abSafe(`eval ${JSON.stringify(rectScript)}`, { timeout: 8000 });
  let rect = null;
  try {
    const trimmed = rectRaw.trim();
    // agent-browser may print the value JSON-encoded (a quoted string).
    // Unwrap one layer if needed, then parse the inner JSON object.
    const once = trimmed.startsWith('"') ? JSON.parse(trimmed) : trimmed;
    rect = typeof once === "string" ? JSON.parse(once) : once;
  } catch (e) {
    console.warn(`Could not parse rect: ${e.message}. raw=${rectRaw.trim().slice(0, 200)}`);
  }

  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fullPath = join(SHOT_DIR, `pathofbaa-full-${stamp}.png`);
  const cropPath = join(SHOT_DIR, `pathofbaa-custom-post-${stamp}.png`);

  console.log(`Capturing viewport → ${fullPath}`);
  console.log(abSafe(`screenshot "${fullPath}"`, { timeout: 20000 }));

  if (rect && rect.w > 0 && rect.h > 0) {
    const dpr = rect.dpr || 1;
    const cx = Math.max(0, Math.round(rect.x * dpr));
    const cy = Math.max(0, Math.round(rect.y * dpr));
    const cw = Math.round(rect.w * dpr);
    const ch = Math.round(rect.h * dpr);

    const src = PNG.sync.read(readFileSync(fullPath));
    const w = Math.min(cw, src.width - cx);
    const h = Math.min(ch, src.height - cy);
    const dst = new PNG({ width: w, height: h });
    PNG.bitblt(src, dst, cx, cy, w, h, 0, 0);
    writeFileSync(cropPath, PNG.sync.write(dst));
    console.log(`Cropped → ${cropPath} (${w}x${h} from ${src.width}x${src.height} @ ${cx},${cy})`);
  } else {
    console.warn(`No rect for ${SELECTOR}; skipping crop. (raw="${rectRaw.trim()}")`);
  }

  console.log(`\nDone.`);
  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Screenshot test failed:", e.message);
  process.exit(1);
});
