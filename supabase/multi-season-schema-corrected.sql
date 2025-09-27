-- Multi-Season Support Database Schema (CORRECTED for existing structure)
-- This script adds multi-season support to your existing database
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. CREATE SEASON MANAGEMENT TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS seasons (
    id SERIAL PRIMARY KEY,
    season_code VARCHAR(7) NOT NULL UNIQUE, -- e.g., '2024-25', '2025-26'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    is_active BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==============================================
-- 2. CREATE USER BEST STATS TABLE
-- ==============================================

CREATE TABLE IF NOT EXISTS user_best_stats (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    best_table_score INTEGER DEFAULT 0,
    best_fixture_score INTEGER DEFAULT 0,
    best_exact_predictions INTEGER DEFAULT 0,
    best_result_predictions INTEGER DEFAULT 0,
    best_total_predictions INTEGER DEFAULT 0,
    best_badges_count INTEGER DEFAULT 0,
    best_season VARCHAR(7), -- Which season they achieved their best
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- ==============================================
-- 3. ADD SEASON COLUMNS TO EXISTING TABLES
-- ==============================================

-- Add current_season to user_profiles (for tracking which season user is in)
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS current_season VARCHAR(7) DEFAULT '2024-25';

-- Add season to fixture_comments (if not already exists)
ALTER TABLE fixture_comments 
ADD COLUMN IF NOT EXISTS season VARCHAR(7) DEFAULT '2024-25';

-- ==============================================
-- 4. CREATE SEASON MANAGEMENT FUNCTIONS
-- ==============================================

-- Function to get current active season
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS VARCHAR(7) AS $$
DECLARE
    current_season VARCHAR(7);
BEGIN
    SELECT season_code INTO current_season
    FROM seasons
    WHERE is_active = true
    ORDER BY start_date DESC
    LIMIT 1;
    
    RETURN COALESCE(current_season, '2024-25');
END;
$$ LANGUAGE plpgsql;

-- Function to check if season transition is needed (July 1st logic)
CREATE OR REPLACE FUNCTION check_season_transition()
RETURNS BOOLEAN AS $$
DECLARE
    current_date DATE := CURRENT_DATE;
    current_year INTEGER := EXTRACT(YEAR FROM current_date);
    july_1st DATE := (current_year || '-07-01')::DATE;
    transition_needed BOOLEAN := false;
BEGIN
    -- Check if today is July 1st or later in the current year
    -- and we haven't already transitioned this year
    IF current_date >= july_1st THEN
        -- Check if we already have a season for this year
        IF NOT EXISTS (
            SELECT 1 FROM seasons 
            WHERE season_code LIKE (current_year || '-%')
        ) THEN
            transition_needed := true;
        END IF;
    END IF;
    
    RETURN transition_needed;
END;
$$ LANGUAGE plpgsql;

-- Function to update user best stats (works with your existing structure)
CREATE OR REPLACE FUNCTION update_user_best_stats(p_user_id UUID, p_season VARCHAR(7))
RETURNS VOID AS $$
DECLARE
    current_table_score INTEGER;
    current_fixture_score INTEGER;
    current_exact_predictions INTEGER;
    current_result_predictions INTEGER;
    current_total_predictions INTEGER;
    current_badges_count INTEGER;
    best_table_score INTEGER;
    best_fixture_score INTEGER;
    best_exact_predictions INTEGER;
    best_result_predictions INTEGER;
    best_total_predictions INTEGER;
    best_badges_count INTEGER;
    best_season VARCHAR(7);
BEGIN
    -- Get current season stats from user_profiles
    SELECT 
        table_points,
        fixture_points,
        exact_predictions,
        result_predictions,
        total_predictions,
        (exact_predictions + result_predictions) as badges_count
    INTO 
        current_table_score,
        current_fixture_score,
        current_exact_predictions,
        current_result_predictions,
        current_total_predictions,
        current_badges_count
    FROM user_profiles
    WHERE user_id = p_user_id;
    
    -- Get current best stats
    SELECT 
        best_table_score,
        best_fixture_score,
        best_exact_predictions,
        best_result_predictions,
        best_total_predictions,
        best_badges_count,
        best_season
    INTO 
        best_table_score,
        best_fixture_score,
        best_exact_predictions,
        best_result_predictions,
        best_total_predictions,
        best_badges_count,
        best_season
    FROM user_best_stats
    WHERE user_id = p_user_id;
    
    -- Update best stats if current season is better
    INSERT INTO user_best_stats (
        user_id,
        best_table_score,
        best_fixture_score,
        best_exact_predictions,
        best_result_predictions,
        best_total_predictions,
        best_badges_count,
        best_season
    ) VALUES (
        p_user_id,
        COALESCE(current_table_score, 0),
        COALESCE(current_fixture_score, 0),
        COALESCE(current_exact_predictions, 0),
        COALESCE(current_result_predictions, 0),
        COALESCE(current_total_predictions, 0),
        COALESCE(current_badges_count, 0),
        p_season
    )
    ON CONFLICT (user_id) DO UPDATE SET
        best_table_score = GREATEST(user_best_stats.best_table_score, COALESCE(current_table_score, 0)),
        best_fixture_score = GREATEST(user_best_stats.best_fixture_score, COALESCE(current_fixture_score, 0)),
        best_exact_predictions = GREATEST(user_best_stats.best_exact_predictions, COALESCE(current_exact_predictions, 0)),
        best_result_predictions = GREATEST(user_best_stats.best_result_predictions, COALESCE(current_result_predictions, 0)),
        best_total_predictions = GREATEST(user_best_stats.best_total_predictions, COALESCE(current_total_predictions, 0)),
        best_badges_count = GREATEST(user_best_stats.best_badges_count, COALESCE(current_badges_count, 0)),
        best_season = CASE 
            WHEN COALESCE(current_table_score, 0) > user_best_stats.best_table_score 
                OR COALESCE(current_fixture_score, 0) > user_best_stats.best_fixture_score
                OR COALESCE(current_exact_predictions, 0) > user_best_stats.best_exact_predictions
                OR COALESCE(current_result_predictions, 0) > user_best_stats.best_result_predictions
                OR COALESCE(current_total_predictions, 0) > user_best_stats.best_total_predictions
                OR COALESCE(current_badges_count, 0) > user_best_stats.best_badges_count
            THEN p_season
            ELSE user_best_stats.best_season
        END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to reset user data for new season (works with your existing structure)
CREATE OR REPLACE FUNCTION reset_user_data_for_new_season(p_new_season VARCHAR(7))
RETURNS VOID AS $$
BEGIN
    -- Update current season in user profiles and reset all data
    UPDATE user_profiles 
    SET current_season = p_new_season,
        table_prediction = NULL,
        fixture_predictions = '{}',
        fixture_points = 0,
        table_points = 0,
        total_points = 0,
        exact_predictions = 0,
        result_predictions = 0,
        total_predictions = 0,
        close_predictions = 0,
        updated_at = NOW();
    
    -- Clear old season comments
    DELETE FROM fixture_comments WHERE season != p_new_season;
    
    -- Update season status
    UPDATE seasons SET is_active = false WHERE is_active = true;
    UPDATE seasons SET is_active = true WHERE season_code = p_new_season;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_current_season ON user_profiles(current_season);
CREATE INDEX IF NOT EXISTS idx_fixture_comments_season ON fixture_comments(season);
CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active);
CREATE INDEX IF NOT EXISTS idx_user_best_stats_user_id ON user_best_stats(user_id);

-- ==============================================
-- 6. INSERT INITIAL SEASON DATA
-- ==============================================

-- Insert current season (2024-25)
INSERT INTO seasons (season_code, start_date, end_date, is_active) 
VALUES ('2024-25', '2024-08-17', '2025-05-25', true)
ON CONFLICT (season_code) DO NOTHING;

-- ==============================================
-- 7. CREATE RLS POLICIES
-- ==============================================

-- Enable RLS on new tables
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_best_stats ENABLE ROW LEVEL SECURITY;

-- Seasons table - everyone can read
CREATE POLICY "Anyone can read seasons" ON seasons FOR SELECT USING (true);

-- User best stats - users can only see their own
CREATE POLICY "Users can view own best stats" ON user_best_stats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own best stats" ON user_best_stats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own best stats" ON user_best_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
