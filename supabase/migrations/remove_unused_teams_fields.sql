-- Remove unused fields from teams table
-- Run this if the table already exists

ALTER TABLE teams 
DROP COLUMN IF EXISTS team_logo,
DROP COLUMN IF EXISTS points,
DROP COLUMN IF EXISTS goals_for,
DROP COLUMN IF EXISTS goals_against,
DROP COLUMN IF EXISTS wins,
DROP COLUMN IF EXISTS draws,
DROP COLUMN IF EXISTS losses,
DROP COLUMN IF EXISTS home_wins,
DROP COLUMN IF EXISTS home_draws,
DROP COLUMN IF EXISTS home_losses,
DROP COLUMN IF EXISTS away_wins,
DROP COLUMN IF EXISTS away_draws,
DROP COLUMN IF EXISTS away_losses;

