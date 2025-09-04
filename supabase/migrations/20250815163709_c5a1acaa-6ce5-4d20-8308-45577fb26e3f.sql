-- Insert a test match with betting_open status for current testing
INSERT INTO match_events (
  home_team, 
  away_team, 
  match_date, 
  betting_opens_at, 
  betting_closes_at, 
  status
) VALUES (
  'Liverpool', 
  'Arsenal', 
  NOW() + INTERVAL '2 hours',
  NOW() - INTERVAL '1 hour', 
  NOW() + INTERVAL '1 hour', 
  'betting_open'
);