-- Add unique constraint for one comment per user per fixture
ALTER TABLE fixture_comments 
ADD CONSTRAINT unique_user_fixture_comment 
UNIQUE (user_id, fixture_id);

-- Update the like functionality to prevent self-likes and multiple likes
-- First, let's create a function to handle likes properly
CREATE OR REPLACE FUNCTION toggle_comment_like(
  comment_id_param INTEGER,
  user_id_param UUID
)
RETURNS JSON AS $$
DECLARE
  comment_record RECORD;
  is_liked BOOLEAN;
  new_likes_count INTEGER;
  new_liked_by_users UUID[];
BEGIN
  -- Get the comment details
  SELECT * INTO comment_record 
  FROM fixture_comments 
  WHERE id = comment_id_param;
  
  -- Check if comment exists
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Comment not found');
  END IF;
  
  -- Check if user is trying to like their own comment
  IF comment_record.user_id = user_id_param THEN
    RETURN json_build_object('success', false, 'error', 'Cannot like your own comment');
  END IF;
  
  -- Check if user has already liked this comment
  is_liked := user_id_param = ANY(comment_record.liked_by_users);
  
  IF is_liked THEN
    -- Remove the like
    new_liked_by_users := array_remove(comment_record.liked_by_users, user_id_param);
    new_likes_count := comment_record.likes_count - 1;
  ELSE
    -- Add the like
    new_liked_by_users := comment_record.liked_by_users || user_id_param;
    new_likes_count := comment_record.likes_count + 1;
  END IF;
  
  -- Update the comment
  UPDATE fixture_comments 
  SET 
    likes_count = new_likes_count,
    liked_by_users = new_liked_by_users,
    updated_at = NOW()
  WHERE id = comment_id_param;
  
  RETURN json_build_object(
    'success', true,
    'is_liked', NOT is_liked,
    'likes_count', new_likes_count
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service_role
GRANT EXECUTE ON FUNCTION toggle_comment_like TO service_role;
