// Test table scoring system
// Run this with: node test-table-scoring.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing table scoring system...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testTableScoring() {
  try {
    // Get current standings
    console.log('📊 Getting current standings...');
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('team_id, position, team_name')
      .eq('season', '2025')
      .order('position');

    if (standingsError) {
      console.error('❌ Error getting standings:', standingsError);
      return;
    }

    console.log('📊 Current standings:');
    standings.forEach(team => {
      console.log(`  ${team.position}. ${team.team_name} (${team.team_id})`);
    });

    // Test with default prediction (Arsenal first)
    const defaultPrediction = [
      'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
      'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
      'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
      'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
    ];

    console.log('\n🎯 Testing default prediction scoring...');
    const { data: scoreData, error: scoreError } = await supabase
      .rpc('calculate_table_points', {
        predicted_positions: defaultPrediction,
        season_param: '2025'
      });

    if (scoreError) {
      console.error('❌ Error calculating score:', scoreError);
    } else {
      console.log(`✅ Default prediction score: ${scoreData} points`);
    }

    // Test with perfect prediction (matching actual standings)
    const perfectPrediction = standings.map(team => team.team_id);
    console.log('\n🎯 Testing perfect prediction scoring...');
    const { data: perfectScoreData, error: perfectScoreError } = await supabase
      .rpc('calculate_table_points', {
        predicted_positions: perfectPrediction,
        season_param: '2025'
      });

    if (perfectScoreError) {
      console.error('❌ Error calculating perfect score:', perfectScoreError);
    } else {
      console.log(`✅ Perfect prediction score: ${perfectScoreData} points`);
    }

    // Test with worst prediction (reverse order)
    const worstPrediction = [...standings].reverse().map(team => team.team_id);
    console.log('\n🎯 Testing worst prediction scoring...');
    const { data: worstScoreData, error: worstScoreError } = await supabase
      .rpc('calculate_table_points', {
        predicted_positions: worstPrediction,
        season_param: '2025'
      });

    if (worstScoreError) {
      console.error('❌ Error calculating worst score:', worstScoreError);
    } else {
      console.log(`✅ Worst prediction score: ${worstScoreData} points`);
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testTableScoring();
