const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample users data - Updated to match actual database schema
const sampleUsers = [
  {
    user_id: '11111111-1111-1111-1111-111111111111',
    email: 'alex.smith@example.com',
    display_name: 'Alex Smith',
    table_prediction: ['arsenal', 'man-city', 'liverpool', 'tottenham', 'chelsea', 'man-united', 'newcastle', 'brighton', 'west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'fulham', 'everton', 'wolves', 'bournemouth', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah.johnson@example.com',
    display_name: 'Sarah Johnson',
    table_prediction: ['man-city', 'arsenal', 'tottenham', 'liverpool', 'man-united', 'chelsea', 'brighton', 'newcastle', 'aston-villa', 'west-ham', 'crystal-palace', 'brentford', 'everton', 'fulham', 'bournemouth', 'wolves', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333',
    email: 'mike.wilson@example.com',
    display_name: 'Mike Wilson',
    table_prediction: ['liverpool', 'tottenham', 'arsenal', 'man-city', 'newcastle', 'brighton', 'chelsea', 'man-united', 'brentford', 'crystal-palace', 'west-ham', 'aston-villa', 'wolves', 'everton', 'bournemouth', 'fulham', 'sunderland', 'leeds-united', 'burnley', 'nottingham'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '44444444-4444-4444-4444-444444444444',
    email: 'emma.brown@example.com',
    display_name: 'Emma Brown',
    table_prediction: ['tottenham', 'liverpool', 'man-city', 'arsenal', 'brighton', 'newcastle', 'man-united', 'chelsea', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'fulham', 'everton', 'wolves', 'bournemouth', 'nottingham', 'sunderland', 'leeds-united', 'burnley'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '55555555-5555-5555-5555-555555555555',
    email: 'david.davis@example.com',
    display_name: 'David Davis',
    table_prediction: ['chelsea', 'man-united', 'newcastle', 'brighton', 'arsenal', 'man-city', 'liverpool', 'tottenham', 'everton', 'fulham', 'wolves', 'bournemouth', 'west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '66666666-6666-6666-6666-666666666666',
    email: 'lisa.garcia@example.com',
    display_name: 'Lisa Garcia',
    table_prediction: ['man-united', 'chelsea', 'brighton', 'newcastle', 'man-city', 'arsenal', 'tottenham', 'liverpool', 'fulham', 'everton', 'bournemouth', 'wolves', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '77777777-7777-7777-7777-777777777777',
    email: 'james.miller@example.com',
    display_name: 'James Miller',
    table_prediction: ['newcastle', 'brighton', 'chelsea', 'man-united', 'liverpool', 'tottenham', 'arsenal', 'man-city', 'wolves', 'bournemouth', 'everton', 'fulham', 'brentford', 'crystal-palace', 'west-ham', 'aston-villa', 'nottingham', 'sunderland', 'leeds-united', 'burnley'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '88888888-8888-8888-8888-888888888888',
    email: 'anna.taylor@example.com',
    display_name: 'Anna Taylor',
    table_prediction: ['brighton', 'newcastle', 'man-united', 'chelsea', 'tottenham', 'liverpool', 'man-city', 'arsenal', 'bournemouth', 'wolves', 'fulham', 'everton', 'crystal-palace', 'brentford', 'aston-villa', 'west-ham', 'sunderland', 'nottingham', 'burnley', 'leeds-united'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: '99999999-9999-9999-9999-999999999999',
    email: 'tom.anderson@example.com',
    display_name: 'Tom Anderson',
    table_prediction: ['west-ham', 'aston-villa', 'brentford', 'crystal-palace', 'everton', 'fulham', 'wolves', 'bournemouth', 'arsenal', 'man-city', 'liverpool', 'tottenham', 'chelsea', 'man-united', 'newcastle', 'brighton', 'burnley', 'leeds-united', 'nottingham', 'sunderland'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  },
  {
    user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'sophie.thomas@example.com',
    display_name: 'Sophie Thomas',
    table_prediction: ['aston-villa', 'west-ham', 'crystal-palace', 'brentford', 'fulham', 'everton', 'bournemouth', 'wolves', 'man-city', 'arsenal', 'tottenham', 'liverpool', 'man-united', 'chelsea', 'brighton', 'newcastle', 'leeds-united', 'burnley', 'sunderland', 'nottingham'],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    total_points: 0,
    exact_predictions: 0,
    result_predictions: 0
  }
];

// Sample fixture predictions (random scores for different fixtures)
const generateFixturePredictions = () => {
  const predictions = {};
  // Use fixture IDs from 61 to 380 (as requested)
  const fixtureIds = [];
  for (let i = 61; i <= 380; i++) {
    fixtureIds.push(i.toString());
  }
  
  fixtureIds.forEach(fixtureId => {
    // Generate random scores (0-4 for home, 0-4 for away)
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 5);
    
    predictions[fixtureId] = {
      home_score: homeScore,
      away_score: awayScore,
      created_at: new Date().toISOString()
    };
  });
  
  return predictions;
};

// Function to insert sample users
async function insertSampleUsers() {
  try {
    console.log('🚀 Starting to insert sample users...');
    
    for (const user of sampleUsers) {
      // Generate random fixture predictions for each user
      user.fixture_predictions = generateFixturePredictions();
      
      // Calculate some random points
      user.table_points = Math.floor(Math.random() * 50) + 10; // 10-60 points
      user.fixture_points = Math.floor(Math.random() * 30) + 5; // 5-35 points
      user.exacts = Math.floor(Math.random() * 5) + 1; // 1-6 exact predictions
      user.results = Math.floor(Math.random() * 8) + 2; // 2-10 result predictions
      user.total_points = user.table_points + user.fixture_points;
      
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(user, { onConflict: 'user_id' })
        .select();
      
      if (error) {
        console.error(`❌ Error inserting user ${user.display_name}:`, error);
      } else {
        console.log(`✅ Successfully inserted/updated user: ${user.display_name} (${user.total_points} points)`);
      }
    }
    
    console.log('🎉 Sample users insertion completed!');
    
    // Get the leaderboard to show results
    const { data: leaderboard, error: leaderboardError } = await supabase
      .from('user_profiles')
      .select('display_name, total_points, exacts, results')
      .order('total_points', { ascending: false })
      .limit(10);
    
    if (!leaderboardError && leaderboard) {
      console.log('\n📊 Current Leaderboard:');
      leaderboard.forEach((user, index) => {
        console.log(`${index + 1}. ${user.display_name} - ${user.total_points} points (${user.exacts} exact, ${user.results} results)`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error inserting sample users:', error);
  }
}

// Function to clear all sample users (optional)
async function clearSampleUsers() {
  try {
    console.log('🗑️ Clearing sample users...');
    
    const sampleUserIds = sampleUsers.map(user => user.user_id);
    
    const { error } = await supabase
      .from('user_profiles')
      .delete()
      .in('user_id', sampleUserIds);
    
    if (error) {
      console.error('❌ Error clearing sample users:', error);
    } else {
      console.log('✅ Sample users cleared successfully!');
    }
  } catch (error) {
    console.error('❌ Error clearing sample users:', error);
  }
}

// Run the script
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'clear') {
    clearSampleUsers();
  } else {
    insertSampleUsers();
  }
}

module.exports = { insertSampleUsers, clearSampleUsers };
