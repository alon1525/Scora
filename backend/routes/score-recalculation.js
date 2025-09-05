// Score recalculation routes
// Handles automatic score updates when standings change

const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Calculate table points for a user's prediction
function calculateTablePoints(prediction, standingsLookup) {
  let totalPoints = 0;
  
  for (let i = 0; i < prediction.length; i++) {
    const predictedTeam = prediction[i];
    const actualPosition = standingsLookup[predictedTeam];
    
    if (actualPosition !== undefined) {
      const positionDiff = Math.abs((i + 1) - actualPosition);
      const teamPoints = Math.max(0, 20 - positionDiff);
      totalPoints += teamPoints;
    }
  }
  
  return totalPoints;
}

// Calculate fixture points for a user's predictions
async function calculateFixturePoints(userId, supabase) {
  try {
    // Get user's fixture predictions
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('fixture_predictions')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile?.fixture_predictions) {
      return 0;
    }

    const predictions = profile.fixture_predictions;
    let totalPoints = 0;

    // Get all finished fixtures
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('*')
      .eq('status', 'FINISHED');

    if (fixturesError) {
      console.error('Error getting fixtures:', fixturesError);
      return 0;
    }

    // Calculate points for each prediction
    for (const [fixtureId, prediction] of Object.entries(predictions)) {
      const fixture = fixtures.find(f => f.id.toString() === fixtureId);
      if (!fixture) continue;

      const { home_score, away_score } = prediction;
      const { home_score: actualHome, away_score: actualAway } = fixture;

      // Calculate points based on prediction accuracy
      let points = 0;
      
      // Exact score: 3 points
      if (home_score === actualHome && away_score === actualAway) {
        points = 3;
      }
      // Correct result: 1 point
      else if (
        (home_score > away_score && actualHome > actualAway) ||
        (home_score < away_score && actualHome < actualAway) ||
        (home_score === away_score && actualHome === actualAway)
      ) {
        points = 1;
      }
      // Wrong result: 0 points
      
      totalPoints += points;
    }

    return totalPoints;
  } catch (error) {
    console.error('Error calculating fixture points:', error);
    return 0;
  }
}

// Recalculate all user scores
router.post('/recalculate-all', async (req, res) => {
  try {
    console.log('🔄 Starting score recalculation for all users...');

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

    console.log(`📊 Found ${standings.length} teams in standings`);

    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      throw new Error(`Profiles error: ${profilesError.message}`);
    }

    console.log(`👥 Found ${profiles.length} user profiles`);

    let updatedCount = 0;
    const results = [];

    // Update each user
    for (const profile of profiles) {
      try {
        console.log(`\n🎯 Updating: ${profile.display_name || profile.email}`);
        
        // Calculate table points
        const tablePoints = calculateTablePoints(profile.table_prediction || [], standingsLookup);
        
        // Calculate fixture points
        const fixturePoints = await calculateFixturePoints(profile.user_id, supabase);
        
        const totalPoints = fixturePoints + tablePoints;
        
        console.log(`  📊 Table: ${tablePoints}, Fixture: ${fixturePoints}, Total: ${totalPoints}`);
        
        // Update the user profile (disable trigger temporarily)
        const { error: updateError } = await supabase
          .from('user_profiles')
          .update({
            table_points: tablePoints,
            fixture_points: fixturePoints,
            total_points: totalPoints,
            updated_at: new Date().toISOString()
          })
          .eq('id', profile.id);

        if (updateError) {
          console.error(`  ❌ Error updating user:`, updateError);
          results.push({
            user: profile.display_name || profile.email,
            success: false,
            error: updateError.message
          });
        } else {
          console.log(`  ✅ Updated successfully!`);
          results.push({
            user: profile.display_name || profile.email,
            success: true,
            table_points: tablePoints,
            fixture_points: fixturePoints,
            total_points: totalPoints
          });
          updatedCount++;
        }
      } catch (userError) {
        console.error(`  ❌ Error processing user:`, userError);
        results.push({
          user: profile.display_name || profile.email,
          success: false,
          error: userError.message
        });
      }
    }

    console.log(`\n🎉 Recalculation complete! Updated ${updatedCount}/${profiles.length} users`);

    res.json({
      success: true,
      message: `Recalculated scores for ${updatedCount} users`,
      updated_count: updatedCount,
      total_users: profiles.length,
      results: results
    });

  } catch (error) {
    console.error('❌ Recalculation failed:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Recalculate scores for a specific user
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

    // Calculate points
    const tablePoints = calculateTablePoints(profile.table_prediction || [], standingsLookup);
    const fixturePoints = await calculateFixturePoints(userId, supabase);
    const totalPoints = fixturePoints + tablePoints;

    console.log(`📊 Calculated - Table: ${tablePoints}, Fixture: ${fixturePoints}, Total: ${totalPoints}`);

    // Update user profile
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        table_points: tablePoints,
        fixture_points: fixturePoints,
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
      fixture_points: fixturePoints,
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
