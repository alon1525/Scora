-- Test predictions for user alon1525 (fixtures 1, 2, 3 - all 30 games)
-- Paste this code into your Supabase SQL Editor

-- First, let's check if alon1525 user exists and get their ID
SELECT id, display_name, email FROM user_profiles WHERE display_name = 'alon1525' OR email LIKE '%alon1525%';

-- Update user_profiles with fixture_predictions JSONB for fixtures 1, 2, 3
-- This matches the actual database schema where predictions are stored in user_profiles.fixture_predictions

UPDATE user_profiles 
SET 
  fixture_predictions = '{
    "1": {"home_score": 2, "away_score": 1},
    "2": {"home_score": 1, "away_score": 3},
    "3": {"home_score": 0, "away_score": 2},
    "4": {"home_score": 2, "away_score": 0},
    "5": {"home_score": 1, "away_score": 1},
    "6": {"home_score": 3, "away_score": 1},
    "7": {"home_score": 2, "away_score": 2},
    "8": {"home_score": 1, "away_score": 0},
    "9": {"home_score": 0, "away_score": 3},
    "10": {"home_score": 2, "away_score": 1},
    "11": {"home_score": 1, "away_score": 2},
    "12": {"home_score": 3, "away_score": 0},
    "13": {"home_score": 1, "away_score": 3},
    "14": {"home_score": 2, "away_score": 1},
    "15": {"home_score": 0, "away_score": 2},
    "16": {"home_score": 1, "away_score": 2},
    "17": {"home_score": 3, "away_score": 1},
    "18": {"home_score": 0, "away_score": 1},
    "19": {"home_score": 2, "away_score": 0},
    "20": {"home_score": 1, "away_score": 1},
    "21": {"home_score": 2, "away_score": 2},
    "22": {"home_score": 0, "away_score": 4},
    "23": {"home_score": 3, "away_score": 1},
    "24": {"home_score": 1, "away_score": 0},
    "25": {"home_score": 2, "away_score": 1},
    "26": {"home_score": 0, "away_score": 0},
    "27": {"home_score": 1, "away_score": 3},
    "28": {"home_score": 3, "away_score": 2},
    "29": {"home_score": 1, "away_score": 2},
    "30": {"home_score": 0, "away_score": 1}
  }'::jsonb,
  updated_at = NOW()
WHERE display_name = 'alon1525';

-- Verify the predictions were inserted
SELECT 
  id,
  display_name,
  fixture_predictions,
  fixture_points,
  table_points,
  total_points,
  updated_at
FROM user_profiles 
WHERE display_name = 'alon1525';

-- Check specific predictions for fixtures 1-10 (first matchday)
SELECT 
  up.display_name,
  jsonb_pretty(up.fixture_predictions) as predictions_json,
  f.id as fixture_id,
  f.home_team_name,
  f.away_team_name,
  f.home_score as actual_home_score,
  f.away_score as actual_away_score,
  f.status,
  up.fixture_predictions->f.id::text->>'home_score' as predicted_home,
  up.fixture_predictions->f.id::text->>'away_score' as predicted_away
FROM user_profiles up
CROSS JOIN fixtures f
WHERE up.display_name = 'alon1525'
  AND f.id BETWEEN 1 AND 10
ORDER BY f.id;

-- Calculate expected points for fixtures 1-10 (first matchday)
SELECT 
  f.id as fixture_id,
  f.home_team_name,
  f.away_team_name,
  f.home_score as actual_home_score,
  f.away_score as actual_away_score,
  f.status,
  (up.fixture_predictions->f.id::text->>'home_score')::int as predicted_home,
  (up.fixture_predictions->f.id::text->>'away_score')::int as predicted_away,
  CASE 
    WHEN f.status = 'FINISHED' AND f.home_score IS NOT NULL AND f.away_score IS NOT NULL THEN
      CASE 
        -- Exact score match = 3 points
        WHEN (up.fixture_predictions->f.id::text->>'home_score')::int = f.home_score 
         AND (up.fixture_predictions->f.id::text->>'away_score')::int = f.away_score THEN 3
        -- Correct result (win/draw/loss) = 1 point
        WHEN ((up.fixture_predictions->f.id::text->>'home_score')::int > (up.fixture_predictions->f.id::text->>'away_score')::int AND f.home_score > f.away_score) OR
             ((up.fixture_predictions->f.id::text->>'home_score')::int < (up.fixture_predictions->f.id::text->>'away_score')::int AND f.home_score < f.away_score) OR
             ((up.fixture_predictions->f.id::text->>'home_score')::int = (up.fixture_predictions->f.id::text->>'away_score')::int AND f.home_score = f.away_score) THEN 1
        ELSE 0
      END
    ELSE 0
  END as calculated_points
FROM user_profiles up
CROSS JOIN fixtures f
WHERE up.display_name = 'alon1525'
  AND f.id BETWEEN 1 AND 10
ORDER BY f.id;
