// Update your specific user scores
// Run this with: node update-your-scores.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Updating your user scores...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateYourScores() {
  try {
    // Your user ID
    const yourUserId = '6a7cdd59-00a4-4be9-94ed-b62b20d5e65e';
    
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

    console.log(`📊 Found ${standings.length} teams in standings`);

    // Get your user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', yourUserId)
      .single();

    if (profileError || !profile) {
      console.error('❌ Error getting your profile:', profileError);
      return;
    }

    console.log(`\n🎯 Updating: ${profile.display_name || profile.email}`);
    console.log(`   Current table points: ${profile.table_points}`);
    console.log(`   Current fixture points: ${profile.fixture_points}`);
    console.log(`   Current total: ${profile.total_points}`);
    
    // Calculate table points with new system
    let tablePoints = 0;
    const prediction = profile.table_prediction || [];
    
    console.log(`\n📊 Calculating table points for ${prediction.length} teams:`);
    
    for (let i = 0; i < prediction.length; i++) {
      const predictedTeam = prediction[i];
      const actualPosition = standingsLookup[predictedTeam];
      
      if (actualPosition !== undefined) {
        const positionDiff = Math.abs((i + 1) - actualPosition);
        const teamPoints = Math.max(0, 20 - positionDiff);
        tablePoints += teamPoints;
        console.log(`  ${i + 1}. ${predictedTeam}: predicted ${i + 1}, actual ${actualPosition}, diff ${positionDiff}, points ${teamPoints}`);
      } else {
        console.log(`  ${i + 1}. ${predictedTeam}: NOT FOUND in standings (0 points)`);
      }
    }
    
    const totalPoints = profile.fixture_points + tablePoints;
    console.log(`\n📊 New scores:`);
    console.log(`   Table points: ${tablePoints} (was ${profile.table_points})`);
    console.log(`   Fixture points: ${profile.fixture_points} (unchanged)`);
    console.log(`   Total points: ${totalPoints} (was ${profile.total_points})`);
    
    // Update your profile directly
    const { error: updateError } = await supabase
      .from('user_profiles')
      .update({
        table_points: tablePoints,
        total_points: totalPoints,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id); // Use id instead of user_id to avoid triggers

    if (updateError) {
      console.error(`❌ Error updating your profile:`, updateError);
    } else {
      console.log(`\n✅ Your scores updated successfully!`);
      console.log(`   New total: ${totalPoints} points`);
    }

  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateYourScores();
