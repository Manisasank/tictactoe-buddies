-- ============================================================
-- Tic Tac Toe Buddies — Supabase Schema
-- Run this in your Supabase SQL editor before starting the app
-- ============================================================

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_x      TEXT NOT NULL,
  player_o      TEXT,                        -- NULL until someone joins
  board         TEXT[] DEFAULT ARRAY[
                  NULL,NULL,NULL,
                  NULL,NULL,NULL,
                  NULL,NULL,NULL
                ]::TEXT[],
  current_turn  TEXT DEFAULT 'X',            -- 'X' or 'O'
  status        TEXT DEFAULT 'waiting',      -- waiting | active | finished
  winner        TEXT,                        -- 'X', 'O', or 'draw'
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at ON game_sessions;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON game_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Enable Row Level Security
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (for joining games)
CREATE POLICY "Allow read" ON game_sessions FOR SELECT USING (true);
-- Allow anyone to insert (create a game)
CREATE POLICY "Allow insert" ON game_sessions FOR INSERT WITH CHECK (true);
-- Allow anyone to update (make moves)
CREATE POLICY "Allow update" ON game_sessions FOR UPDATE USING (true);

-- Enable realtime on this table (run in Supabase dashboard → Database → Replication)
-- Or run: ALTER PUBLICATION supabase_realtime ADD TABLE game_sessions;
