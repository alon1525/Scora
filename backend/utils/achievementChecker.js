const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Achievement definitions
const achievements = [
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

// Check and unlock achievements for a user
const checkAchievements = async (userId) => {
  try {
    console.log(`Checking achievements for user: ${userId}`);
    
    // Get user's current achievements
    const { data: userProfile, error: profileError } = await supabase
      .from('user_profiles')
      .select('achievements, exacts, results')
      .eq('user_id', userId)
      .single();

    if (profileError || !userProfile) {
      console.error('Error fetching user profile:', profileError);
      return;
    }

    const currentAchievements = userProfile.achievements || [];
    const unlockedAchievementIds = currentAchievements.map(a => a.id);
    const newAchievements = [];

    // Check each achievement
    for (const achievement of achievements) {
      // Skip if already unlocked
      if (unlockedAchievementIds.includes(achievement.id)) {
        continue;
      }

      let shouldUnlock = false;
      let progress = 0;

      switch (achievement.criteria.type) {
        case 'first_prediction':
          // Check if user has made any predictions
          const { data: predictions, error: predError } = await supabase
            .from('fixture_predictions')
            .select('id')
            .eq('user_id', userId)
            .limit(1);
          
          if (!predError && predictions && predictions.length > 0) {
            shouldUnlock = true;
            progress = 1;
          }
          break;

        case 'exact_predictions':
          progress = userProfile.exacts || 0;
          shouldUnlock = progress >= achievement.criteria.count;
          break;

        case 'result_predictions':
          progress = userProfile.results || 0;
          shouldUnlock = progress >= achievement.criteria.count;
          break;

        case 'first_exact':
          // Check if user has any exact predictions
          if (userProfile.exacts && userProfile.exacts > 0) {
            shouldUnlock = true;
            progress = 1;
          }
          break;
      }

      if (shouldUnlock) {
        console.log(`🎉 Unlocking achievement: ${achievement.name}`);
        newAchievements.push({
          ...achievement,
          unlocked_at: new Date().toISOString(),
          progress: progress
        });
      }
    }

    // If there are new achievements, update the user profile
    if (newAchievements.length > 0) {
      const updatedAchievements = [...currentAchievements, ...newAchievements];
      
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ achievements: updatedAchievements })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating achievements:', updateError);
      } else {
        console.log(`✅ Updated achievements for user ${userId}:`, newAchievements.map(a => a.name));
      }
    }

    return newAchievements;

  } catch (error) {
    console.error('Error checking achievements:', error);
    return [];
  }
};

// Check achievements for all users (useful for batch processing)
const checkAllUsersAchievements = async () => {
  try {
    const { data: users, error } = await supabase
      .from('user_profiles')
      .select('user_id');

    if (error) {
      console.error('Error fetching users:', error);
      return;
    }

    console.log(`Checking achievements for ${users.length} users...`);
    
    for (const user of users) {
      await checkAchievements(user.user_id);
    }

    console.log('✅ Finished checking achievements for all users');
  } catch (error) {
    console.error('Error in batch achievement check:', error);
  }
};

module.exports = {
  checkAchievements,
  checkAllUsersAchievements,
  achievements
};
