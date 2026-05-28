/**
 * Ingests a scraped games JSON into Supabase via the JS client.
 *
 * Writes (per game, matched by `id`, falling back to `game_name`):
 *   - description, created_date, sub_address, genre  → tracked_games
 *       (fill-only by default: existing non-null values are preserved unless --overwrite)
 *   - users / contributions                          → tracked_game_weekly_metrics
 *       (upsert on (tracked_game_id, measured_on); re-running the same day overwrites)
 *
 * Does NOT handle screenshots — those go through scripts/upload-game-screenshots.mjs
 * because they need the /api/upload-image (R2) endpoint.
 *
 * Usage:
 *   node scripts/ingest-games.mjs <scraped.json> [--date YYYY-MM-DD] [--overwrite] [--dry-run]
 *
 * Flags:
 *   --date       measured_on for the weekly reading. Default: the JSON's scrapedAt
 *                date, else today (UTC).
 *   --overwrite  overwrite description/created_date/sub_address/genre even when the
 *                row already has a value. Default: fill only nulls.
 *   --dry-run    print what would change without writing.
 *
 * Env (from .env):
 *   VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */
import { createClient } from '@supabase/supabase-js';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import 'dotenv/config';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE_KEY in env');
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const args = process.argv.slice(2);
const jsonPath = args.find(a => !a.startsWith('--'));
const overwrite = args.includes('--overwrite');
const dryRun = args.includes('--dry-run');
const createMissing = args.includes('--create-missing');
const skipListings = args.includes('--no-listings');
const dateFlag = (() => {
  const i = args.indexOf('--date');
  return i >= 0 ? args[i + 1] : null;
})();

if (!jsonPath) {
  console.error('Usage: node scripts/ingest-games.mjs <scraped.json> [--date YYYY-MM-DD] [--overwrite] [--create-missing] [--no-listings] [--dry-run]');
  process.exit(1);
}

const data = JSON.parse(await readFile(resolve(process.cwd(), jsonPath), 'utf8'));
const games = data.games ?? [];
if (games.length === 0) {
  console.error('No games[] found in JSON.');
  process.exit(1);
}

const asDate = (s) => {
  const d = s ? new Date(s) : new Date();
  if (Number.isNaN(d.getTime())) throw new Error(`Invalid date: ${s}`);
  return d.toISOString().slice(0, 10);
};
const measuredOn = asDate(dateFlag ?? data.scrapedAt);

// Build launchpad sets if the scrape includes them (reddit-full format).
// We'll use these to reconcile listings: each game's new listings become
// (current launchpad tags) ∪ (any existing tag that isn't a launchpad tag).
// That preserves manually-curated tags like "featured".
const SCRAPE_LISTING_TAGS = new Set(['popular', 'new']);
const lpPopular = new Set(data.launchpad?.popular?.games ?? []);
const lpNew = new Set(data.launchpad?.new?.games ?? []);
const hasLaunchpad = !skipListings && (lpPopular.size > 0 || lpNew.size > 0);

const num = (v) => {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : null;
  if (typeof v === 'object' && typeof v.value === 'number') return Math.round(v.value);
  return null;
};

console.log(`Ingesting ${games.length} games · measured_on=${measuredOn} · overwrite=${overwrite} · createMissing=${createMissing} · dryRun=${dryRun}\n`);

// Resolve ids for games that only have a name.
const namesNeedingId = games.filter(g => !g.id && g.game_name).map(g => g.game_name);
const nameToId = new Map();
if (namesNeedingId.length) {
  const { data: rows, error } = await supabase
    .from('tracked_games').select('id, game_name').in('game_name', namesNeedingId);
  if (error) { console.error('Name lookup failed:', error.message); process.exit(1); }
  for (const r of rows ?? []) nameToId.set(r.game_name, r.id);
}

const metricRows = [];
let updated = 0, skipped = 0, created = 0;
const skips = [];

for (const g of games) {
  let id = g.id || nameToId.get(g.game_name);

  // Fetch existing to honor fill-only semantics (also tells us if the row exists).
  let existing = null;
  if (id) {
    const { data: row } = await supabase
      .from('tracked_games')
      .select('description, created_date, sub_address, genre, genres, listings')
      .eq('id', id).maybeSingle();
    existing = row;
  }

  // Create the game if it's missing and the flag is set.
  if (!existing) {
    if (!createMissing) {
      skipped++;
      skips.push({ game: g.game_name, reason: 'no matching tracked_games row (use --create-missing)' });
      continue;
    }
    if (!g.game_name) {
      skipped++;
      skips.push({ game: '(unnamed)', reason: 'cannot create without game_name' });
      continue;
    }
    const nowIso = new Date().toISOString();
    const insertRow = {
      id: crypto.randomUUID(),
      game_name: g.game_name,
      sub_address: g.sub_address ?? null,
      genre: g.genre ?? null,
      genres: Array.isArray(g.genres) ? g.genres : (g.genre ? [g.genre] : []),
      description: g.description ?? null,
      created_date: g.createdIso ? g.createdIso.slice(0, 10) : null,
      listings: Array.isArray(g.listings) ? g.listings : [],
      created_at: nowIso,
      updated_at: nowIso,
      last_update: nowIso,
    };
    if (dryRun) {
      console.log(`+ create ${g.game_name} (listings: ${insertRow.listings.join(',') || 'none'})`);
      created++;
      // No id yet in dry-run, so we can't queue a metric row reliably; skip metric preview for new games.
      continue;
    }
    const { data: inserted, error: insErr } = await supabase
      .from('tracked_games')
      .insert(insertRow)
      .select('id')
      .single();
    if (insErr) { skipped++; skips.push({ game: g.game_name, reason: `insert failed: ${insErr.message}` }); continue; }
    id = inserted.id;
    existing = insertRow; // freshly inserted, so fill-only patch below will be a no-op
    created++;
    console.log(`+ created ${g.game_name}`);
  }

  const patch = {};
  const consider = (col, value) => {
    if (value == null || value === '') return;
    if (overwrite || existing[col] == null || existing[col] === '') patch[col] = value;
  };
  consider('description', g.description);
  consider('created_date', g.createdIso ? g.createdIso.slice(0, 10) : null);
  consider('sub_address', g.sub_address);
  consider('genre', g.genre);

  // genres[] — prefer a scraped array, else seed from the single genre. Fill-only:
  // only set when the row has no genres yet (unless --overwrite).
  const scrapedGenres = Array.isArray(g.genres) ? g.genres : (g.genre ? [g.genre] : []);
  if (scrapedGenres.length && (overwrite || !(existing.genres?.length))) {
    patch.genres = scrapedGenres;
  }

  // listings[] — reconcile against the launchpad. Curation tags (e.g. "featured")
  // are preserved by unioning them with whatever the launchpad currently shows.
  if (hasLaunchpad && g.game_name) {
    const launchpadTags = [];
    if (lpPopular.has(g.game_name)) launchpadTags.push('popular');
    if (lpNew.has(g.game_name)) launchpadTags.push('new');
    const existingListings = Array.isArray(existing.listings) ? existing.listings : [];
    const curationTags = existingListings.filter(t => !SCRAPE_LISTING_TAGS.has(t));
    const target = [...new Set([...launchpadTags, ...curationTags])];
    const same =
      target.length === existingListings.length &&
      target.every(t => existingListings.includes(t));
    if (!same) patch.listings = target;
  }

  if (Object.keys(patch).length) {
    patch.last_update = new Date().toISOString();
    if (dryRun) {
      console.log(`~ ${g.game_name}: ${Object.keys(patch).filter(k => k !== 'last_update').join(', ')}`);
    } else {
      const { error: updErr } = await supabase.from('tracked_games').update(patch).eq('id', id);
      if (updErr) { skipped++; skips.push({ game: g.game_name, reason: updErr.message }); continue; }
    }
    updated++;
  }

  const users = num(g.weeklyActiveUsers ?? g.users);
  const contributions = num(g.weeklyContributions ?? g.contributions);
  if (users != null || contributions != null) {
    metricRows.push({ id: crypto.randomUUID(), tracked_game_id: id, measured_on: measuredOn, users, contributions });
  }
}

if (metricRows.length) {
  if (dryRun) {
    console.log(`\n[dry-run] would upsert ${metricRows.length} metric rows for ${measuredOn}`);
  } else {
    const { error } = await supabase
      .from('tracked_game_weekly_metrics')
      .upsert(metricRows, { onConflict: 'tracked_game_id,measured_on' });
    if (error) { console.error('Metric upsert failed:', error.message); process.exit(1); }
  }
}

console.log(`\nDone. created: ${created}, games updated: ${updated}, metric rows: ${metricRows.length}, skipped: ${skipped}`);
if (skips.length) console.log(JSON.stringify(skips, null, 2));
