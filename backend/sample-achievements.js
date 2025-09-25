// Sample achievements data to add to the database
const sampleAchievements = [
  {
    id: 1,
    name: "Rookie Predictor",
    description: "Made your first prediction",
    icon: "emoji_events",
    criteria: { type: "first_prediction", count: 1 },
    points: 10
  },
  {
    id: 2,
    name: "Precision Master",
    description: "Achieved 10 exact predictions",
    icon: "target",
    criteria: { type: "exact_predictions", count: 10 },
    points: 50
  },
  {
    id: 3,
    name: "Result King",
    description: "Got 15 result predictions correct",
    icon: "trending_up",
    criteria: { type: "result_predictions", count: 15 },
    points: 75
  },
  {
    id: 4,
    name: "Bullseye",
    description: "Got your first exact prediction",
    icon: "star",
    criteria: { type: "first_exact", count: 1 },
    points: 25
  }
];

// Add some sample achievements to a user for testing
const addSampleAchievementsToUser = async (userId) => {
  const { createClient } = require('@supabase/supabase-js');
  
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Get first 3 achievements as sample
  const userAchievements = sampleAchievements.slice(0, 3);

  const { data, error } = await supabase
    .from('user_profiles')
    .update({ achievements: userAchievements })
    .eq('user_id', userId);

  if (error) {
    console.error('Error adding achievements:', error);
  } else {
    console.log('Sample achievements added successfully!');
  }
};

module.exports = { sampleAchievements, addSampleAchievementsToUser };
