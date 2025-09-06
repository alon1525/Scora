-- Fix fixture points for all users
-- Paste this code into your Supabase SQL Editor

-- First, let's see the current state
SELECT 
  display_name,
  fixture_points,
  total_points,
  exact_predictions,
  result_predictions,
  total_predictions
FROM user_profiles 
WHERE fixture_predictions IS NOT NULL
ORDER BY total_points DESC;

-- Update fixture points for all users based on finished fixtures
WITH finished_fixtures AS (
  SELECT 
    id,
    home_score,
    away_score,
    status
  FROM fixtures 
  WHERE status = 'FINISHED' 
    AND home_score IS NOT NULL 
    AND away_score IS NOT NULL
),
user_points AS (
  SELECT 
    up.id,
    up.display_name,
    up.fixture_predictions,
    up.table_points,
    COALESCE(SUM(
      CASE 
        -- Exact score match = 3 points
        WHEN (up.fixture_predictions->ff.id::text->>'home_score')::int = ff.home_score 
         AND (up.fixture_predictions->ff.id::text->>'away_score')::int = ff.away_score THEN 3
        -- Correct result (win/draw/loss) = 1 point
        WHEN ((up.fixture_predictions->ff.id::text->>'home_score')::int > (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score > ff.away_score) OR
             ((up.fixture_predictions->ff.id::text->>'home_score')::int < (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score < ff.away_score) OR
             ((up.fixture_predictions->ff.id::text->>'home_score')::int = (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score = ff.away_score) THEN 1
        ELSE 0
      END
    ), 0) as calculated_fixture_points,
    COUNT(CASE WHEN (up.fixture_predictions->ff.id::text->>'home_score')::int = ff.home_score 
               AND (up.fixture_predictions->ff.id::text->>'away_score')::int = ff.away_score THEN 1 END) as exact_count,
    COUNT(CASE WHEN ((up.fixture_predictions->ff.id::text->>'home_score')::int > (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score > ff.away_score) OR
                     ((up.fixture_predictions->ff.id::text->>'home_score')::int < (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score < ff.away_score) OR
                     ((up.fixture_predictions->ff.id::text->>'home_score')::int = (up.fixture_predictions->ff.id::text->>'away_score')::int AND ff.home_score = ff.away_score) THEN 1 END) as result_count,
    COUNT(ff.id) as total_predictions_count
  FROM user_profiles up
  CROSS JOIN finished_fixtures ff
  WHERE up.fixture_predictions IS NOT NULL
    AND (up.fixture_predictions->ff.id::text->>'home_score') IS NOT NULL
    AND (up.fixture_predictions->ff.id::text->>'away_score') IS NOT NULL
  GROUP BY up.id, up.display_name, up.fixture_predictions, up.table_points
)
UPDATE user_profiles 
SET 
  fixture_points = up.calculated_fixture_points,
  exact_predictions = up.exact_count,
  result_predictions = up.result_count - up.exact_count, -- Subtract exact from result to avoid double counting
  total_predictions = up.total_predictions_count,
  total_points = up.calculated_fixture_points + COALESCE(user_profiles.table_points, 0),
  updated_at = NOW()
FROM user_points up
WHERE user_profiles.id = up.id;

-- Show the updated results
SELECT 
  display_name,
  fixture_points,
  table_points,
  total_points,
  exact_predictions,
  result_predictions,
  total_predictions,
  updated_at
FROM user_profiles 
WHERE fixture_predictions IS NOT NULL
ORDER BY total_points DESC;
