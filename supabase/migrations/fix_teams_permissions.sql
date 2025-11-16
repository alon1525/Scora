-- Fix permissions for teams table if migration was already run
-- Run this in Supabase SQL Editor if you get "permission denied" errors

-- Grant permissions to service role
GRANT ALL ON TABLE teams TO service_role;

-- Grant read permissions
GRANT SELECT ON TABLE teams TO authenticated;
GRANT SELECT ON TABLE teams TO anon;

-- Enable RLS if not already enabled
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Teams are viewable by everyone" ON teams;
DROP POLICY IF EXISTS "Service role can manage teams" ON teams;

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

