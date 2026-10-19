-- V1.5 / Google login foundation only.
-- Run in the dedicated dfch-treasure-leaderboard D1 database, never GUIDE_STATS.
CREATE TABLE IF NOT EXISTS treasure_players (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 google_sub TEXT NOT NULL UNIQUE,
 display_name TEXT NOT NULL DEFAULT '玩家',
 nickname TEXT,
 nickname_key TEXT,
 created_at INTEGER NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_treasure_players_nickname_key ON treasure_players(nickname_key);
-- NULL means this player has not yet chosen a nickname; SQLite UNIQUE permits multiple NULLs.
CREATE TABLE IF NOT EXISTS treasure_sessions (
 token_hash TEXT PRIMARY KEY,
 player_id INTEGER NOT NULL REFERENCES treasure_players(id) ON DELETE CASCADE,
 created_at INTEGER NOT NULL,
 expires_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_treasure_sessions_player ON treasure_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_treasure_sessions_expires ON treasure_sessions(expires_at);
-- Scores and official drawings are reserved for the separately reviewed server-side scoring stage.
CREATE TABLE IF NOT EXISTS treasure_player_scores (
 player_id INTEGER PRIMARY KEY REFERENCES treasure_players(id) ON DELETE CASCADE,
 total_points INTEGER NOT NULL DEFAULT 0 CHECK(total_points >= 0),
 best_single_points INTEGER NOT NULL DEFAULT 0 CHECK(best_single_points >= 0),
 official_draw_count INTEGER NOT NULL DEFAULT 0 CHECK(official_draw_count >= 0)
);
CREATE TABLE IF NOT EXISTS treasure_official_draws (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id INTEGER NOT NULL REFERENCES treasure_players(id) ON DELETE CASCADE,
 draw_date TEXT NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 score INTEGER NOT NULL CHECK(score >= 0),
 reward_count INTEGER NOT NULL CHECK(reward_count >= 4),
 reward_summary TEXT NOT NULL,
 completed_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_treasure_draws_player_date ON treasure_official_draws(player_id,draw_date);
CREATE INDEX IF NOT EXISTS idx_treasure_draws_score ON treasure_official_draws(score DESC,completed_at ASC);

-- Challenge V1. Created automatically by the Worker on first authenticated use.
-- Each row is ONE quota-consuming chest, regardless of its reward count.
-- Only revealed_count advances; rewards_json is sealed server-side until shown.
CREATE TABLE IF NOT EXISTS treasure_challenge_runs (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 player_id INTEGER NOT NULL REFERENCES treasure_players(id) ON DELETE CASCADE,
 day_key TEXT NOT NULL,
 request_id TEXT NOT NULL UNIQUE,
 rewards_json TEXT NOT NULL,
 reward_count INTEGER NOT NULL CHECK(reward_count >= 4),
 total_points INTEGER NOT NULL CHECK(total_points >= 0),
 revealed_count INTEGER NOT NULL DEFAULT 0 CHECK(revealed_count >= 0 AND revealed_count <= reward_count),
 started_at INTEGER NOT NULL,
 completed_at INTEGER
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_treasure_challenge_active
 ON treasure_challenge_runs(player_id) WHERE completed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_treasure_challenge_day
 ON treasure_challenge_runs(player_id, day_key);

-- EX secret prize: first server-side REVEAL unlocks the displayed odds.
-- Nickname is snapshotted permanently and survives later leaderboard changes.
CREATE TABLE IF NOT EXISTS treasure_ultimate_discovery (
 prize_type TEXT PRIMARY KEY CHECK(prize_type='EX'),
 player_id INTEGER REFERENCES treasure_players(id) ON DELETE SET NULL,
 nickname TEXT NOT NULL,
 challenge_id INTEGER NOT NULL UNIQUE,
 discovered_at INTEGER NOT NULL
);
