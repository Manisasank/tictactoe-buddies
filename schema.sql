-- ============================================================
-- XO Arena — Supabase Schema
-- Run this in your Supabase SQL Editor
-- ============================================================

-- Drop old table if exists
DROP TABLE IF EXISTS game_sessions;
DROP TABLE IF EXISTS users;

-- Users table (accounts, stats, points)
CREATE TABLE users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username        TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  wins            INT DEFAULT 0,
  losses          INT DEFAULT 0,
  draws           INT DEFAULT 0,
  points          INT DEFAULT 0,
  streak          INT DEFAULT 0,
  xp              INT DEFAULT 0,
  achievements    TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Game sessions table
CREATE TABLE game_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x      TEXT NOT NULL,
  player_o      TEXT,
  board         TEXT[] DEFAULT ARRAY[NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL]::TEXT[],
  current_turn  TEXT DEFAULT 'X',
  status        TEXT DEFAULT 'waiting',
  winner        TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON game_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read users"   ON users FOR SELECT USING (true);
CREATE POLICY "Allow insert users" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update users" ON users FOR UPDATE USING (true);

CREATE POLICY "Allow read games"   ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Allow insert games" ON game_sessions FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update games" ON game_sessions FOR UPDATE USING (true);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
