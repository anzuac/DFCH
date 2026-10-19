-- Existing D1 database dfch-treasure-leaderboard ONLY (not dfch-guide-stats).
-- Execute EACH statement separately in the D1 Console on mobile, in this order.
-- Do not re-run the ALTER TABLE statements after their first successful execution.
ALTER TABLE treasure_players ADD COLUMN nickname TEXT;
ALTER TABLE treasure_players ADD COLUMN nickname_key TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_treasure_players_nickname_key ON treasure_players(nickname_key);
