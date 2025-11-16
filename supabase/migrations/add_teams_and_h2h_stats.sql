-- Migration: Add teams table and h2h_stats to fixtures
-- This migration creates a teams table for storing team statistics
-- and adds h2h_stats field to fixtures table for head-to-head statistics

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id TEXT UNIQUE NOT NULL, -- Internal team ID (e.g., 'arsenal', 'liverpool')
  team_name TEXT NOT NULL, -- Full team name (e.g., 'Arsenal FC')
  external_team_id INTEGER, -- football-data.org team ID
  season TEXT NOT NULL, -- Current season (e.g., '2025')
  
  -- Current league position
  current_position INTEGER,
  
  -- Recent form (last 5 matches)
  recent_form TEXT[], -- Array of results: 'W', 'D', 'L'
  recent_goals_for INTEGER DEFAULT 0,
  recent_goals_against INTEGER DEFAULT 0,
  recent_clean_sheets INTEGER DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, season)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_teams_team_id_season ON teams(team_id, season);
CREATE INDEX IF NOT EXISTS idx_teams_external_id ON teams(external_team_id);

-- Grant permissions (teams table is public read-only data, service role can write)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Allow service role full access
GRANT ALL ON TABLE teams TO service_role;

-- Allow authenticated users to read
GRANT SELECT ON TABLE teams TO authenticated;
GRANT SELECT ON TABLE teams TO anon;

-- Create policy to allow public read access
CREATE POLICY "Teams are viewable by everyone" ON teams
  FOR SELECT
  USING (true);

-- Create policy to allow service role to insert/update
CREATE POLICY "Service role can manage teams" ON teams
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Add h2h_stats column to fixtures table
ALTER TABLE fixtures 
ADD COLUMN IF NOT EXISTS h2h_stats JSONB;

-- Create index for h2h_stats queries
CREATE INDEX IF NOT EXISTS idx_fixtures_h2h_stats ON fixtures USING GIN (h2h_stats);

-- Add comment to document the JSONB structure
COMMENT ON COLUMN fixtures.h2h_stats IS 'Head-to-head statistics JSON object containing:
{
  "team1": "Arsenal FC",
  "team2": "Liverpool FC",
  "h2h_matches": [
    {"date": "2025-04-15", "home": "Arsenal FC", "away": "Liverpool FC", "score": "2-1", "home_score": 2, "away_score": 1}
  ],
  "avg_goals": {
    "team1": {"for": 1.8, "against": 1.1},
    "team2": {"for": 1.2, "against": 1.8}
  },
  "record": {
    "team1": {"wins": 6, "draws": 2, "losses": 2},
    "team2": {"wins": 2, "draws": 2, "losses": 6}
  },
  "last_match": {
    "date": "2025-04-15",
    "home": "Arsenal FC",
    "away": "Liverpool FC",
    "score": "2-1",
    "home_score": 2,
    "away_score": 1
  },
  "updated_at": "2025-01-20T10:00:00Z"
}';

