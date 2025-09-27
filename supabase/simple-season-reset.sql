-- Simple Season Reset Schema
-- This script adds minimal season support to your existing database
-- Season transitions happen automatically on July 25th each year
-- Run this in your Supabase SQL Editor

-- ==============================================
-- 1. ADD BEST STATS TO USER_PROFILES
-- ==============================================

-- Add best_stats JSONB field to user_profiles
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS best_stats JSONB DEFAULT '{
  "best_table_score": 0,
  "best_fixture_score": 0,
  "best_exact_predictions": 0,
  "best_result_predictions": 0,
  "best_total_predictions": 0,
  "best_badges_count": 0,
  "best_season": null
}'::jsonb;

-- ==============================================
-- 2. NO ADDITIONAL COLUMNS NEEDED
-- ==============================================

-- We don't need fixture_comments.season since we clear all comments each season

-- ==============================================
-- 3. CREATE SIMPLE RESET FUNCTION
-- ==============================================

-- Function to reset everything for new season
CREATE OR REPLACE FUNCTION reset_for_new_season(p_new_season VARCHAR(7))
RETURNS VOID AS $$
BEGIN
    -- 1. Update best stats for all users before resetting
    UPDATE user_profiles 
    SET best_stats = jsonb_build_object(
        'best_table_score', GREATEST((best_stats->>'best_table_score')::int, table_points),
        'best_fixture_score', GREATEST((best_stats->>'best_fixture_score')::int, fixture_points),
        'best_exact_predictions', GREATEST((best_stats->>'best_exact_predictions')::int, exact_predictions),
        'best_result_predictions', GREATEST((best_stats->>'best_result_predictions')::int, result_predictions),
        'best_total_predictions', GREATEST((best_stats->>'best_total_predictions')::int, total_predictions),
        'best_badges_count', GREATEST((best_stats->>'best_badges_count')::int, exact_predictions + result_predictions),
        'best_season', CASE 
            WHEN table_points > (best_stats->>'best_table_score')::int 
                OR fixture_points > (best_stats->>'best_fixture_score')::int
                OR exact_predictions > (best_stats->>'best_exact_predictions')::int
                OR result_predictions > (best_stats->>'best_result_predictions')::int
                OR total_predictions > (best_stats->>'best_total_predictions')::int
                OR (exact_predictions + result_predictions) > (best_stats->>'best_badges_count')::int
            THEN p_new_season
            ELSE best_stats->>'best_season'
        END
    );
    
    -- 2. Reset user_profiles data
    UPDATE user_profiles 
    SET 
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
    
    -- 3. Clear all fixture comments (fixtures and standings will be refreshed from API)
    DELETE FROM fixture_comments;
    
    -- Note: fixtures and standings tables will be refreshed with new season data from API
    -- This happens in the backend when the API calls are made after reset
    
    -- 6. Clear all leagues (optional - you might want to keep them)
    -- DELETE FROM league_memberships;
    -- DELETE FROM leagues;
    
    RAISE NOTICE 'Season reset completed for %', p_new_season;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- ==============================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_best_stats ON user_profiles USING GIN (best_stats);

-- ==============================================
-- 5. TEST FUNCTION (OPTIONAL)
-- ==============================================

-- Function to test the reset (you can call this manually)
CREATE OR REPLACE FUNCTION test_season_reset()
RETURNS TEXT AS $$
BEGIN
    -- This is just for testing - don't run in production!
    -- PERFORM reset_for_new_season('2025-26');
    RETURN 'Test function created - call reset_for_new_season(''2025-26'') manually if needed';
END;
$$ LANGUAGE plpgsql;
