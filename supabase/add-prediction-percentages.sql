-- Add prediction percentage columns to fixtures table
-- This allows us to pre-calculate prediction percentages instead of calculating them on-the-fly

ALTER TABLE fixtures
ADD COLUMN IF NOT EXISTS prediction_home_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prediction_draw_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prediction_away_percent INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS prediction_total_count INTEGER DEFAULT 0;

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_fixtures_prediction_count ON fixtures(prediction_total_count DESC);

-- Add comment for documentation
COMMENT ON COLUMN fixtures.prediction_home_percent IS 'Percentage of predictions favoring home team win';
COMMENT ON COLUMN fixtures.prediction_draw_percent IS 'Percentage of predictions favoring draw';
COMMENT ON COLUMN fixtures.prediction_away_percent IS 'Percentage of predictions favoring away team win';
COMMENT ON COLUMN fixtures.prediction_total_count IS 'Total number of predictions for this fixture';

