// Update all user scores with new system
// Run this with: node update-all-scores.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Updating all user scores with new system...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateAllScores() {
  try {
    // Get all user profiles
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

    // Update scores for each user
    for (const profile of profiles) {
      console.log(`\n🎯 Updating scores for: ${profile.display_name || profile.email}`);
      
      // Calculate table points with new system
      let tablePoints = 0;
      const prediction = profile.table_prediction || [];
      
      for (let i = 0; i < prediction.length; i++) {
        const predictedTeam = prediction[i];
        const actualPosition = standingsLookup[predictedTeam];
        
        if (actualPosition === undefined) {
          // 0 points for teams not in standings
        } else {
          const positionDiff = Math.abs((i + 1) - actualPosition);
          const teamPoints = Math.max(0, 20 - positionDiff);
          tablePoints += teamPoints;
        }
      }
      
      console.log(`  📊 Calculated table points: ${tablePoints} (max 400)`);
      
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
        console.error(`  ❌ Error updating user:`, updateError);
      } else {
        console.log(`  ✅ Updated! New total: ${profile.fixture_points + tablePoints}`);
      }
    }

    console.log('\n🎉 All scores updated with new system!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateAllScores();
