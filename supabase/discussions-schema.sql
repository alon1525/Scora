-- Fixture Discussions Table
-- This table stores comments/discussions for each fixture

CREATE TABLE fixture_discussions (
  id SERIAL PRIMARY KEY,
  fixture_id INTEGER NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (LENGTH(comment) <= 500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX idx_fixture_discussions_fixture_id ON fixture_discussions(fixture_id);
CREATE INDEX idx_fixture_discussions_user_id ON fixture_discussions(user_id);
CREATE INDEX idx_fixture_discussions_created_at ON fixture_discussions(created_at DESC);

-- RLS (Row Level Security) policies
ALTER TABLE fixture_discussions ENABLE ROW LEVEL SECURITY;

-- Users can read all discussions
CREATE POLICY "Users can read all discussions" ON fixture_discussions
  FOR SELECT USING (true);

-- Users can insert their own discussions
CREATE POLICY "Users can insert their own discussions" ON fixture_discussions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own discussions
CREATE POLICY "Users can update their own discussions" ON fixture_discussions
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own discussions
CREATE POLICY "Users can delete their own discussions" ON fixture_discussions
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discussion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.is_edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_discussion_updated_at
  BEFORE UPDATE ON fixture_discussions
  FOR EACH ROW
  EXECUTE FUNCTION update_discussion_updated_at();
