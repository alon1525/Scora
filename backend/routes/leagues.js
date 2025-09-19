const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify user authentication
const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    
    // Use a separate client with publishable key for user authentication
    const userSupabase = createClient(
        process.env.SUPABASE_API_URL,
        process.env.SUPABASE_PUBLISHABLE_KEY
      );
    
    const { data: { user }, error } = await userSupabase.auth.getUser(token);
    
    if (error || !user) {
      console.error('Token verification error:', error);
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth verification error:', error);
    res.status(401).json({ success: false, error: 'Authentication failed' });
  }
};

// Create a new league
router.post('/create', authenticateUser, async (req, res) => {
  try {
    const { name, max_members = 50 } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'League name is required' });
    }

    // Check if user has reached the maximum number of leagues (5)
    const { data: userLeagues, error: userLeaguesError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('user_id', req.user.id);

    if (userLeaguesError) {
      console.error('Error checking user leagues:', userLeaguesError);
      return res.status(500).json({ success: false, error: 'Failed to check league limit' });
    }

    if (userLeagues && userLeagues.length >= 5) {
      return res.status(400).json({ success: false, error: 'You can only be a member of 5 leagues maximum' });
    }

    // Generate unique league code
    const { data: codeData, error: codeError } = await supabase.rpc('generate_league_code');
    if (codeError) {
      console.error('Error generating league code:', codeError);
      return res.status(500).json({ success: false, error: 'Failed to generate league code' });
    }

    const leagueCode = codeData;

    // Create the league
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .insert({
        name: name.trim(),
        code: leagueCode,
        created_by: req.user.id,
        max_members
      })
      .select()
      .single();

    if (leagueError) {
      console.error('Error creating league:', leagueError);
      return res.status(500).json({ success: false, error: 'Failed to create league' });
    }

    res.json({
      success: true,
      data: {
        league,
        message: 'League created successfully'
      }
    });

  } catch (error) {
    console.error('Error in create league:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Join a league by code
router.post('/join', authenticateUser, async (req, res) => {
  try {
    const { code } = req.body;

    if (!code || code.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'League code is required' });
    }

    // Check if user has reached the maximum number of leagues (5)
    const { data: userLeagues, error: userLeaguesError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('user_id', req.user.id);

    if (userLeaguesError) {
      console.error('Error checking user leagues:', userLeaguesError);
      return res.status(500).json({ success: false, error: 'Failed to check league limit' });
    }

    if (userLeagues && userLeagues.length >= 5) {
      return res.status(400).json({ success: false, error: 'You can only be a member of 5 leagues maximum' });
    }

    // Find the league by code
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('code', code.trim().toUpperCase())
      .single();

    if (leagueError || !league) {
      return res.status(404).json({ success: false, error: 'League not found' });
    }

    // Check if user is already a member
    const { data: existingMembership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', league.id)
      .eq('user_id', req.user.id)
      .single();

    if (existingMembership) {
      return res.status(400).json({ success: false, error: 'You are already a member of this league' });
    }

    // Check if league is full
    const { data: memberCount, error: countError } = await supabase
      .from('league_memberships')
      .select('*', { count: 'exact' })
      .eq('league_id', league.id);

    if (countError) {
      console.error('Error checking member count:', countError);
      return res.status(500).json({ success: false, error: 'Failed to check league capacity' });
    }

    if (memberCount.length >= league.max_members) {
      return res.status(400).json({ success: false, error: 'League is full' });
    }

    // Create new membership
    const { error: joinError } = await supabase
      .from('league_memberships')
      .insert({
        league_id: league.id,
        user_id: req.user.id,
        role: 'member'
      });

    if (joinError) {
      console.error('Error joining league:', joinError);
      return res.status(500).json({ success: false, error: 'Failed to join league' });
    }

    res.json({
      success: true,
      data: {
        league,
        message: 'Successfully joined league'
      }
    });

  } catch (error) {
    console.error('Error in join league:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get user's leagues
router.get('/my-leagues', authenticateUser, async (req, res) => {
  try {
    const { data: memberships, error: membershipsError } = await supabase
      .from('league_memberships')
      .select(`
        *,
        league:leagues(*)
      `)
      .eq('user_id', req.user.id)
      .order('joined_at', { ascending: false });

    if (membershipsError) {
      console.error('Error fetching user leagues:', membershipsError);
      return res.status(500).json({ success: false, error: 'Failed to fetch leagues' });
    }

    // Get member counts for each league
    const leaguesWithCounts = await Promise.all(
      memberships.map(async (membership) => {
        const { data: memberCount, error: countError } = await supabase
          .from('league_memberships')
          .select('*', { count: 'exact' })
          .eq('league_id', membership.league_id);

        return {
          ...membership,
          league: {
            ...membership.league,
            member_count: memberCount?.length || 0
          }
        };
      })
    );

    res.json({
      success: true,
      data: leaguesWithCounts
    });

  } catch (error) {
    console.error('Error in get my leagues:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get league details
router.get('/:leagueId', authenticateUser, async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Get league details
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .single();

    if (leagueError || !league) {
      return res.status(404).json({ success: false, error: 'League not found' });
    }

    // Check if user is a member
    const { data: membership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', leagueId)
      .eq('user_id', req.user.id)
      .single();

    if (membershipError || !membership) {
      return res.status(403).json({ success: false, error: 'You are not a member of this league' });
    }

    // Get league members
    const { data: members, error: membersError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', leagueId)
      .order('joined_at', { ascending: true });

    if (membersError) {
      console.error('Error fetching league members:', membersError);
      return res.status(500).json({ success: false, error: 'Failed to fetch league members' });
    }

    // Get user profiles for all members
    const userIds = members.map(member => member.user_id);
    const { data: userProfiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, email, total_points, exact_predictions, result_predictions, fixture_points, table_points, fixture_predictions')
      .in('user_id', userIds);

    if (profilesError) {
      console.error('Error fetching user profiles:', profilesError);
      return res.status(500).json({ success: false, error: 'Failed to fetch user profiles' });
    }

    // Create a map of user_id to profile for quick lookup
    const profileMap = {};
    userProfiles.forEach(profile => {
      profileMap[profile.user_id] = profile;
    });

    // Sort members by total points (league standings)
    const standings = members
      .map(member => {
        const profile = profileMap[member.user_id];
        const fixturePredictions = profile?.fixture_predictions || {};
        const totalPredictions = Object.keys(fixturePredictions).length;
        
        return {
          ...member,
          total_points: profile?.total_points || 0,
          display_name: profile?.display_name || 'Unknown User',
          email: profile?.email || '',
          exact_predictions: profile?.exact_predictions || 0,
          result_predictions: profile?.result_predictions || 0,
          total_predictions: totalPredictions,
          fixture_points: profile?.fixture_points || 0,
          table_points: profile?.table_points || 0
        };
      })
      .sort((a, b) => {
        if (b.total_points !== a.total_points) {
          return b.total_points - a.total_points;
        }
        return b.exact_predictions - a.exact_predictions;
      })
      .map((member, index) => ({
        ...member,
        rank: index + 1
      }));

    res.json({
      success: true,
      data: {
        league,
        membership,
        members,
        standings
      }
    });

  } catch (error) {
    console.error('Error in get league details:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Leave a league
router.post('/:leagueId/leave', authenticateUser, async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Check if user is a member
    const { data: membership, error: membershipError } = await supabase
      .from('league_memberships')
      .select('*')
      .eq('league_id', leagueId)
      .eq('user_id', req.user.id)
      .single();

    if (membershipError || !membership) {
      return res.status(404).json({ success: false, error: 'You are not a member of this league' });
    }

    // Check if user is the owner
    if (membership.role === 'owner') {
      return res.status(400).json({ success: false, error: 'League owners cannot leave their league. Transfer ownership or delete the league instead.' });
    }

    // Delete membership
    const { error: leaveError } = await supabase
      .from('league_memberships')
      .delete()
      .eq('id', membership.id);

    if (leaveError) {
      console.error('Error leaving league:', leaveError);
      return res.status(500).json({ success: false, error: 'Failed to leave league' });
    }

    res.json({
      success: true,
      data: {
        message: 'Successfully left the league'
      }
    });

  } catch (error) {
    console.error('Error in leave league:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Delete a league (owner only)
router.delete('/:leagueId', authenticateUser, async (req, res) => {
  try {
    const { leagueId } = req.params;

    // Check if user is the owner
    const { data: league, error: leagueError } = await supabase
      .from('leagues')
      .select('*')
      .eq('id', leagueId)
      .eq('created_by', req.user.id)
      .single();

    if (leagueError || !league) {
      return res.status(404).json({ success: false, error: 'League not found or you are not the owner' });
    }

    // Delete the league (cascade will handle memberships and standings)
    const { error: deleteError } = await supabase
      .from('leagues')
      .delete()
      .eq('id', leagueId);

    if (deleteError) {
      console.error('Error deleting league:', deleteError);
      return res.status(500).json({ success: false, error: 'Failed to delete league' });
    }

    res.json({
      success: true,
      data: {
        message: 'League deleted successfully'
      }
    });

  } catch (error) {
    console.error('Error in delete league:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
