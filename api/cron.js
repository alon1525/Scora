const { createClient } = require('@supabase/supabase-js');

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
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
export default async function handler(req, res) {
  // No authorization needed for GitHub Actions

  const startTime = Date.now();
  console.log('🔄 Cron job started at:', new Date().toISOString());

  try {
    const baseUrl = process.env.VERCEL_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null);
    
    if (!baseUrl) {
      throw new Error('No base URL configured. Please set VERCEL_APP_URL or VERCEL_URL environment variable.');
    }

    // Step 1: Refresh fixtures
    console.log('⚽ Step 1 - Refreshing fixtures...');
    const fixturesResponse = await fetch(`${baseUrl}/api/fixtures/refresh`);
    const fixturesResult = await fixturesResponse.json();
    console.log('✅ Fixtures refresh result:', fixturesResult);

    // Step 2: Refresh standings
    console.log('📊 Step 2 - Refreshing standings...');
    const standingsResponse = await fetch(`${baseUrl}/api/standings/refresh`);
    const standingsResult = await standingsResponse.json();
    console.log('✅ Standings refresh result:', standingsResult);

    // Step 3: Recalculate user scores
    console.log('🧮 Step 3 - Recalculating user scores...');
    const scoresResponse = await fetch(`${baseUrl}/api/users/recalculate-scores`);
    const scoresResult = await scoresResponse.json();
    console.log('✅ User scores recalculation result:', scoresResult);

    const duration = Date.now() - startTime;
    console.log(`🎉 Cron job completed successfully in ${duration}ms`);

    res.status(200).json({
      success: true,
      message: 'Cron job completed successfully',
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`,
      results: {
        fixtures: { stored: fixturesStored, total: fixturesData.length },
        standings: { stored: standingsStored, total: standingsData.length },
        scores: scoresResult
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ Cron job failed after ${duration}ms:`, error);
    
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
      duration: `${duration}ms`
    });
  }
};
