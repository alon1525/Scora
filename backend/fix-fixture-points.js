const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  'https://nopucomnlyvogmfdldaw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ'
);

// Function to calculate points for a single prediction
function calculateFixturePoints(predictedHome, predictedAway, actualHome, actualAway) {
  if (actualHome === null || actualAway === null) {
    return 0; // Game not finished yet
  }

  // Exact score match = 3 points
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return 3;
  }

  // Correct result (win/draw/loss) = 1 point
  const predictedResult = predictedHome > predictedAway ? 'home_win' : 
                         predictedHome < predictedAway ? 'away_win' : 'draw';
  const actualResult = actualHome > actualAway ? 'home_win' : 
                       actualHome < actualAway ? 'away_win' : 'draw';
  
  if (predictedResult === actualResult) {
    return 1;
  }

  return 0; // Wrong prediction
}

async function fixFixturePoints() {
  console.log('🔧 Fixing fixture points for all users...');
  
  try {
    // Get all users with predictions
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('id, display_name, fixture_predictions, fixture_points')
      .not('fixture_predictions', 'is', null);
    
    if (usersError) {
      console.error('❌ Error fetching users:', usersError);
      return;
    }

    console.log(`📊 Found ${users.length} users with predictions`);

    // Get all finished fixtures
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status')
      .eq('status', 'FINISHED')
      .not('home_score', 'is', null)
      .not('away_score', 'is', null);
    
    if (fixturesError) {
      console.error('❌ Error fetching fixtures:', fixturesError);
      return;
    }

    console.log(`⚽ Found ${fixtures.length} finished fixtures`);

    let totalUpdated = 0;

    // Process each user
    for (const user of users) {
      if (!user.fixture_predictions || typeof user.fixture_predictions !== 'object') {
        continue;
      }

      let userTotalPoints = 0;
      let exactPredictions = 0;
      let resultPredictions = 0;
      let totalPredictions = 0;

      // Calculate points for each finished fixture
      for (const fixture of fixtures) {
        const prediction = user.fixture_predictions[fixture.id.toString()];
        if (!prediction || !prediction.home_score || !prediction.away_score) {
          continue;
        }

        const points = calculateFixturePoints(
          prediction.home_score,
          prediction.away_score,
          fixture.home_score,
          fixture.away_score
        );

        userTotalPoints += points;
        totalPredictions++;

        if (points === 3) {
          exactPredictions++;
        } else if (points === 1) {
          resultPredictions++;
        }
      }

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          fixture_points: userTotalPoints,
          exact_predictions: exactPredictions,
          result_predictions: resultPredictions,
          total_predictions: totalPredictions,
          total_points: userTotalPoints + (user.table_points || 0),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        console.error(`❌ Error updating user ${user.display_name}:`, updateError);
      } else {
        console.log(`✅ Updated ${user.display_name}: ${userTotalPoints} fixture points (${exactPredictions} exact, ${resultPredictions} result)`);
        totalUpdated++;
      }
    }

    console.log(`🎉 Successfully updated fixture points for ${totalUpdated} users`);

  } catch (error) {
    console.error('❌ Error fixing fixture points:', error);
  }
}

// Run the script
fixFixturePoints().catch(console.error);
