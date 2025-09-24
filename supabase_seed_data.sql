-- Supabase Seed Data for Scora Project
-- Run this SQL in your Supabase SQL Editor

-- Insert sample users into user_profiles table
INSERT INTO user_profiles (
  user_id,
  email,
  display_name,
  table_prediction,
  fixture_predictions,
  table_points,
  fixture_points,
  total_points,
  exact_predictions,
  result_predictions,
  created_at,
  updated_at
) VALUES 
-- User 1: Alex Smith
(
  '11111111-1111-1111-1111-111111111111',
  'alex.smith@example.com',
  'Alex Smith',
  ARRAY['arsenal', 'man-city', 'liverpool', 'tottenham', 'chelsea', 'man-united', 'newcastle', 'brighton', 'west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'fulham', 'everton', 'wolves', 'bournemouth', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
  '{
    "61": {"home_score": 2, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 0, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 3, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 2, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 0, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 4, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  45,
  28,
  73,
  3,
  7,
  NOW(),
  NOW()
),

-- User 2: Sarah Johnson
(
  '22222222-2222-2222-2222-222222222222',
  'sarah.johnson@example.com',
  'Sarah Johnson',
  ARRAY['man-city', 'arsenal', 'tottenham', 'liverpool', 'man-united', 'chelsea', 'brighton', 'newcastle', 'aston-villa', 'west-ham', 'crystal-palace', 'brentford', 'everton', 'fulham', 'bournemouth', 'wolves', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
  '{
    "61": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 3, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 2, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 0, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 4, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  52,
  31,
  83,
  4,
  8,
  NOW(),
  NOW()
),

-- User 3: Mike Wilson
(
  '33333333-3333-3333-3333-333333333333',
  'mike.wilson@example.com',
  'Mike Wilson',
  ARRAY['liverpool', 'tottenham', 'arsenal', 'man-city', 'newcastle', 'brighton', 'chelsea', 'man-united', 'brentford', 'crystal-palace', 'west-ham', 'aston-villa', 'wolves', 'everton', 'bournemouth', 'fulham', 'sunderland', 'leeds-united', 'burnley', 'nottingham'],
  '{
    "61": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 2, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 3, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 0, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 4, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  38,
  25,
  63,
  2,
  5,
  NOW(),
  NOW()
),

-- User 4: Emma Brown
(
  '44444444-4444-4444-4444-444444444444',
  'emma.brown@example.com',
  'Emma Brown',
  ARRAY['tottenham', 'liverpool', 'man-city', 'arsenal', 'brighton', 'newcastle', 'man-united', 'chelsea', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'fulham', 'everton', 'wolves', 'bournemouth', 'nottingham', 'sunderland', 'leeds-united', 'burnley'],
  '{
    "61": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 0, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 4, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  41,
  29,
  70,
  3,
  6,
  NOW(),
  NOW()
),

-- User 5: David Davis
(
  '55555555-5555-5555-5555-555555555555',
  'david.davis@example.com',
  'David Davis',
  ARRAY['chelsea', 'man-united', 'newcastle', 'brighton', 'arsenal', 'man-city', 'liverpool', 'tottenham', 'everton', 'fulham', 'wolves', 'bournemouth', 'west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
  '{
    "61": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  47,
  33,
  80,
  5,
  9,
  NOW(),
  NOW()
),

-- User 6: Lisa Garcia
(
  '66666666-6666-6666-6666-666666666666',
  'lisa.garcia@example.com',
  'Lisa Garcia',
  ARRAY['man-united', 'chelsea', 'brighton', 'newcastle', 'man-city', 'arsenal', 'tottenham', 'liverpool', 'fulham', 'everton', 'bournemouth', 'wolves', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
  '{
    "61": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  44,
  27,
  71,
  4,
  7,
  NOW(),
  NOW()
),

-- User 7: James Miller
(
  '77777777-7777-7777-7777-777777777777',
  'james.miller@example.com',
  'James Miller',
  ARRAY['newcastle', 'brighton', 'chelsea', 'man-united', 'liverpool', 'tottenham', 'arsenal', 'man-city', 'wolves', 'bournemouth', 'everton', 'fulham', 'brentford', 'crystal-palace', 'west-ham', 'aston-villa', 'nottingham', 'sunderland', 'leeds-united', 'burnley'],
  '{
    "61": {"home_score": 0, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  39,
  26,
  65,
  2,
  6,
  NOW(),
  NOW()
),

-- User 8: Anna Taylor
(
  '88888888-8888-8888-8888-888888888888',
  'anna.taylor@example.com',
  'Anna Taylor',
  ARRAY['brighton', 'newcastle', 'man-united', 'chelsea', 'tottenham', 'liverpool', 'man-city', 'arsenal', 'bournemouth', 'wolves', 'fulham', 'everton', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'sunderland', 'nottingham', 'burnley', 'leeds-united'],
  '{
    "61": {"home_score": 1, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  42,
  30,
  72,
  3,
  8,
  NOW(),
  NOW()
),

-- User 9: Tom Anderson
(
  '99999999-9999-9999-9999-999999999999',
  'tom.anderson@example.com',
  'Tom Anderson',
  ARRAY['west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'everton', 'fulham', 'wolves', 'bournemouth', 'arsenal', 'man-city', 'liverpool', 'tottenham', 'chelsea', 'man-united', 'newcastle', 'brighton', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
  '{
    "61": {"home_score": 2, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 0, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 3, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  36,
  24,
  60,
  1,
  4,
  NOW(),
  NOW()
),

-- User 10: Sophie Thomas
(
  'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  'sophie.thomas@example.com',
  'Sophie Thomas',
  ARRAY['aston-villa', 'west-ham', 'crystal-palace', 'brentford', 'fulham', 'everton', 'bournemouth', 'wolves', 'man-city', 'arsenal', 'tottenham', 'liverpool', 'man-united', 'chelsea', 'brighton', 'newcastle', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
  '{
    "61": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "62": {"home_score": 2, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "63": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "64": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "65": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "66": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "67": {"home_score": 2, "away_score": 3, "created_at": "2024-01-01T10:00:00Z"},
    "68": {"home_score": 0, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "69": {"home_score": 1, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "70": {"home_score": 3, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "71": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "72": {"home_score": 2, "away_score": 0, "created_at": "2024-01-01T10:00:00Z"},
    "73": {"home_score": 0, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"},
    "74": {"home_score": 3, "away_score": 2, "created_at": "2024-01-01T10:00:00Z"},
    "75": {"home_score": 1, "away_score": 1, "created_at": "2024-01-01T10:00:00Z"}
  }'::jsonb,
  48,
  32,
  80,
  5,
  9,
  NOW(),
  NOW()
);

-- Note: This SQL creates 10 sample users with:
-- - Realistic table predictions (team ID arrays)
-- - Sample fixture predictions for fixtures 61-75 (15 fixtures per user)
-- - Random but realistic scores (0-4 goals)
-- - Varying point totals for testing leaderboards
-- - Proper timestamps

-- To add more fixture predictions (61-380), you would need to extend the JSONB
-- fixture_predictions field with additional fixture entries following the same pattern.
