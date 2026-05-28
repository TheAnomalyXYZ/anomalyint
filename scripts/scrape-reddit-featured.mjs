#!/usr/bin/env node
// Detects the Featured game(s) from the logged-in Reddit left sidebar's
// "GAMES ON REDDIT" section. The Featured tile is the prominent card with a
// "NEW" badge; other entries are "Recently played" suggestions.
//
// Requires a logged-in Chrome profile — agent-browser's own `default` profile
// is anonymous and never sees the sidebar. Pass a real Chrome User Data path:
//
//   REDDIT_CHROME_PROFILE="C:\\Users\\dolon\\AppData\\Local\\Google\\Chrome\\User Data\\Default" \
//   node scripts/scrape-reddit-featured.mjs
//
// Default path below targets the current user's Default profile on Windows.
// Close all Chrome windows before running, otherwise the profile is locked.

import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT_DIR = join(__dirname, "..", "reddit-data-logs");
const REDDIT_URL = "https://www.reddit.com/";

// Use the user-data dir + first profile by default. Override with env.
const CHROME_PROFILE =
  process.env.REDDIT_CHROME_PROFILE ||
  join(homedir(), "AppData", "Local", "Google", "Chrome", "User Data", "Default");

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

// Walks the page (deep through shadow roots) for the "Games on Reddit"
// sidebar section, then collects every tile inside it.
const readSidebar = () => {
  const script = `
    (() => {
      const norm = (s) => (s || '').trim().replace(/\\s+/g, ' ');

      // Walk light + shadow DOM looking for a header element whose text is
      // "GAMES ON REDDIT" (case-insensitive). Return the section element.
      const findSection = (root, seen = new Set()) => {
        if (!root || seen.has(root)) return null;
        seen.add(root);
        const headers = root.querySelectorAll
          ? root.querySelectorAll('h1, h2, h3, h4, h5, span, div, p')
          : [];
        for (const h of headers) {
          if (/^games on reddit$/i.test(norm(h.innerText || h.textContent))) {
            // Climb a few levels to find the surrounding container.
            let node = h.parentElement;
            for (let i = 0; i < 8 && node; i++) {
              if (node.querySelectorAll('a').length >= 2) return node;
              node = node.parentElement;
            }
            return h.parentElement || h;
          }
        }
        const all = root.querySelectorAll ? root.querySelectorAll('*') : [];
        for (const el of all) {
          if (el.shadowRoot) {
            const inner = findSection(el.shadowRoot, seen);
            if (inner) return inner;
          }
        }
        return null;
      };

      const section = findSection(document);
      if (!section) return JSON.stringify({ found: false });

      const items = [];
      // Each game tile is an anchor (or a button) with a title and optional badge.
      const anchors = section.querySelectorAll('a, button');
      const seenLabels = new Set();
      for (const a of anchors) {
        const text = norm(a.innerText || a.textContent);
        if (!text) continue;
        // Skip section header / nav links.
        if (/^games on reddit$/i.test(text)) continue;
        if (/^(start a community|discover more|show more|see more)$/i.test(text)) continue;
        // The tile sometimes wraps multiple anchors (avatar + title). De-dupe.
        const firstLine = text.split('\\n')[0].slice(0, 80);
        if (seenLabels.has(firstLine)) continue;
        seenLabels.add(firstLine);

        const badge = a.querySelector('[class*="badge" i], [aria-label*="new" i]');
        const hasNewBadge = !!(badge && /new/i.test(badge.textContent || badge.getAttribute('aria-label') || ''))
          || /\\bNEW\\b/.test(text);
        const isRecentlyPlayed = /recently played/i.test(text);

        items.push({
          text: text.slice(0, 240),
          href: a.getAttribute && a.getAttribute('href') || null,
          isFeatured: hasNewBadge,
          isRecentlyPlayed,
        });
      }
      return JSON.stringify({ found: true, sectionHTML: section.outerHTML.slice(0, 400), items });
    })()
  `.replace(/\s+/g, " ").trim();
  return parseEval(abSafe(`eval ${JSON.stringify(script)}`, { timeout: 12000 }));
};

const run = async () => {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`Launching headed Chrome with profile:\n  ${CHROME_PROFILE}`);
  console.log(abSafe(`open --headed --profile "${CHROME_PROFILE}"`, { timeout: 30000 }));

  console.log(`Navigating to ${REDDIT_URL} ...`);
  abSafe(`eval "window.location.href='${REDDIT_URL}'"`, { timeout: 15000 });
  jitterWait(5500);

  // Quick login check.
  const loginCheck = parseEval(
    abSafe(`eval "JSON.stringify({ signupLink: !!document.querySelector('a[href*=\\"/login\\"], a[href*=\\"/signup\\"]'), userMenu: !!document.querySelector('[aria-label*=\\"user\\" i], [data-testid*=\\"user\\"]') })"`)
  );
  if (loginCheck?.signupLink && !loginCheck?.userMenu) {
    console.warn(
      "\n!! Page is showing the login/signup link, the sidebar likely isn't going to render.\n" +
      "   Make sure the Chrome profile you passed is already logged into Reddit,\n" +
      "   and that no other Chrome windows are open (the profile gets locked).\n"
    );
  }

  console.log("Reading 'Games on Reddit' sidebar...");
  const info = readSidebar();

  let featured = [];
  let items = [];
  if (info?.found) {
    items = info.items || [];
    featured = items.filter((i) => i.isFeatured);
    console.log(`  Found ${items.length} tile(s); featured: ${featured.length}`);
    items.forEach((i) =>
      console.log(`    ${i.isFeatured ? "★" : i.isRecentlyPlayed ? "•" : "·"} ${i.text.replace(/\n/g, " | ")}`)
    );
  } else {
    console.warn("  Sidebar section 'Games on Reddit' not found.");
  }

  const data = {
    source: REDDIT_URL,
    scrapedAt: new Date().toISOString(),
    sectionFound: !!info?.found,
    featured,
    items,
  };

  const stamp = data.scrapedAt.replace(/[:.]/g, "-");
  const outPath = join(OUT_DIR, `featured-${stamp}.json`);
  writeFileSync(outPath, JSON.stringify(data, null, 2));
  writeFileSync(join(OUT_DIR, "featured-latest.json"), JSON.stringify(data, null, 2));
  console.log(`\nSaved: ${outPath}`);

  try { ab(`close`); } catch {}
};

run().catch((e) => {
  console.error("Featured scrape failed:", e.message);
  process.exit(1);
});
