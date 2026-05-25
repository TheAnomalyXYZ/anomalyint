import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

interface IncomingGame {
  id?: string;
  game_name?: string;
  gameName?: string;
  weeklyActiveUsers?: { value?: number } | number | null;
  weeklyContributions?: { value?: number } | number | null;
  users?: number | null;
  contributions?: number | null;
}

function extractNumber(v: any): number | null {
  if (v == null) return null;
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : null;
  if (typeof v === 'object' && typeof v.value === 'number') {
    return Number.isFinite(v.value) ? Math.round(v.value) : null;
  }
  return null;
}

function mondayOf(dateStr?: string): string {
  const d = dateStr ? new Date(dateStr) : new Date();
  if (Number.isNaN(d.getTime())) throw new Error('Invalid weekOf date');
  const day = d.getUTCDay(); // 0=Sun..6=Sat
  const offset = day === 0 ? -6 : 1 - day;
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY } = process.env;
  if (!VITE_SUPABASE_URL || !VITE_SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing Supabase env vars' });
  }
  const supabase = createClient(VITE_SUPABASE_URL, VITE_SUPABASE_SERVICE_ROLE_KEY);

  const body = req.body ?? {};
  const rawGames: IncomingGame[] = Array.isArray(body) ? body : body.games ?? [];
  if (!Array.isArray(rawGames) || rawGames.length === 0) {
    return res.status(400).json({ error: 'Provide "games" array (or a top-level array) in body' });
  }

  let weekOf: string;
  try {
    weekOf = mondayOf(body.weekOf);
  } catch (e: any) {
    return res.status(400).json({ error: e.message });
  }

  // Resolve game ids: anything missing an id is matched by game_name.
  const namesToResolve = rawGames
    .filter(g => !g.id && (g.game_name || g.gameName))
    .map(g => (g.game_name || g.gameName)!) as string[];

  const nameToId = new Map<string, string>();
  if (namesToResolve.length > 0) {
    const { data: matches, error: lookupErr } = await supabase
      .from('tracked_games')
      .select('id, game_name')
      .in('game_name', namesToResolve);
    if (lookupErr) {
      return res.status(500).json({ error: 'Lookup failed', message: lookupErr.message });
    }
    (matches ?? []).forEach((r: any) => nameToId.set(r.game_name, r.id));
  }

  const rows: { tracked_game_id: string; week_of: string; users: number | null; contributions: number | null }[] = [];
  const skipped: { input: IncomingGame; reason: string }[] = [];

  for (const g of rawGames) {
    const trackedId = g.id || nameToId.get((g.game_name || g.gameName || '') as string);
    if (!trackedId) {
      skipped.push({ input: g, reason: 'No matching tracked_games row (need id or game_name)' });
      continue;
    }
    const users = extractNumber(g.weeklyActiveUsers ?? g.users);
    const contributions = extractNumber(g.weeklyContributions ?? g.contributions);
    if (users == null && contributions == null) {
      skipped.push({ input: g, reason: 'No users or contributions value' });
      continue;
    }
    rows.push({ tracked_game_id: trackedId, week_of: weekOf, users, contributions });
  }

  if (rows.length === 0) {
    return res.status(400).json({ error: 'No valid rows to upsert', skipped });
  }

  const { data, error } = await supabase
    .from('tracked_game_weekly_metrics')
    .upsert(rows, { onConflict: 'tracked_game_id,week_of' })
    .select();

  if (error) {
    return res.status(500).json({ error: 'Upsert failed', message: error.message });
  }

  return res.status(200).json({
    weekOf,
    upserted: data?.length ?? 0,
    skipped,
  });
}
