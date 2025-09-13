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

    // Get all fixtures for the season
    const { data: allFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, matchday, status')
      .eq('season', '2025');

    if (fixturesError) {
      console.error('Error fetching fixtures for initialization:', fixturesError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch fixtures for initialization' 
      });
    }

    // Create fixture predictions (no calculated field needed - it's in fixtures table)
    const defaultFixturePredictions = {};
    allFixtures.forEach(fixture => {
      defaultFixturePredictions[fixture.id] = {
        home_score: '0',
        away_score: '0'
      };
    });

    const futureFixturesCount = allFixtures.filter(f => f.matchday >= currentMatchday && f.status !== 'FINISHED').length;
    const pastFixturesCount = allFixtures.filter(f => f.matchday < currentMatchday || f.status === 'FINISHED').length;
    console.log(`🎯 Initializing ${allFixtures.length} fixture predictions for new user - ${pastFixturesCount} past (calculated: true), ${futureFixturesCount} future (calculated: false)`);

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

        // Update total points and counts
        const totalPoints = (tableResult || 0) + (fixtureResult.points || 0);
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({ 
            table_points: tableResult || 0,
            fixture_points: fixtureResult.points || 0,
            total_points: totalPoints,
            exact_predictions: fixtureResult.exact || 0,
            result_predictions: fixtureResult.result || 0
          })
          .eq('user_id', user.user_id);

        if (updateError) {
          console.error(`❌ Error updating points for user ${user.display_name}:`, updateError);
          errorCount++;
        } else {
          console.log(`✅ Recalculated points for ${user.display_name}: Table=${tableResult || 0}, Fixture=${fixtureResult.points || 0}, Total=${totalPoints}, Exact=${fixtureResult.exact || 0}, Result=${fixtureResult.result || 0}`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception calculating points for user ${user.display_name}:`, error);
        errorCount++;
      }
    }

    // Mark all finished fixtures as calculated after all users have been processed
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id')
      .eq('status', 'FINISHED')
      .eq('calculated', false);

    if (!fixturesError && finishedFixtures && finishedFixtures.length > 0) {
      const fixtureIds = finishedFixtures.map(f => f.id);
      const { error: fixtureUpdateError } = await supabase
        .from('fixtures')
        .update({ calculated: true })
        .in('id', fixtureIds);
      
      if (fixtureUpdateError) {
        console.log(`❌ Error marking fixtures as calculated:`, fixtureUpdateError);
      } else {
        console.log(`✅ Marked ${fixtureIds.length} fixtures as calculated after processing all users`);
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
    
    // Get user's fixture predictions and current counts
    // Try to find by internal id first, then by user_id
    let { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions, exact_predictions, result_predictions')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      // Try by user_id if not found by id
      const { data: userProfileByUserId, error: profileErrorByUserId } = await supabase
        .from('user_profiles')
        .select('fixture_predictions, exact_predictions, result_predictions')
        .eq('user_id', userId)
        .single();
      
      if (profileErrorByUserId || !userProfileByUserId) {
        console.log(`❌ No user profile found for ${userId}`);
        return { data: { points: 0, exact: 0, result: 0 }, error: null };
      }
      
      userProfile = userProfileByUserId;
      profileError = null;
    }

    if (profileError || !userProfile) {
      console.log(`❌ No user profile found for ${userId}`);
      return { data: { points: 0, exact: 0, result: 0 }, error: null };
    }

    const predictions = userProfile.fixture_predictions || {};
    let exactCount = userProfile.exact_predictions || 0;
    let resultCount = userProfile.result_predictions || 0;
    let updatedPredictions = { ...predictions };
    let hasUpdates = false;

    console.log(`📊 User has ${Object.keys(predictions).length} predictions`);
    console.log(`📊 User prediction keys:`, Object.keys(predictions));
    console.log(`📊 Current counts - Exact: ${exactCount}, Result: ${resultCount}`);

    // Get finished fixtures that haven't been calculated yet
    console.log(`🔍 Querying fixtures with status='FINISHED' AND calculated=false...`);
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status, calculated')
      .eq('status', 'FINISHED')
      .eq('calculated', false);

    if (fixturesError) {
      console.log(`❌ Error fetching finished fixtures:`, fixturesError);
      return { data: { points: 0, exact: exactCount, result: resultCount }, error: fixturesError };
    }

    console.log(`⚽ Found ${finishedFixtures.length} finished fixtures that need calculation`);
    console.log(`📋 Finished fixtures details:`, finishedFixtures.map(f => ({ id: f.id, status: f.status, calculated: f.calculated, score: `${f.home_score}-${f.away_score}` })));
    console.log(`🔍 User prediction keys:`, Object.keys(predictions));
    console.log(`🔍 Fixture IDs to process:`, finishedFixtures.map(f => f.id));
    
    if (finishedFixtures.length === 0) {
      console.log(`⚠️ No fixtures found to process!`);
      return { data: { points: 0, exact: exactCount, result: resultCount }, error: null };
    }

    // // Also check all finished fixtures to see what we have
    // const { data: allFinishedFixtures, error: allFinishedError } = await supabase
    //   .from('fixtures')
    //   .select('id, home_score, away_score, status, calculated')
    //   .eq('status', 'FINISHED');

    // if (!allFinishedError) {
    //   console.log(`📊 Total finished fixtures: ${allFinishedFixtures.length}`);
    //   console.log(`📊 Finished fixtures with calculated=false: ${allFinishedFixtures.filter(f => f.calculated === false).length}`);
    //   console.log(`📊 Finished fixtures with calculated=true: ${allFinishedFixtures.filter(f => f.calculated === true).length}`);
    // }

    // Process only fixtures that haven't been calculated yet
    for (const fixture of finishedFixtures) {
      const prediction = predictions[fixture.id] || predictions[fixture.id.toString()];
      console.log(`🔍 Processing fixture ${fixture.id}: prediction found = ${!!prediction}`);
      if (prediction) {
        console.log(`📋 Prediction for fixture ${fixture.id}:`, prediction);
      }
      
      // Process the fixture even if no prediction (mark as calculated)
      if (!prediction || prediction.home_score === null || prediction.home_score === undefined || prediction.away_score === null || prediction.away_score === undefined) {
        console.log(`⏭️ No prediction for fixture ${fixture.id} - marking as calculated`);
        hasUpdates = true; // Mark that we processed this fixture
        continue;
      }

      const predictedHome = parseInt(prediction.home_score);
      const predictedAway = parseInt(prediction.away_score);
      const actualHome = parseInt(fixture.home_score);
      const actualAway = parseInt(fixture.away_score);

      if (isNaN(predictedHome) || isNaN(predictedAway) || isNaN(actualHome) || isNaN(actualAway)) {
        continue;
      }

      let isExact = false;
      let isResult = false;

      if (predictedHome === actualHome && predictedAway === actualAway) {
        isExact = true;
        exactCount++;
        console.log(`🎯 Exact score! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway}`);
      } else {
        const predictedResult = predictedHome > predictedAway ? 'home' : (predictedHome < predictedAway ? 'away' : 'draw');
        const actualResult = actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : 'draw');
        
        if (predictedResult === actualResult) {
          isResult = true;
          resultCount++;
          console.log(`✅ Correct result! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway}`);
        }
      }

      hasUpdates = true;
    }

    // Update the user's counts if there were changes
    if (hasUpdates) {
      // Determine if we found the user by id or user_id
      const isUserId = userId.includes('-'); // UUIDs contain dashes
      const updateField = isUserId ? 'user_id' : 'id';
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          exact_predictions: exactCount,
          result_predictions: resultCount
        })
        .eq(updateField, userId);
      
      if (updateError) {
        console.log(`❌ Error updating counts for user ${userId}:`, updateError);
      } else {
        console.log(`✅ Updated counts for user ${userId} - Exact: ${exactCount}, Result: ${resultCount}`);
      }
    }

    // Don't mark fixtures as calculated here - let the recalculate-scores endpoint handle it
    // This allows all users to process the same fixtures

    const totalPoints = (resultCount * 1) + (exactCount * 3);
    console.log(`🏆 Total fixture points for user ${userId}: ${totalPoints} (${exactCount} exact, ${resultCount} results)`);
    return { data: { points: totalPoints, exact: exactCount, result: resultCount }, error: null };
  } catch (error) {
    console.log(`❌ Error calculating fixture points for ${userId}:`, error);
    return { data: { points: 0, exact: 0, result: 0 }, error };
  }
}

// Migration endpoint to update existing users to new structure
app.post('/api/migrate-user-predictions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🔄 Migrating user ${userId} to new prediction structure...`);
    
    // Get user's current predictions
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const predictions = userProfile.fixture_predictions || {};
    const updatedPredictions = {};
    let migratedCount = 0;

    // Get current matchday to determine which fixtures should be calculated
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

    // Get fixture data to check matchdays and status
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, matchday, status')
      .eq('season', '2025');

    if (fixturesError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to fetch fixtures'
      });
    }

    const fixtureMap = {};
    fixtures.forEach(fixture => {
      fixtureMap[fixture.id] = fixture;
    });

    // Migrate each prediction
    for (const [fixtureId, prediction] of Object.entries(predictions)) {
      const fixture = fixtureMap[fixtureId];
      if (!fixture) continue;

      // Determine if this fixture should be marked as calculated
      const isPastFixture = fixture.matchday < currentMatchday || fixture.status === 'FINISHED';
      
      updatedPredictions[fixtureId] = {
        home_score: prediction.home_score,
        away_score: prediction.away_score,
        calculated: isPastFixture
      };
      
      migratedCount++;
    }

    // Update the user's predictions
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({ fixture_predictions: updatedPredictions })
      .eq('id', userId);

    if (updateError) {
      return res.status(500).json({
        success: false,
        error: 'Failed to update predictions'
      });
    }

    res.json({
      success: true,
      message: `Migrated ${migratedCount} predictions for user ${userId}`,
      currentMatchday: currentMatchday,
      migratedCount: migratedCount
    });

  } catch (error) {
    console.error('Error migrating user predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test fixture points calculation for specific user
app.get('/api/test-fixture-points/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    console.log(`🧪 Testing fixture points calculation for user: ${userId}`);
    
    // First, let's get all user IDs to see what's available
    const { data: allUsers, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, user_id, fixture_predictions');
    
    if (usersError) {
      return res.json({
        success: true,
        userId: userId,
        debug: {
          usersError: usersError,
          message: 'Error fetching users'
        }
      });
    }
    
    // Get user's fixture predictions using the internal id field
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      return res.json({
        success: true,
        userId: userId,
        debug: {
          userProfile: userProfile,
          profileError: profileError,
          message: 'No user profile found',
          availableUsers: allUsers.map(u => ({ id: u.id, user_id: u.user_id }))
        }
      });
    }

    const predictions = userProfile.fixture_predictions || {};
    
    // Get finished fixtures that haven't been calculated yet
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status, calculated')
      .eq('status', 'FINISHED')
      .eq('calculated', false);

    if (fixturesError) {
      return res.json({
        success: true,
        userId: userId,
        debug: {
          fixturesError: fixturesError,
          message: 'Error fetching finished fixtures'
        }
      });
    }

    // Also get all finished fixtures for debugging
    const { data: allFinishedFixtures, error: allFinishedError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status, calculated')
      .eq('status', 'FINISHED');

    // Calculate points
    let totalPoints = 0;
    let exactCount = 0;
    let resultCount = 0;
    const matches = [];

    for (const fixture of finishedFixtures) {
      // Try both string and number versions of the fixture ID
      const prediction = predictions[fixture.id] || predictions[fixture.id.toString()];
      console.log(`🔍 Fixture ${fixture.id} (type: ${typeof fixture.id}): prediction found = ${!!prediction}`);
      if (!prediction || prediction.home_score === null || prediction.home_score === undefined || prediction.away_score === null || prediction.away_score === undefined) {
        console.log(`⏭️ Skipping fixture ${fixture.id} - no prediction or empty scores`);
        continue;
      }

      const predictedHome = parseInt(prediction.home_score);
      const predictedAway = parseInt(prediction.away_score);
      const actualHome = parseInt(fixture.home_score);
      const actualAway = parseInt(fixture.away_score);

      console.log(`🔢 Parsed scores - Predicted: ${predictedHome}-${predictedAway}, Actual: ${actualHome}-${actualAway}`);

      if (isNaN(predictedHome) || isNaN(predictedAway) || isNaN(actualHome) || isNaN(actualAway)) {
        console.log(`❌ Invalid scores - Predicted: ${predictedHome}-${predictedAway}, Actual: ${actualHome}-${actualAway}`);
        continue;
      }

      let points = 0;
      let matchType = 'miss';
      
      // Check for exact score
      if (predictedHome === actualHome && predictedAway === actualAway) {
        points = 3;
        exactCount++;
        matchType = 'exact';
        console.log(`🎯 Exact score! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 3 points`);
      } else {
        // Check for correct result
        const predictedResult = predictedHome > predictedAway ? 'home' : (predictedHome < predictedAway ? 'away' : 'draw');
        const actualResult = actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : 'draw');
        
        console.log(`🔍 Result check - Predicted: ${predictedResult}, Actual: ${actualResult}`);
        
        if (predictedResult === actualResult) {
          points = 1;
          resultCount++;
          matchType = 'result';
          console.log(`✅ Correct result! ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 1 point`);
        } else {
          console.log(`❌ Wrong result: ${predictedHome}-${predictedAway} vs ${actualHome}-${actualAway} = 0 points`);
        }
      }

      totalPoints += points;
      
      // Update the points_earned in the prediction
      if (prediction) {
        prediction.points_earned = points;
      }
      
      matches.push({
        fixtureId: fixture.id,
        fixtureIdString: fixture.id.toString(),
        predicted: `${predictedHome}-${predictedAway}`,
        actual: `${actualHome}-${actualAway}`,
        points: points,
        type: matchType,
        predictionFound: !!prediction,
        predictedResult: predictedHome > predictedAway ? 'home' : (predictedHome < predictedAway ? 'away' : 'draw'),
        actualResult: actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : 'draw')
      });
    }

    // Update the user's fixture_predictions with the new points_earned values
    if (Object.keys(predictions).length > 0) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ fixture_predictions: predictions })
        .eq('id', userId);
      
      if (updateError) {
        console.log(`❌ Error updating fixture predictions for user ${userId}:`, updateError);
      } else {
        console.log(`✅ Updated fixture predictions for user ${userId}`);
      }
    }

    res.json({
      success: true,
      userId: userId,
      debug: {
        predictionCount: Object.keys(predictions).length,
        finishedFixtureCount: finishedFixtures.length,
        allFinishedFixtureCount: allFinishedFixtures ? allFinishedFixtures.length : 0,
        calculatedFalseCount: allFinishedFixtures ? allFinishedFixtures.filter(f => f.calculated === false).length : 0,
        calculatedTrueCount: allFinishedFixtures ? allFinishedFixtures.filter(f => f.calculated === true).length : 0,
        predictions: predictions,
        finishedFixtures: finishedFixtures,
        allFinishedFixtures: allFinishedFixtures || [],
        matches: matches,
        totalPoints: totalPoints,
        exactCount: exactCount,
        resultCount: resultCount
      }
    });
  } catch (error) {
    console.error('Error testing fixture points:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

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
