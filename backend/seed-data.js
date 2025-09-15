const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Sample users data
const sampleUsers = [
  {
    user_id: '11111111-1111-1111-1111-111111111111',
    email: 'alex.smith@example.com',
    display_name: 'Alex Smith',
    table_order: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '22222222-2222-2222-2222-222222222222',
    email: 'sarah.johnson@example.com',
    display_name: 'Sarah Johnson',
    table_order: [2, 1, 4, 3, 6, 5, 8, 7, 10, 9, 12, 11, 14, 13, 16, 15, 18, 17, 20, 19],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '33333333-3333-3333-3333-333333333333',
    email: 'mike.wilson@example.com',
    display_name: 'Mike Wilson',
    table_order: [3, 4, 1, 2, 7, 8, 5, 6, 11, 12, 9, 10, 15, 16, 13, 14, 19, 20, 17, 18],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '44444444-4444-4444-4444-444444444444',
    email: 'emma.brown@example.com',
    display_name: 'Emma Brown',
    table_order: [4, 3, 2, 1, 8, 7, 6, 5, 12, 11, 10, 9, 16, 15, 14, 13, 20, 19, 18, 17],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '55555555-5555-5555-5555-555555555555',
    email: 'david.davis@example.com',
    display_name: 'David Davis',
    table_order: [5, 6, 7, 8, 1, 2, 3, 4, 13, 14, 15, 16, 9, 10, 11, 12, 17, 18, 19, 20],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '66666666-6666-6666-6666-666666666666',
    email: 'lisa.garcia@example.com',
    display_name: 'Lisa Garcia',
    table_order: [6, 5, 8, 7, 2, 1, 4, 3, 14, 13, 16, 15, 10, 9, 12, 11, 18, 17, 20, 19],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '77777777-7777-7777-7777-777777777777',
    email: 'james.miller@example.com',
    display_name: 'James Miller',
    table_order: [7, 8, 5, 6, 3, 4, 1, 2, 15, 16, 13, 14, 11, 12, 9, 10, 19, 20, 17, 18],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '88888888-8888-8888-8888-888888888888',
    email: 'anna.taylor@example.com',
    display_name: 'Anna Taylor',
    table_order: [8, 7, 6, 5, 4, 3, 2, 1, 16, 15, 14, 13, 12, 11, 10, 9, 20, 19, 18, 17],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: '99999999-9999-9999-9999-999999999999',
    email: 'tom.anderson@example.com',
    display_name: 'Tom Anderson',
    table_order: [9, 10, 11, 12, 13, 14, 15, 16, 1, 2, 3, 4, 5, 6, 7, 8, 17, 18, 19, 20],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  },
  {
    user_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    email: 'sophie.thomas@example.com',
    display_name: 'Sophie Thomas',
    table_order: [10, 9, 12, 11, 14, 13, 16, 15, 2, 1, 4, 3, 6, 5, 8, 7, 18, 17, 20, 19],
    fixture_predictions: {},
    table_points: 0,
    fixture_points: 0,
    exact_predictions: 0,
    result_predictions: 0,
    close_predictions: 0,
    total_predictions: 0,
    total_points: 0
  }
];

// Sample fixture predictions (random scores for different fixtures)
const generateFixturePredictions = () => {
  const predictions = {};
  const fixtureIds = ['1001', '1002', '1003', '1004', '1005', '1006', '1007', '1008', '1009', '1010'];
  
  fixtureIds.forEach(fixtureId => {
    // Generate random scores (0-4 for home, 0-4 for away)
    const homeScore = Math.floor(Math.random() * 5);
    const awayScore = Math.floor(Math.random() * 5);
    
    predictions[fixtureId] = {
      home_score: homeScore.toString(),
      away_score: awayScore.toString(),
      points_earned: 0, // Will be calculated later
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
      user.exact_predictions = Math.floor(Math.random() * 5) + 1; // 1-6 exact predictions
      user.result_predictions = Math.floor(Math.random() * 8) + 2; // 2-10 result predictions
      user.close_predictions = Math.floor(Math.random() * 10) + 1; // 1-11 close predictions
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
      .select('display_name, total_points, exact_predictions, result_predictions')
      .order('total_points', { ascending: false })
      .limit(10);
    
    if (!leaderboardError && leaderboard) {
      console.log('\n📊 Current Leaderboard:');
      leaderboard.forEach((user, index) => {
        console.log(`${index + 1}. ${user.display_name} - ${user.total_points} points (${user.exact_predictions} exact, ${user.result_predictions} results)`);
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
