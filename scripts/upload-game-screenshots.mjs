/**
 * Uploads scraped game screenshots (crop + full) to R2 via the deployed
 * /api/upload-image endpoint, then writes both URLs back to tracked_games.
 *
 * Usage:
 *   node scripts/upload-game-screenshots.mjs <path-to-scraped-json>
 *
 * The JSON is expected to look like:
 *   { games: [ { id, game_name, screenshot: { full, crop, rect } }, ... ] }
 *
 * Each `full` / `crop` path is resolved relative to the JSON file's directory.
 */
import { createClient } from '@supabase/supabase-js';
import { readFile, stat } from 'node:fs/promises';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import 'dotenv/config';

const API_BASE = process.env.UPLOAD_API_BASE || 'https://anomalyint.vercel.app';
const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const jsonPath = process.argv[2];
if (!jsonPath) {
  console.error('Usage: node scripts/upload-game-screenshots.mjs <scraped.json>');
  process.exit(1);
}

const absJsonPath = resolve(process.cwd(), jsonPath);
const jsonDir = dirname(absJsonPath);
const data = JSON.parse(await readFile(absJsonPath, 'utf8'));

const games = data.games ?? [];
if (games.length === 0) {
  console.error('No games found in JSON.');
  process.exit(1);
}

const slugify = (s) =>
  s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'game';

async function uploadOne(filePath, prefix) {
  const abs = resolve(jsonDir, filePath);
  await stat(abs); // throws if missing

  const buf = await readFile(abs);
  const fd = new FormData();
  fd.append('file', new Blob([buf], { type: 'image/png' }), basename(abs));
  fd.append('prefix', prefix);

  const res = await fetch(`${API_BASE}/api/upload-image`, { method: 'POST', body: fd });
  const json = await res.json();
  if (!res.ok || !json.url) {
    throw new Error(`Upload failed (${res.status}): ${json.error ?? res.statusText}`);
  }
  return json.url;
}

let ok = 0;
let failed = 0;
const failures = [];

for (const g of games) {
  if (!g.id || !g.screenshot) {
    console.warn(`! skip ${g.game_name || '(no name)'} — missing id or screenshot`);
    continue;
  }
  const prefix = `reddit-games/${slugify(g.game_name)}/screenshots`;
  try {
    const cropPath = g.screenshot.crop;
    const fullPath = g.screenshot.full;
    if (!cropPath && !fullPath) {
      console.warn(`! skip ${g.game_name} — no paths`);
      continue;
    }
    const [cropUrl, fullUrl] = await Promise.all([
      cropPath ? uploadOne(cropPath, prefix) : Promise.resolve(null),
      fullPath ? uploadOne(fullPath, prefix) : Promise.resolve(null),
    ]);

    // Read existing arrays to append.
    const { data: existing, error: fetchErr } = await supabase
      .from('tracked_games')
      .select('screenshots, screenshots_full')
      .eq('id', g.id)
      .single();
    if (fetchErr) throw new Error(`fetch existing: ${fetchErr.message}`);

    const screenshots = Array.from(new Set([...(existing.screenshots ?? []), cropUrl].filter(Boolean)));
    const screenshots_full = Array.from(new Set([...(existing.screenshots_full ?? []), fullUrl].filter(Boolean)));

    const { error: updErr } = await supabase
      .from('tracked_games')
      .update({ screenshots, screenshots_full, last_update: new Date().toISOString() })
      .eq('id', g.id);
    if (updErr) throw new Error(`update: ${updErr.message}`);

    ok++;
    console.log(`✓ ${g.game_name}  crop=${!!cropUrl}  full=${!!fullUrl}`);
  } catch (err) {
    failed++;
    failures.push({ game: g.game_name, error: err?.message ?? String(err) });
    console.error(`✗ ${g.game_name}: ${err?.message ?? err}`);
  }
}

console.log(`\nDone. ${ok} ok, ${failed} failed.`);
if (failures.length) console.log(JSON.stringify(failures, null, 2));
