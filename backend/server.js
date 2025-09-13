const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import routes
const fixturesRoutes = require('./routes/fixtures');
const predictionsRoutes = require('./routes/predictions_simple');
const standingsRoutes = require('./routes/standings');
const leaguesRoutes = require('./routes/leagues');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.use('/api/fixtures', fixturesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/standings', standingsRoutes);

// Test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_API_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasPublishableKey: !!process.env.SUPABASE_PUBLISHABLE_KEY,
    hasLeagueApiKey: !!process.env.LEAGUE_STANDINGS_API_KEY,
    supabaseUrl: process.env.SUPABASE_API_URL ? 'Set' : 'Missing',
    leagueApiKeyLength: process.env.LEAGUE_STANDINGS_API_KEY ? process.env.LEAGUE_STANDINGS_API_KEY.length : 0,
    leagueApiKeyStart: process.env.LEAGUE_STANDINGS_API_KEY ? process.env.LEAGUE_STANDINGS_API_KEY.substring(0, 8) + '...' : 'undefined'
  });
});

// POST /api/users/create-profile - Create user profile with default prediction
app.post('/api/users/create-profile', async (req, res) => {
  try {
    const { user_id, email, display_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      });
    }

    // Get current matchday from standings
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('played')
      .eq('season', '2025')
      .limit(1);

    let currentMatchday = 1;
    if (standings && standings.length > 0) {
      const minPlayed = Math.min(...standings.map(team => team.played || 0));
      const maxPlayed = Math.max(...standings.map(team => team.played || 0));
      currentMatchday = maxPlayed === minPlayed ? minPlayed + 1 : minPlayed;
    }

    // Get fixtures from current matchday onwards
    const { data: futureFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, matchday')
      .eq('season', '2025')
      .gte('matchday', currentMatchday);

    if (fixturesError) {
      console.error('Error fetching fixtures for initialization:', fixturesError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch fixtures for initialization' 
      });
    }

    // Create default fixture predictions (0-0) for future fixtures only
    const defaultFixturePredictions = {};
    futureFixtures.forEach(fixture => {
      defaultFixturePredictions[fixture.id] = {
        home_score: '0',
        away_score: '0'
      };
    });

    console.log(`🎯 Initializing ${futureFixtures.length} future fixture predictions (from matchday ${currentMatchday}) with 0-0 for new user`);

    // Create user profile with default prediction
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user_id,
        email: email || null,
        display_name: display_name || email || 'User',
        table_prediction: [
          'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
          'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
          'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
          'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
        ],
        fixture_points: 0,
        table_points: 0, // Will be calculated by the trigger
        total_points: 0, // Will be calculated by the trigger
        fixture_predictions: defaultFixturePredictions
      })
      .select();

    if (error) {
      console.error('Error creating user profile:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create user profile' 
      });
    }

    // Calculate the user's points after creating the profile
    try {
      const { data: calcResult, error: calcError } = await supabase.rpc('calculate_user_points', {
        p_user_id: user_id
      });

      if (calcError) {
        console.error('Error calculating initial points:', calcError);
        // Don't fail the request, just log the error
      } else {
        console.log(`✅ Calculated initial points for new user: ${calcResult} points`);
      }
    } catch (calcError) {
      console.error('Exception calculating initial points:', calcError);
    }

    res.json({ 
      success: true, 
      message: 'User profile created with default prediction',
      profile: data[0]
    });
  } catch (error) {
    console.error('Error in create profile endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// POST /api/users/recalculate-scores - Recalculate all user scores
app.post('/api/users/recalculate-scores', async (req, res) => {
  try {
    console.log('🔄 Starting score recalculation for all users...');
    
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📊 Found ${users.length} users to recalculate`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        console.log(`🔄 Processing user: ${user.display_name} (${user.user_id})`);
        
        // First calculate table points using the RPC function
        const { data: tableResult, error: tableError } = await supabase.rpc('calculate_user_points', {
          p_user_id: user.user_id
        });

        if (tableError) {
          console.error(`❌ Error calculating table points for user ${user.display_name}:`, tableError);
          errorCount++;
          continue;
        }

        // Then calculate fixture points
        const { data: fixtureResult, error: fixtureError } = await calculateFixturePoints(user.user_id);
        
        if (fixtureError) {
          console.error(`❌ Error calculating fixture points for user ${user.display_name}:`, fixtureError);
          errorCount++;
          continue;
        }

        // Update total points
        const totalPoints = (tableResult || 0) + (fixtureResult || 0);
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            table_points: tableResult || 0,
            fixture_points: fixtureResult || 0,
            total_points: totalPoints
          })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.error(`❌ Error updating points for user ${user.display_name}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Recalculated points for ${user.display_name}: Table=${tableResult || 0}, Fixture=${fixtureResult || 0}, Total=${totalPoints}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception calculating points for user ${user.display_name}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Score recalculation completed`,
      results: {
        total: users.length,
        successful: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Error in recalculate scores endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Helper function to calculate fixture points
async function calculateFixturePoints(userId) {
  try {
    console.log(`🔍 Calculating fixture points for user: ${userId}`);
    
    // Get user's fixture predictions
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.log(`❌ No user profile found for ${userId}`);
      return { data: 0, error: null };
    }

    const predictions = userProfile.fixture_predictions || {};
    console.log(`📊 User has ${Object.keys(predictions).length} predictions`);
    let totalPoints = 0;

    // Get all finished fixtures
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status')
      .eq('status', 'FINISHED');

    if (fixturesError) {
      console.log(`❌ Error fetching finished fixtures:`, fixturesError);
      return { data: 0, error: fixturesError };
    }

    console.log(`⚽ Found ${finishedFixtures.length} finished fixtures`);

    // Calculate points for each prediction
    for (const fixture of finishedFixtures) {
      const prediction = predictions[fixture.id];
      if (!prediction || !prediction.home_score || !prediction.away_score) {
        continue;
      }

      const predictedHome = parseInt(prediction.home_score);
      const predictedAway = parseInt(prediction.away_score);
      const actualHome = fixture.home_score;
      const actualAway = fixture.away_score;

      if (isNaN(predictedHome) || isNaN(predictedAway)) {
        continue;
      }

      // Calculate points (exact score = 3 points, correct result = 1 point)
      let points = 0;
      if (predictedHome === actualHome && predictedAway === actualAway) {
        points = 3; // Exact score
        console.log(`🎯 Exact score! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 3 points`);
      } else if (
        (predictedHome > predictedAway && actualHome > actualAway) ||
        (predictedHome < predictedAway && actualHome < actualAway) ||
        (predictedHome === predictedAway && actualHome === actualAway)
      ) {
        points = 1; // Correct result
        console.log(`✅ Correct result! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 1 point`);
      } else {
        console.log(`❌ Wrong prediction: ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 0 points`);
      }

      totalPoints += points;
    }

    console.log(`🏆 Total fixture points for user ${userId}: ${totalPoints}`);
    return { data: totalPoints, error: null };
  } catch (error) {
    console.log(`❌ Error calculating fixture points for ${userId}:`, error);
    return { data: 0, error };
  }
}

// Test cron endpoint - manually trigger standings refresh
app.get('/api/test-cron', async (req, res) => {
  try {
    console.log('🧪 Manual cron test triggered');
    console.log('🔍 Environment check:', {
      hasApiKey: !!process.env.LEAGUE_STANDINGS_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_API_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Call the standings refresh endpoint
    const response = await fetch(`${req.protocol}://${req.get('host')}/api/standings/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    console.log('📊 Standings refresh response:', data);
    
    res.json({
      success: true,
      message: 'Cron test completed',
      cronResult: data
    });
  } catch (error) {
    console.error('Error in test cron:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Cron status endpoint - check last standings refresh
app.get('/api/cron-status', async (req, res) => {
  try {
    const { data: standings, error } = await supabase
      .from('standings')
      .select('last_updated')
      .eq('season', '2025')
      .order('last_updated', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    const lastUpdated = standings.length > 0 ? standings[0].last_updated : null;
    const nextRun = new Date();
    nextRun.setUTCHours(6, 0, 0, 0);
    if (nextRun <= new Date()) {
      nextRun.setDate(nextRun.getDate() + 1);
    }

    res.json({
      success: true,
      lastStandingsRefresh: lastUpdated,
      nextScheduledRun: nextRun.toISOString(),
      cronSchedule: 'Daily at 6:00 AM UTC',
      status: lastUpdated ? 'Active' : 'No data yet'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
