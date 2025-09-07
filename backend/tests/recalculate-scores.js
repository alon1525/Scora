// Recalculate user scores manually
// Run this with: node recalculate-scores.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Recalculating user scores...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function recalculateScores() {
  try {
    // Get all user profiles
    console.log('📊 Getting all user profiles...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (profilesError) {
      console.error('❌ Error getting profiles:', profilesError);
      return;
    }

    console.log(`📊 Found ${profiles.length} user profiles`);

    // Get current standings
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('team_id, position')
      .eq('season', '2025')
      .order('position');

    if (standingsError) {
      console.error('❌ Error getting standings:', standingsError);
      return;
    }

    // Create standings lookup
    const standingsLookup = {};
    standings.forEach(team => {
      standingsLookup[team.team_id] = team.position;
    });

    console.log('📊 Current standings lookup:', standingsLookup);

    // Recalculate scores for each user
    for (const profile of profiles) {
      console.log(`\n🎯 Recalculating scores for user: ${profile.display_name || profile.email}`);
      
      // Calculate table points manually
      let tablePoints = 20; // Start with 20 points
      const prediction = profile.table_prediction || [];
      
      console.log(`  Prediction: ${prediction.slice(0, 5).join(', ')}...`);
      
      for (let i = 0; i < prediction.length; i++) {
        const predictedTeam = prediction[i];
        const actualPosition = standingsLookup[predictedTeam];
        
        if (actualPosition === undefined) {
          console.log(`  ⚠️  Team ${predictedTeam} not found in standings - penalty -5`);
          tablePoints -= 5;
        } else {
          const positionDiff = Math.abs((i + 1) - actualPosition);
          tablePoints -= positionDiff;
          console.log(`  ${predictedTeam}: predicted ${i + 1}, actual ${actualPosition}, diff ${positionDiff}`);
        }
      }
      
      tablePoints = Math.max(0, tablePoints); // Don't go below 0
      
      console.log(`  📊 Calculated table points: ${tablePoints}`);
      
      // Update the user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          table_points: tablePoints,
          total_points: profile.fixture_points + tablePoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id);

      if (updateError) {
        console.error(`  ❌ Error updating user ${profile.user_id}:`, updateError);
      } else {
        console.log(`  ✅ Updated successfully! New total: ${profile.fixture_points + tablePoints}`);
      }
    }

    console.log('\n🎉 Score recalculation complete!');

  } catch (error) {
    console.error('❌ Recalculation failed:', error);
  }
}

recalculateScores();
