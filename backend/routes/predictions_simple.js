const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// Middleware to verify user authentication
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'No authorization token provided' });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    // Use a separate client with publishable key for user authentication
    const userSupabase = createClient(
      process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co",
      process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ"
    );
    
    const { data: { user }, error } = await userSupabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ success: false, error: 'Invalid token' });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
};

// GET /api/predictions/leaderboard - Get leaderboard (PUBLIC - no auth required)
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 50 } = req.query;

    const { data: leaderboard, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('total_points', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      leaderboard
    });
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Apply authentication to all routes
router.use(authenticateUser);

// POST /api/predictions/table - Create or update table prediction
router.post('/table', authenticateUser, async (req, res) => {
  try {
    const { table_order } = req.body;
    const user_id = req.user.id;

    if (!table_order || !Array.isArray(table_order) || table_order.length !== 20) {
      return res.status(400).json({
        success: false,
        error: 'table_order must be an array of 20 team IDs'
      });
    }

    // Check if predictions are locked for this user
    const { data: lockData, error: lockError } = await supabase
      .rpc('are_predictions_locked', { user_id_param: user_id });

    if (lockError) {
      console.error('Error checking prediction lock:', lockError);
      // Don't throw error, just log it and continue
      console.log('Continuing without lock check...');
    } else if (lockData) {
      return res.status(400).json({ 
        success: false, 
        error: 'Table predictions are locked. You can no longer change your prediction.' 
      });
    }

    // Validate team IDs
    const validTeamIds = [
      'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
      'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
      'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
      'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
    ];

    const invalidTeams = table_order.filter(teamId => !validTeamIds.includes(teamId));
    if (invalidTeams.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid team IDs: ${invalidTeams.join(', ')}` 
      });
    }

    // Check for duplicates
    const uniqueTeams = [...new Set(table_order)];
    if (uniqueTeams.length !== 20) {
      return res.status(400).json({ 
        success: false, 
        error: 'Table order contains duplicate teams' 
      });
    }

    // Upsert user profile with table prediction
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id,
        table_prediction: table_order,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }


    res.json({
      success: true,
      profile
    });
  } catch (error) {
    console.error('Error creating table prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/predictions/table - Get user's table prediction
router.get('/table', async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('table_prediction')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      prediction: profile?.table_prediction || null
    });
  } catch (error) {
    console.error('Error fetching table prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/predictions/fixture - Create or update fixture prediction
router.post('/fixture', async (req, res) => {
  try {
    const { fixture_id, home_score, away_score } = req.body;
    const user_id = req.user.id;

    if (!fixture_id || home_score === undefined || away_score === undefined) {
      return res.status(400).json({
        success: false,
        error: 'fixture_id, home_score, and away_score are required'
      });
    }

    // Check if fixture exists and hasn't started yet
    const { data: fixture, error: fixtureError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('id', fixture_id)
      .single();

    if (fixtureError || !fixture) {
      return res.status(404).json({
        success: false,
        error: 'Fixture not found'
      });
    }

    // Check if fixture has already started
    const now = new Date();
    const fixtureDate = new Date(fixture.scheduled_date);
    if (fixtureDate <= now) {
      return res.status(400).json({
        success: false,
        error: 'Cannot predict on fixtures that have already started'
      });
    }

    // Get current user profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('user_id', user_id)
      .single();

    let fixturePredictions = {};
    if (currentProfile?.fixture_predictions) {
      fixturePredictions = currentProfile.fixture_predictions;
    }

    // Calculate points if fixture is finished
    let points_earned = 0;
    if (fixture.status === 'FINISHED') {
      const { data: pointsData, error: pointsError } = await supabase
        .rpc('calculate_fixture_points', {
          predicted_home: home_score,
          predicted_away: away_score,
          actual_home: fixture.home_score,
          actual_away: fixture.away_score
        });

      if (!pointsError && pointsData) {
        points_earned = pointsData;
      }
    }

    // Update fixture prediction
    fixturePredictions[fixture_id] = {
      home_score: parseInt(home_score) || 0,
      away_score: parseInt(away_score) || 0,
      points_earned
    };

    // Update user profile
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .upsert({
        user_id,
        fixture_predictions: fixturePredictions
      }, {
        onConflict: 'user_id'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      points_earned
    });
  } catch (error) {
    console.error('Error creating fixture prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/predictions/fixture/:fixture_id - Get user's prediction for a fixture
router.get('/fixture/:fixture_id', async (req, res) => {
  try {
    const { fixture_id } = req.params;
    const user_id = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`);
    }

    const prediction = profile?.fixture_predictions?.[fixture_id] || null;

    res.json({
      success: true,
      prediction
    });
  } catch (error) {
    console.error('Error fetching fixture prediction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/predictions/fixtures - Get all user's fixture predictions for a matchday
router.get('/fixtures', async (req, res) => {
  try {
    const { matchday } = req.query;
    const user_id = req.user.id;

    // Get user's fixture predictions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('user_id', user_id)
      .single();

    if (profileError && profileError.code !== 'PGRST116') {
      throw new Error(`Database error: ${profileError.message}`);
    }

    // Get fixtures for the matchday
    let query = supabase
      .from('fixtures')
      .select('*')
      .order('scheduled_date', { ascending: true });

    if (matchday) {
      query = query.eq('matchday', parseInt(matchday));
    }

    const { data: fixtures, error: fixturesError } = await query;

    if (fixturesError) {
      throw new Error(`Database error: ${fixturesError.message}`);
    }

    // Combine fixtures with user predictions
    const predictions = fixtures.map(fixture => ({
      ...fixture,
      prediction: profile?.fixture_predictions?.[fixture.id] || null
    }));

    res.json({
      success: true,
      predictions,
      count: predictions.length,
      matchday: matchday ? parseInt(matchday) : null
    });
  } catch (error) {
    console.error('Error fetching fixture predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/predictions/scores - Get user's scores
router.get('/scores', async (req, res) => {
  try {
    const user_id = req.user.id;

    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('fixture_points, table_points, total_points')
      .eq('user_id', user_id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      scores: profile || {
        fixture_points: 0,
        table_points: 0,
        total_points: 0,
        champion_bonus: false,
        relegation_bonus: false
      }
    });
  } catch (error) {
    console.error('Error fetching user scores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Simple score recalculation endpoint
router.post('/recalculate-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    console.log(`🔄 Recalculating scores for user: ${userId}`);

    // Get current standings
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('team_id, position')
      .eq('season', '2025')
      .order('position');

    if (standingsError) {
      throw new Error(`Standings error: ${standingsError.message}`);
    }

    // Create standings lookup
    const standingsLookup = {};
    standings.forEach(team => {
      standingsLookup[team.team_id] = team.position;
    });

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Calculate table points
    let tablePoints = 0;
    const prediction = profile.table_prediction || [];
    
    for (let i = 0; i < prediction.length; i++) {
      const predictedTeam = prediction[i];
      const actualPosition = standingsLookup[predictedTeam];
      
      if (actualPosition !== undefined) {
        const positionDiff = Math.abs((i + 1) - actualPosition);
        const teamPoints = Math.max(0, 20 - positionDiff);
        tablePoints += teamPoints;
      }
    }

    const totalPoints = profile.fixture_points + tablePoints;

    console.log(`📊 Calculated - Table: ${tablePoints}, Fixture: ${profile.fixture_points}, Total: ${totalPoints}`);

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        table_points: tablePoints,
        total_points: totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id);

    if (updateError) {
      throw new Error(`Update error: ${updateError.message}`);
    }

    res.json({
      success: true,
      message: 'User scores recalculated successfully',
      user: profile.display_name || profile.email,
      table_points: tablePoints,
      fixture_points: profile.fixture_points,
      total_points: totalPoints
    });

  } catch (error) {
    console.error('❌ User recalculation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
