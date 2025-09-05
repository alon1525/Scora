// Simple score test without stack depth issues
// Run this with: node simple-score-test.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

console.log('🔍 Testing table scoring...');

const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testScoring() {
  try {
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

    console.log('📊 Current standings:');
    Object.entries(standingsLookup).forEach(([team, pos]) => {
      console.log(`  ${pos}. ${team}`);
    });

    // Test default prediction
    const defaultPrediction = [
      'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
      'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
      'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
      'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
    ];

    console.log('\n🎯 Testing default prediction (NEW SYSTEM):');
    let tablePoints = 0;
    
    for (let i = 0; i < defaultPrediction.length; i++) {
      const predictedTeam = defaultPrediction[i];
      const actualPosition = standingsLookup[predictedTeam];
      
      if (actualPosition === undefined) {
        console.log(`  ${i + 1}. ${predictedTeam}: NOT FOUND (0 points)`);
        // 0 points for teams not in standings
      } else {
        const positionDiff = Math.abs((i + 1) - actualPosition);
        const teamPoints = Math.max(0, 20 - positionDiff);
        tablePoints += teamPoints;
        console.log(`  ${i + 1}. ${predictedTeam}: predicted ${i + 1}, actual ${actualPosition}, diff ${positionDiff}, points ${teamPoints}`);
      }
    }
    
    console.log(`\n📊 Total table points: ${tablePoints} (max 400)`);

    // Test perfect prediction
    console.log('\n🎯 Testing perfect prediction (NEW SYSTEM):');
    const perfectPrediction = Object.entries(standingsLookup)
      .sort((a, b) => a[1] - b[1])
      .map(([team]) => team);
    
    let perfectPoints = 0;
    for (let i = 0; i < perfectPrediction.length; i++) {
      const predictedTeam = perfectPrediction[i];
      const actualPosition = standingsLookup[predictedTeam];
      const positionDiff = Math.abs((i + 1) - actualPosition);
      const teamPoints = Math.max(0, 20 - positionDiff);
      perfectPoints += teamPoints;
      console.log(`  ${i + 1}. ${predictedTeam}: predicted ${i + 1}, actual ${actualPosition}, diff ${positionDiff}, points ${teamPoints}`);
    }
    
    console.log(`\n📊 Perfect prediction points: ${perfectPoints} (max 400)`);

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testScoring();
