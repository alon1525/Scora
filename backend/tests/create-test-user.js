// Create a test user profile
// Run this with: node create-test-user.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Creating test user profile...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestUser() {
  try {
    const testUserId = '00000000-0000-0000-0000-000000000003';
    
    console.log('📊 Creating test user profile...');
    const { data: insertData, error: insertError } = await supabase
      .from('user_profiles')
      .insert({
        user_id: testUserId,
        email: 'test3@example.com',
        display_name: 'Test User 3',
        table_prediction: [
          'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
          'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
          'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
          'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
        ],
        fixture_points: 0,
        table_points: 20, // Will be recalculated
        total_points: 20,
        fixture_predictions: {}
      })
      .select();

    if (insertError) {
      console.error('❌ Insert error:', insertError);
    } else {
      console.log('✅ Insert successful:', insertData);
      
      // Now recalculate the scores
      console.log('\n📊 Recalculating scores...');
      
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

      // Calculate table points manually
      let tablePoints = 20; // Start with 20 points
      const prediction = insertData[0].table_prediction || [];
      
      console.log(`🎯 Prediction: ${prediction.slice(0, 5).join(', ')}...`);
      
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
      
      console.log(`📊 Calculated table points: ${tablePoints}`);
      
      // Update the user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          table_points: tablePoints,
          total_points: 0 + tablePoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', testUserId);

      if (updateError) {
        console.error(`❌ Error updating user:`, updateError);
      } else {
        console.log(`✅ Updated successfully! New total: ${tablePoints}`);
      }
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

createTestUser();
