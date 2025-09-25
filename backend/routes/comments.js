const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Initialize Supabase client
const supabaseUrl = `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!process.env.SUPABASE_PROJECT_ID) {
  console.error('❌ SUPABASE_PROJECT_ID environment variable is required');
  process.exit(1);
}

if (!supabaseKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY or SUPABASE_PUBLISHABLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to authenticate user
const authenticateUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ success: false, error: 'No token provided' });
    }

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// GET /api/comments/:fixtureId - Get comments for a fixture (paginated, sorted by likes)
router.get('/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { page = 1, limit = 5, sort = 'likes' } = req.query;
    const offset = (page - 1) * limit;

    // Validate fixture exists
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('id')
      .eq('id', fixtureId)
      .single();

    if (fixtureError || !fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    // Get comments with user info
    let query = supabase
      .from('fixture_comments')
      .select(`
        id,
        comment,
        likes_count,
        liked_by_users,
        created_at,
        updated_at,
        is_edited,
        user_id
      `)
      .eq('fixture_id', fixtureId)
      .eq('is_deleted', false);

    // Sort by likes (desc) or date (desc)
    if (sort === 'likes') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    // Add pagination
    query = query.range(offset, offset + limit - 1);

    const { data: comments, error: commentsError } = await query;

    if (commentsError) {
      throw new Error(`Database error: ${commentsError.message}`);
    }

    // Get user profiles for all comments
    const userIds = [...new Set(comments.map(comment => comment.user_id))];
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .in('user_id', userIds);

    if (profilesError) {
      throw new Error(`Profiles error: ${profilesError.message}`);
    }

    // Create a map for quick lookup
    const userProfilesMap = {};
    userProfiles.forEach(profile => {
      userProfilesMap[profile.user_id] = profile;
    });

    // Merge comments with user profiles
    const commentsWithProfiles = comments.map(comment => {
      const userProfile = userProfilesMap[comment.user_id];
      if (!userProfile) {
        throw new Error(`User profile not found for user_id: ${comment.user_id}`);
      }
      return {
        ...comment,
        user_profiles: userProfile
      };
    });

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('fixture_comments')
      .select('*', { count: 'exact', head: true })
      .eq('fixture_id', fixtureId)
      .eq('is_deleted', false);

    if (countError) {
      throw new Error(`Count error: ${countError.message}`);
    }

    res.json({
      success: true,
      data: {
        comments: commentsWithProfiles || [],
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: count || 0,
          pages: Math.ceil((count || 0) / limit)
        }
      }
    });

  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/comments/:fixtureId - Add a comment
router.post('/:fixtureId', authenticateUser, async (req, res) => {
  try {
    const { fixtureId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ success: false, error: 'Comment too long (max 500 characters)' });
    }

    // Validate fixture exists
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('id')
      .eq('id', fixtureId)
      .single();

    if (fixtureError || !fixture) {
      return res.status(404).json({ success: false, error: 'Fixture not found' });
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('fixture_comments')
      .insert({
        fixture_id: parseInt(fixtureId),
        user_id: userId,
        comment: comment.trim(),
        likes_count: 0,
        liked_by_users: []
      })
      .select(`
        id,
        comment,
        likes_count,
        liked_by_users,
        created_at,
        updated_at,
        is_edited,
        user_id
      `)
      .single();

    if (insertError) {
      // Check if it's a unique constraint violation
      if (insertError.code === '23505' && insertError.message.includes('unique_user_fixture_comment')) {
        return res.status(400).json({ 
          success: false, 
          error: 'You have already commented on this fixture' 
        });
      }
      throw new Error(`Database error: ${insertError.message}`);
    }

    // Get user profile for the new comment
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new Error(`Could not fetch user profile: ${profileError.message}`);
    }

    // Merge comment with user profile
    const commentWithProfile = {
      ...newComment,
      user_profiles: userProfile
    };

    res.json({
      success: true,
      data: commentWithProfile
    });

  } catch (error) {
    console.error('Error creating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/comments/:commentId/like - Like/unlike a comment
router.post('/:commentId/like', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Use the database function to handle likes properly
    const { data, error } = await supabase
      .rpc('toggle_comment_like', {
        comment_id_param: parseInt(commentId),
        user_id_param: userId
      });

    if (error) {
      console.error('Error calling toggle_comment_like:', error);
      return res.status(500).json({ success: false, error: error.message });
    }

    if (!data.success) {
      return res.status(400).json({ success: false, error: data.error });
    }

    res.json({
      success: true,
      data: {
        comment_id: commentId,
        likes_count: data.likes_count,
        is_liked: data.is_liked
      }
    });

  } catch (error) {
    console.error('Error toggling like:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// PUT /api/comments/:commentId - Update a comment
router.put('/:commentId', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment || comment.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Comment is required' });
    }

    if (comment.length > 500) {
      return res.status(400).json({ success: false, error: 'Comment too long (max 500 characters)' });
    }

    // Update comment (only if user owns it)
    const { data: updatedComment, error: updateError } = await supabase
      .from('fixture_comments')
      .update({
        comment: comment.trim(),
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select(`
        id,
        comment,
        likes_count,
        liked_by_users,
        created_at,
        updated_at,
        is_edited,
        user_id
      `)
      .single();

    if (updateError) {
      if (updateError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Comment not found or you do not own it' });
      }
      throw new Error(`Database error: ${updateError.message}`);
    }

    // Get user profile for the updated comment
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email')
      .eq('user_id', userId)
      .single();

    if (profileError) {
      throw new Error(`Could not fetch user profile: ${profileError.message}`);
    }

    // Merge comment with user profile
    const commentWithProfile = {
      ...updatedComment,
      user_profiles: userProfile
    };

    res.json({
      success: true,
      data: commentWithProfile
    });

  } catch (error) {
    console.error('Error updating comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// DELETE /api/comments/:commentId - Delete a comment
router.delete('/:commentId', authenticateUser, async (req, res) => {
  try {
    const { commentId } = req.params;
    const userId = req.user.id;

    // Soft delete comment (only if user owns it)
    const { data: deletedComment, error: deleteError } = await supabase
      .from('fixture_comments')
      .update({
        is_deleted: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .eq('user_id', userId)
      .select('id')
      .single();

    if (deleteError) {
      if (deleteError.code === 'PGRST116') {
        return res.status(404).json({ success: false, error: 'Comment not found or you do not own it' });
      }
      throw new Error(`Database error: ${deleteError.message}`);
    }

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting comment:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/comments/user/:userId - Get user's recent comments
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 3, sort = 'newest' } = req.query;

    // Build query
    let query = supabase
      .from('fixture_comments')
      .select(`
        id,
        comment,
        likes_count,
        created_at,
        updated_at,
        is_edited,
        fixture_id,
        fixtures!inner(
          id,
          home_team_name,
          away_team_name,
          scheduled_date
        )
      `)
      .eq('user_id', userId)
      .eq('is_deleted', false)
      .limit(parseInt(limit));

    // Add sorting
    if (sort === 'likes') {
      query = query.order('likes_count', { ascending: false });
    } else {
      query = query.order('created_at', { ascending: false });
    }

    const { data: comments, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      data: comments || []
    });

  } catch (error) {
    console.error('Error fetching user comments:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
