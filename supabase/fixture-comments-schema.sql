-- Fixture Comments Table with Simple Likes
CREATE TABLE IF NOT EXISTS fixture_comments (
  id SERIAL PRIMARY KEY,
  fixture_id INTEGER NOT NULL REFERENCES fixtures(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  comment TEXT NOT NULL CHECK (LENGTH(comment) <= 500),
  likes_count INTEGER DEFAULT 0,
  liked_by_users UUID[] DEFAULT '{}', -- Array of user IDs who liked this comment
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_edited BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fixture_comments_fixture_id ON fixture_comments(fixture_id);
CREATE INDEX IF NOT EXISTS idx_fixture_comments_user_id ON fixture_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_fixture_comments_likes_count ON fixture_comments(likes_count DESC);
CREATE INDEX IF NOT EXISTS idx_fixture_comments_created_at ON fixture_comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_fixture_comments_liked_by_users ON fixture_comments USING GIN (liked_by_users);

-- RLS (Row Level Security) policies
ALTER TABLE fixture_comments ENABLE ROW LEVEL SECURITY;

-- Users can read all comments
DROP POLICY IF EXISTS "Users can read all comments" ON fixture_comments;
CREATE POLICY "Users can read all comments" ON fixture_comments
  FOR SELECT USING (true);

-- Users can insert their own comments
DROP POLICY IF EXISTS "Users can insert their own comments" ON fixture_comments;
CREATE POLICY "Users can insert their own comments" ON fixture_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
DROP POLICY IF EXISTS "Users can update their own comments" ON fixture_comments;
CREATE POLICY "Users can update their own comments" ON fixture_comments
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON fixture_comments;
CREATE POLICY "Users can delete their own comments" ON fixture_comments
  FOR DELETE USING (auth.uid() = user_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.is_edited = TRUE;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_comment_updated_at ON fixture_comments;
CREATE TRIGGER update_comment_updated_at
  BEFORE UPDATE ON fixture_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_comment_updated_at();
