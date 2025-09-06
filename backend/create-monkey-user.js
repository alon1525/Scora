const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ";
const supabase = createClient(supabaseUrl, supabaseKey);

// Team IDs for Premier League
const TEAM_IDS = [
  'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton', 'burnley',
  'chelsea', 'crystal-palace', 'everton', 'fulham', 'leeds-united', 'liverpool',
  'man-city', 'man-united', 'newcastle', 'nottingham', 'sunderland', 'tottenham',
  'west-ham', 'wolves'
];

// Generate random table prediction
function generateRandomTablePrediction() {
  const shuffled = [...TEAM_IDS].sort(() => Math.random() - 0.5);
  const tablePrediction = [];
  
  shuffled.forEach((teamId, index) => {
    tablePrediction.push({
      team_id: teamId,
      position: index + 1
    });
  });
  
  return tablePrediction;
}

// Generate random score prediction
function generateRandomScore() {
  // Most common scores in football: 0-0, 1-0, 1-1, 2-1, 2-0, etc.
  const commonScores = [
    [0, 0], [1, 0], [0, 1], [1, 1], [2, 1], [1, 2], [2, 0], [0, 2],
    [2, 2], [3, 1], [1, 3], [3, 0], [0, 3], [3, 2], [2, 3], [4, 0],
    [0, 4], [4, 1], [1, 4], [5, 0], [0, 5]
  ];
  
  // 70% chance for common scores, 30% for random
  if (Math.random() < 0.7) {
    const randomScore = commonScores[Math.floor(Math.random() * commonScores.length)];
    return randomScore;
  } else {
    return [Math.floor(Math.random() * 6), Math.floor(Math.random() * 6)];
  }
}

async function createMonkeyUser() {
  try {
    console.log('🐒 Creating The Monkey user...');
    
    // Generate a fixed UUID for The Monkey
    const monkeyUserId = '00000000-0000-0000-0000-000000000001';
    
    // Create user profile
    const { data: profileData, error: profileError } = await supabase
      .from('user_profiles')
      .upsert({
        user_id: monkeyUserId,
        email: 'themonkey@example.com',
        display_name: 'The Monkey',
        table_prediction: generateRandomTablePrediction(),
        total_points: 0,
        table_points: 0,
        fixture_points: 0,
        exact_predictions: 0,
        result_predictions: 0,
        close_predictions: 0,
        total_predictions: 0,
        badges_count: 0,
        country_code: 'GB',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      })
      .select();

    if (profileError) {
      console.error('Error creating monkey profile:', profileError);
      return;
    }

    console.log('✅ Monkey profile created:', profileData[0].display_name);

    // Get all fixtures
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('*');

    if (fixturesError) {
      console.error('Error fetching fixtures:', fixturesError);
      return;
    }

    console.log(`📅 Found ${fixtures.length} fixtures to predict`);

    // Create random predictions for all fixtures
    const fixturePredictions = {};
    
    for (const fixture of fixtures) {
      const [homeScore, awayScore] = generateRandomScore();
      
      fixturePredictions[fixture.id] = {
        home_score: homeScore,
        away_score: awayScore,
        points_earned: 0
      };
    }

    // Update user profile with fixture predictions
    const { data: predictionData, error: predictionError } = await supabase
      .from('user_profiles')
      .update({
        fixture_predictions: fixturePredictions,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', monkeyUserId)
      .select();

    if (predictionError) {
      console.error('Error creating monkey predictions:', predictionError);
      return;
    }

    console.log(`🎯 Created ${Object.keys(fixturePredictions).length} random predictions for The Monkey`);
    console.log('🐒 The Monkey user created successfully!');
    console.log('📊 The Monkey will appear at the bottom of leaderboards');
    console.log('🎲 If users forget to predict, The Monkey\'s prediction will be used');

  } catch (error) {
    console.error('Error creating monkey user:', error);
  }
}

// Run the script
createMonkeyUser();
