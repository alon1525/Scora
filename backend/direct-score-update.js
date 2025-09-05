// Direct score update without database functions
// Run this with: node direct-score-update.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Direct score update...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function directUpdate() {
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

    // Update each user directly
    for (const profile of profiles) {
      console.log(`\n🎯 Updating: ${profile.display_name || profile.email}`);
      
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
      console.log(`  📊 Table: ${tablePoints}, Fixture: ${profile.fixture_points}, Total: ${totalPoints}`);
      
      // Direct update without functions
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          table_points: tablePoints,
          total_points: totalPoints
        })
        .eq('id', profile.id); // Use id instead of user_id to avoid triggers

      if (updateError) {
        console.error(`  ❌ Error:`, updateError);
      } else {
        console.log(`  ✅ Updated successfully!`);
      }
    }

    console.log('\n🎉 All scores updated!');

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

directUpdate();
