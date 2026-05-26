-- Seed tracked_games from r/GamesOnReddit scrape (2026-05-25)
-- Idempotent: re-running this updates listings but won't duplicate games or metrics.

-- RLS: allow public read/write (mirror brand_profiles policy style).
ALTER TABLE tracked_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE tracked_game_weekly_metrics ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tracked_games_all" ON tracked_games;
CREATE POLICY "tracked_games_all" ON tracked_games FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "tracked_game_weekly_metrics_all" ON tracked_game_weekly_metrics;
CREATE POLICY "tracked_game_weekly_metrics_all" ON tracked_game_weekly_metrics FOR ALL USING (true) WITH CHECK (true);

-- Upsert games. listings reflects which sections the game appeared in this scrape.
INSERT INTO tracked_games (game_name, listings) VALUES
  ('Path of Baa: Flocklands', ARRAY['popular']),
  ('Common Grounds', ARRAY['popular']),
  ('Cat Builder', ARRAY['popular','new']),
  ('chainwordpuzzle', ARRAY['popular']),
  ('Sword & Supper', ARRAY['popular']),
  ('LETTERSET', ARRAY['popular']),
  ('4 Pics 1 Word', ARRAY['popular']),
  ('Mahjong Arena', ARRAY['popular']),
  ('MOSAIK', ARRAY['popular']),
  ('Pixelary', ARRAY['popular']),
  ('BattleBirds', ARRAY['popular']),
  ('Tap Me +1', ARRAY['popular','new']),
  ('Pixisle', ARRAY['popular']),
  ('Element Synergy', ARRAY['popular']),
  ('Mosaic', ARRAY['popular']),
  ('PetPost', ARRAY['popular','new']),
  ('guessthebreed', ARRAY['popular','new']),
  ('Color Puzzle', ARRAY['popular','new']),
  ('playbrocil', ARRAY['popular','new']),
  ('Voxelhood', ARRAY['popular','new']),
  ('Piece of Cake: Merge & Bake', ARRAY['popular','new']),
  ('Blocktide', ARRAY['popular']),
  ('Social Poker', ARRAY['popular','new']),
  ('kaboom-game', ARRAY['popular']),
  ('Bubble Shooter Pro', ARRAY['popular']),
  ('Syllo', ARRAY['popular']),
  ('Quiz Planet', ARRAY['popular']),
  ('Thread Brawlers', ARRAY['popular']),
  ('Stonefall', ARRAY['popular']),
  ('Level', ARRAY['popular','new']),
  ('Now Play Again', ARRAY['popular','new']),
  ('Nuzzle-The-Puzzle', ARRAY['new']),
  ('Pipe Panic', ARRAY['new']),
  ('Bunny Trials', ARRAY['new']),
  ('WordFusion', ARRAY['new']),
  ('imagereveal', ARRAY['new']),
  ('Spottit', ARRAY['new']),
  ('Designer Eye', ARRAY['new']),
  ('TimeFrame', ARRAY['new']),
  ('ChessForge', ARRAY['new']),
  ('Syllabyte', ARRAY['new']),
  ('blinkwords', ARRAY['new']),
  ('MiniGawf', ARRAY['new']),
  ('Shift Puzzler', ARRAY['new']),
  ('SerpenTiles', ARRAY['new']),
  ('Daily Guess', ARRAY['new']),
  ('romkerl', ARRAY['new']),
  ('Hexaword', ARRAY['new']),
  ('Riddonkulous', ARRAY['new']),
  ('Chess Quiz Plus', ARRAY['new'])
ON CONFLICT (game_name) DO UPDATE
  SET listings = EXCLUDED.listings,
      updated_at = NOW();

-- Enrich Sword & Supper with manually gathered details.
UPDATE tracked_games
SET
  sub_address = 'https://www.reddit.com/r/SwordAndSupperGame',
  moderators = ARRAY[
    'u/swordnsupper_mod',
    'u/cabbagesys_deployer',
    'u/CabbageKevin',
    'u/brassicattract',
    'u/ntbdev'
  ],
  last_update = NOW(),
  updated_at = NOW()
WHERE game_name = 'Sword & Supper';

-- Rolling 7-day reading for Sword & Supper as of scrape date.
INSERT INTO tracked_game_weekly_metrics (tracked_game_id, measured_on, users, contributions)
SELECT id, DATE '2026-05-25', 76000, 39000
FROM tracked_games WHERE game_name = 'Sword & Supper'
ON CONFLICT (tracked_game_id, measured_on) DO UPDATE
  SET users = EXCLUDED.users,
      contributions = EXCLUDED.contributions;
