const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Map football-data team names to our internal IDs
const TEAM_NAME_TO_ID = {
  'Arsenal FC': 'arsenal',
  'Aston Villa FC': 'aston-villa',
  'AFC Bournemouth': 'bournemouth',
  'Brentford FC': 'brentford',
  'Brighton & Hove Albion FC': 'brighton',
  'Burnley FC': 'burnley',
  'Chelsea FC': 'chelsea',
  'Crystal Palace FC': 'crystal-palace',
  'Everton FC': 'everton',
  'Fulham FC': 'fulham',
  'Leeds United FC': 'leeds-united',
  'Liverpool FC': 'liverpool',
  'Manchester City FC': 'man-city',
  'Manchester United FC': 'man-united',
  'Newcastle United FC': 'newcastle',
  'Nottingham Forest FC': 'nottingham',
  'Sunderland AFC': 'sunderland',
  'Tottenham Hotspur FC': 'tottenham',
  'West Ham United FC': 'west-ham',
  'Wolverhampton Wanderers FC': 'wolves',
  'Luton Town FC': 'luton-town',
  'Sheffield United FC': 'sheffield-united',
  'Ipswich Town FC': 'ipswich-town',
  'Leicester City FC': 'leicester-city',
};

// Fetch standings from football-data.org API
async function fetchStandingsFromAPI(season = '2025') {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  const url = `https://api.football-data.org/v4/competitions/PL/standings?season=${season}`;
  
  console.log(`🔍 Fetching standings from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Successfully fetched standings for ${data.competition.name} ${data.season.startDate}/${data.season.endDate}`);
  
  return data.standings[0].table;
}

// Store standings in database
async function storeStandings(standingsData, season) {
  console.log(`📊 Storing ${standingsData.length} standings for season ${season}`);
  
  let storedCount = 0;
  
  for (const team of standingsData) {
    const teamId = TEAM_NAME_TO_ID[team.team.name];
    
    if (!teamId) {
      console.warn(`⚠️ Unknown team: ${team.team.name}`);
      continue;
    }

    const standingsRecord = {
      team_id: teamId,
      team_name: team.team.name,
      position: team.position,
      played: team.playedGames,
      wins: team.won,
      draws: team.draw,
      losses: team.lost,
      goals_for: team.goalsFor,
      goals_against: team.goalsAgainst,
      goal_difference: team.goalDifference,
      points: team.points,
      season: season
    };

    try {
      const { error } = await supabase
        .from('standings')
        .upsert(standingsRecord, { 
          onConflict: 'team_id,season',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ Error storing standings for ${team.team.name}:`, error);
      } else {
        storedCount++;
        console.log(`✅ Stored standings for ${team.team.name} (${teamId})`);
      }
    } catch (error) {
      console.error(`❌ Exception storing standings for ${team.team.name}:`, error);
    }
  }
  
  return storedCount;
}

// Fetch fixtures from football-data.org API
async function fetchFixturesFromAPI(season = '2025') {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  const url = `https://api.football-data.org/v4/competitions/PL/matches?season=${season}`;
  
  console.log(`🔍 Fetching fixtures from: ${url}`);
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  console.log(`✅ Successfully fetched ${data.matches.length} fixtures for ${data.competition.name} ${data.season.startDate}/${data.season.endDate}`);
  
  return data.matches;
}

// Store fixtures in database
async function storeFixtures(fixturesData, season) {
  console.log(`⚽ Storing ${fixturesData.length} fixtures for season ${season}`);
  
  let storedCount = 0;
  
  for (const fixture of fixturesData) {
    const homeTeamId = TEAM_NAME_TO_ID[fixture.homeTeam.name];
    const awayTeamId = TEAM_NAME_TO_ID[fixture.awayTeam.name];
    
    if (!homeTeamId || !awayTeamId) {
      console.warn(`⚠️ Unknown team: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
      continue;
    }

    const fixtureRecord = {
      id: fixture.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_name: fixture.homeTeam.name,
      away_team_name: fixture.awayTeam.name,
      home_team_logo: fixture.homeTeam.crest,
      away_team_logo: fixture.awayTeam.crest,
      home_score: fixture.score?.fullTime?.home,
      away_score: fixture.score?.fullTime?.away,
      status: fixture.status,
      scheduled_date: fixture.utcDate,
      matchday: fixture.matchday,
      season: season
    };

    try {
      const { error } = await supabase
        .from('fixtures')
        .upsert(fixtureRecord, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        });

      if (error) {
        console.error(`❌ Error storing fixture ${fixture.id}:`, error);
      } else {
        storedCount++;
        console.log(`✅ Stored fixture ${fixture.id}: ${fixture.homeTeam.name} vs ${fixture.awayTeam.name}`);
      }
    } catch (error) {
      console.error(`❌ Exception storing fixture ${fixture.id}:`, error);
    }
  }
  
  return storedCount;
}

// Calculate and update prediction percentages for fixtures
async function calculatePredictionPercentages() {
  console.log('📊 Calculating prediction percentages for fixtures...');
  
  try {
    // Get only fixtures that are TIMED or SCHEDULED (upcoming matches)
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id')
      .in('status', ['TIMED', 'SCHEDULED']);

    if (fixturesError) {
      throw new Error(`Failed to fetch fixtures: ${fixturesError.message}`);
    }

    console.log(`📊 Found ${fixtures.length} fixtures with status TIMED or SCHEDULED to process`);

    // Get all user predictions
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, fixture_predictions')
      .not('fixture_predictions', 'is', null);

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    let updatedCount = 0;

    // Process each fixture
    for (const fixture of fixtures) {
      let homeWins = 0;
      let awayWins = 0;
      let draws = 0;
      let totalPredictions = 0;

      // Count predictions for this fixture
      for (const user of users) {
        const userPredictions = user.fixture_predictions || {};
        const prediction = userPredictions[fixture.id.toString()] || userPredictions[fixture.id];
        
        if (prediction && 
            prediction.home_score !== null && 
            prediction.home_score !== undefined &&
            prediction.away_score !== null && 
            prediction.away_score !== undefined) {
          
          totalPredictions++;
          
          if (prediction.home_score > prediction.away_score) {
            homeWins++;
          } else if (prediction.away_score > prediction.home_score) {
            awayWins++;
          } else {
            draws++;
          }
        }
      }

      // Calculate percentages
      const homePercent = totalPredictions > 0 ? Math.round((homeWins / totalPredictions) * 100) : 0;
      const drawPercent = totalPredictions > 0 ? Math.round((draws / totalPredictions) * 100) : 0;
      const awayPercent = totalPredictions > 0 ? Math.round((awayWins / totalPredictions) * 100) : 0;

      // Update fixture with percentages
      const { error: updateError } = await supabase
        .from('fixtures')
        .update({
          prediction_home_percent: homePercent,
          prediction_draw_percent: drawPercent,
          prediction_away_percent: awayPercent,
          prediction_total_count: totalPredictions
        })
        .eq('id', fixture.id);

      if (updateError) {
        console.error(`❌ Error updating fixture ${fixture.id}:`, updateError);
      } else {
        updatedCount++;
        if (updatedCount % 50 === 0) {
          console.log(`✅ Updated ${updatedCount} fixtures...`);
        }
      }
    }

    console.log(`✅ Prediction percentages calculation completed. Updated ${updatedCount} fixtures`);
    return { success: true, message: `Prediction percentages calculated for ${updatedCount} fixtures` };

  } catch (error) {
    console.error('❌ Error calculating prediction percentages:', error);
    return { success: false, error: error.message };
  }
}

// Recalculate user scores
async function recalculateUserScores() {
  console.log('🧮 Recalculating user scores...');
  
  try {
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, fixture_predictions, table_prediction');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📊 Found ${users.length} users to recalculate`);

    for (const user of users) {
      let totalPoints = 0;
      let exactPredictions = 0;
      let resultPredictions = 0;

      // Calculate fixture points
      if (user.fixture_predictions) {
        const fixturePredictions = user.fixture_predictions;
        
        // Get finished fixtures
        const { data: finishedFixtures, error: fixturesError } = await supabase
          .from('fixtures')
          .select('id, home_score, away_score, status')
          .eq('status', 'FINISHED');

        if (fixturesError) {
          console.error(`❌ Error fetching fixtures for user ${user.user_id}:`, fixturesError);
          continue;
        }

        for (const fixture of finishedFixtures) {
          const prediction = fixturePredictions[fixture.id.toString()] || fixturePredictions[fixture.id];
          
          if (prediction) {
            const predictedScore = `${prediction.home_score}-${prediction.away_score}`;
            const actualScore = `${fixture.home_score}-${fixture.away_score}`;
            
            // Check if exact prediction
            if (predictedScore === actualScore) {
              totalPoints += 3;
              exactPredictions++;
            } else {
              // Check if result prediction
              const predictedResult = prediction.home_score > prediction.away_score ? 'home' : 
                                    prediction.home_score < prediction.away_score ? 'away' : 'draw';
              const actualResult = fixture.home_score > fixture.away_score ? 'home' : 
                                 fixture.home_score < fixture.away_score ? 'away' : 'draw';
              
              if (predictedResult === actualResult) {
                totalPoints += 1;
                resultPredictions++;
              }
            }
          }
        }
      }

      // Calculate table points (simplified - you might want to implement this based on your table prediction logic)
      let tablePoints = 0;
      if (user.table_prediction) {
        // This is a placeholder - implement your table prediction scoring logic here
        tablePoints = 0;
      }

      const finalTotalPoints = totalPoints + tablePoints;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          fixture_points: totalPoints,
          table_points: tablePoints,
          total_points: finalTotalPoints,
          exact_predictions: exactPredictions,
          result_predictions: resultPredictions
        })
        .eq('user_id', user.user_id);

      if (updateError) {
        console.error(`❌ Error updating user ${user.user_id}:`, updateError);
      } else {
        console.log(`✅ Updated user ${user.user_id}: ${totalPoints} fixture points, ${tablePoints} table points, ${finalTotalPoints} total`);
      }
    }

    console.log('✅ User scores recalculation completed');
    return { success: true, message: 'User scores recalculated successfully' };

  } catch (error) {
    console.error('❌ Error recalculating user scores:', error);
    return { success: false, error: error.message };
  }
}

// Main cron function
async function runCronJob() {
  const startTime = Date.now();
  console.log('🔄 Cron job started at:', new Date().toISOString());

  try {
    // Check environment variables
    if (!supabaseUrl) {
      throw new Error('SUPABASE_URL environment variable is not set');
    }
    if (!supabaseKey) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY environment variable is not set');
    }

    console.log('✅ Environment variables validated');

    // Step 1: Fetch and store fixtures
    console.log('⚽ Step 1 - Fetching and storing fixtures...');
    const fixturesData = await fetchFixturesFromAPI('2025');
    const fixturesStored = await storeFixtures(fixturesData, '2025');
    console.log(`✅ Stored ${fixturesStored} fixtures`);

    // Step 2: Fetch and store standings
    console.log('📊 Step 2 - Fetching and storing standings...');
    const standingsData = await fetchStandingsFromAPI('2025');
    const standingsStored = await storeStandings(standingsData, '2025');
    console.log(`✅ Stored ${standingsStored} standings`);

    // Step 3: Calculate prediction percentages
    console.log('📊 Step 3 - Calculating prediction percentages...');
    const percentagesResult = await calculatePredictionPercentages();
    console.log('✅ Prediction percentages calculation result:', percentagesResult);

    // Step 4: Recalculate user scores
    console.log('🧮 Step 4 - Recalculating user scores...');
    const scoresResult = await recalculateUserScores();
    console.log('✅ User scores recalculation result:', scoresResult);

    const duration = Date.now() - startTime;
    console.log(`🎉 Cron job completed successfully in ${duration}ms`);

    return {
      success: true,
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results: {
        fixtures: { stored: fixturesStored, total: fixturesData.length },
        standings: { stored: standingsStored, total: standingsData.length },
        percentages: percentagesResult,
        scores: scoresResult
      }
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Cron job failed after ${duration}ms:`, error);
    
    return {
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    };
  }
}

// Run the cron job
if (require.main === module) {
  runCronJob()
    .then(result => {
      console.log('Final result:', JSON.stringify(result, null, 2));
      process.exit(result.success ? 0 : 1);
    })
    .catch(error => {
      console.error('Unhandled error:', error);
      process.exit(1);
    });
}

module.exports = { runCronJob };
