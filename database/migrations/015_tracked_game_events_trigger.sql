-- Change log for tracked_games. The tracked_game_events TABLE is managed by
-- Prisma (npm run db:push). This file holds the parts Prisma can't manage:
-- DB-level defaults (so trigger-inserted rows get id/changed_at) and the
-- AFTER UPDATE trigger that records one event row per changed field.

ALTER TABLE tracked_game_events ALTER COLUMN id SET DEFAULT gen_random_uuid();
ALTER TABLE tracked_game_events ALTER COLUMN changed_at SET DEFAULT now();

-- RLS: allow the anon client to read the log (mirrors the other tracked_* tables).
ALTER TABLE tracked_game_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS tracked_game_events_all ON tracked_game_events;
CREATE POLICY tracked_game_events_all ON tracked_game_events FOR ALL USING (true) WITH CHECK (true);

CREATE OR REPLACE FUNCTION log_tracked_game_changes() RETURNS trigger AS $$
BEGIN
  IF NEW.listings IS DISTINCT FROM OLD.listings THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'listings', to_jsonb(OLD.listings), to_jsonb(NEW.listings));
  END IF;
  IF NEW.genres IS DISTINCT FROM OLD.genres THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'genres', to_jsonb(OLD.genres), to_jsonb(NEW.genres));
  END IF;
  IF NEW.genre IS DISTINCT FROM OLD.genre THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'genre', to_jsonb(OLD.genre), to_jsonb(NEW.genre));
  END IF;
  IF NEW.sub_address IS DISTINCT FROM OLD.sub_address THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'sub_address', to_jsonb(OLD.sub_address), to_jsonb(NEW.sub_address));
  END IF;
  IF NEW.description IS DISTINCT FROM OLD.description THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'description', to_jsonb(OLD.description), to_jsonb(NEW.description));
  END IF;
  IF NEW.created_date IS DISTINCT FROM OLD.created_date THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'created_date', to_jsonb(OLD.created_date), to_jsonb(NEW.created_date));
  END IF;
  IF NEW.moderators IS DISTINCT FROM OLD.moderators THEN
    INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value)
    VALUES (NEW.id, 'moderators', to_jsonb(OLD.moderators), to_jsonb(NEW.moderators));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracked_games_log_changes ON tracked_games;
CREATE TRIGGER tracked_games_log_changes
  AFTER UPDATE ON tracked_games
  FOR EACH ROW EXECUTE FUNCTION log_tracked_game_changes();

-- AFTER INSERT: record a single 'created' event per new game.
CREATE OR REPLACE FUNCTION log_tracked_game_created() RETURNS trigger AS $$
BEGIN
  INSERT INTO tracked_game_events (tracked_game_id, field, old_value, new_value, changed_at)
  VALUES (
    NEW.id,
    'created',
    NULL,
    jsonb_build_object(
      'game_name', NEW.game_name,
      'listings', to_jsonb(NEW.listings),
      'genres', to_jsonb(NEW.genres),
      'sub_address', NEW.sub_address
    ),
    COALESCE(NEW.created_at, now())
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tracked_games_log_create ON tracked_games;
CREATE TRIGGER tracked_games_log_create
  AFTER INSERT ON tracked_games
  FOR EACH ROW EXECUTE FUNCTION log_tracked_game_created();
