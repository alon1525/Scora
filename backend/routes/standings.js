const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();
const { checkAchievements } = require('../utils/achievementChecker');

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
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
  
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ API Error ${response.status}: ${errorText}`);
    console.error(`❌ Full response headers:`, Object.fromEntries(response.headers.entries()));
    throw new Error(`API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return await response.json();
}

// Store standings in database
async function storeStandings(standingsData, season = '2025') {
  const standings = [];
  
  for (const table of standingsData.standings) {
    if (table.type === 'TOTAL') {
      for (const team of table.table) {
        const teamId = TEAM_NAME_TO_ID[team.team.name];
        
        if (teamId) {
          standings.push({
            season,
            team_id: teamId,
            position: team.position,
            team_name: team.team.name,
            played: team.playedGames,
            wins: team.won,
            draws: team.draw,
            losses: team.lost,
            goals_for: team.goalsFor,
            goals_against: team.goalsAgainst,
            goal_difference: team.goalDifference,
            points: team.points,
            last_updated: new Date().toISOString()
          });
        }
      }
    }
  }

  if (standings.length === 0) {
    throw new Error('No standings data to store');
  }

  // Clear existing standings for this season
  const { error: deleteError } = await supabase
    .from('standings')
    .delete()
    .eq('season', season);

  if (deleteError) {
    throw new Error(`Database error clearing standings: ${deleteError.message}`);
  }

  // Insert new standings
  const { error: insertError } = await supabase
    .from('standings')
    .insert(standings);

  if (insertError) {
    throw new Error(`Database error storing standings: ${insertError.message}`);
  }

  return standings.length;
}

// GET /api/standings - Get cached standings
router.get('/', async (req, res) => {
  try {
    const season = '2025'; // Hardcoded season
    
    const { data: standings, error } = await supabase
      .from('standings')
      .select('*')
      .eq('season', season)
      .order('position', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Calculate current matchday from lowest "played" value
    let currentMatchday = 1;
    if (standings.length > 0) {
      let min = Math.min(...standings.map(team => team.played || 0));
      currentMatchday = min+1;

    }

    res.json({
      success: true,
      standingsData: standings,
      lastUpdated: standings.length > 0 ? standings[0].last_updated : null,
      count: standings.length,
      season,
      currentMatchday
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/standings/refresh - Refresh standings from API (manual)
// GET /api/standings/refresh - Refresh standings from API (cron)
router.post('/refresh', async (req, res) => {
  await handleStandingsRefresh(req, res, 'manual');
});

router.get('/refresh', async (req, res) => {
  await handleStandingsRefresh(req, res, 'cron');
});

// Test endpoint to verify cron function is accessible
router.get('/test-cron', async (req, res) => {
  res.json({
    success: true,
    message: 'Cron function is accessible',
    timestamp: new Date().toISOString(),
    environment: {
      hasApiKey: !!process.env.LEAGUE_STANDINGS_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_API_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    }
  });
});

// Bulk predictions endpoint for efficient loading
router.get('/bulk-predictions', async (req, res) => {
  try {
    const { week } = req.query;
    if (!week) {
      return res.status(400).json({
        success: false,
        error: 'Week parameter is required'
      });
    }

    const currentWeek = parseInt(week);
    const weeks = [currentWeek - 1, currentWeek, currentWeek + 1].filter(w => w > 0 && w <= 38);

    // Get all fixtures for the requested weeks
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, matchday, home_team_name, away_team_name, status')
      .in('matchday', weeks)
      .order('matchday', { ascending: true });

    if (fixturesError) {
      throw new Error(`Failed to fetch fixtures: ${fixturesError.message}`);
    }

    // Get all user predictions for these fixtures
    const fixtureIds = fixtures.map(f => f.id);
    const { data: predictions, error: predictionsError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, fixture_predictions')
      .not('fixture_predictions', 'is', null);

    if (predictionsError) {
      throw new Error(`Failed to fetch predictions: ${predictionsError.message}`);
    }

    // Organize predictions by fixture
    const predictionsByFixture = {};
    
    for (const fixture of fixtures) {
      predictionsByFixture[fixture.id] = [];
      
      for (const user of predictions) {
        const userPredictions = user.fixture_predictions || {};
        const prediction = userPredictions[fixture.id.toString()] || userPredictions[fixture.id];
        
        if (prediction && prediction.home_score !== null && prediction.away_score !== null) {
          predictionsByFixture[fixture.id].push({
            user_id: user.user_id,
            display_name: user.display_name,
            home_score: prediction.home_score,
            away_score: prediction.away_score
          });
        }
      }
    }

    res.json({
      success: true,
      data: {
        fixtures: fixtures.map(f => ({
          id: f.id,
          matchday: f.matchday,
          home_team_name: f.home_team_name,
          away_team_name: f.away_team_name,
          status: f.status,
          predictions: predictionsByFixture[f.id] || []
        })),
        weeks: weeks
      }
    });
  } catch (error) {
    console.error('Error in bulk predictions:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to check database state
router.get('/test-db-state', async (req, res) => {
  try {
    // Check fixtures
    const { data: allFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, status, calculated, home_score, away_score, updated_at')
      .order('id', { ascending: true });

    const finishedFixtures = allFixtures?.filter(f => f.status === 'FINISHED') || [];
    const uncalculatedFinished = finishedFixtures.filter(f => f.calculated === false);

    // Check standings
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('team_id, position, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5);

    // Check users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, fixture_points, table_points, total_points, exacts, results, updated_at')
      .order('updated_at', { ascending: false })
      .limit(3);

    res.json({
      success: true,
      fixtures: {
        total: allFixtures?.length || 0,
        finished: finishedFixtures.length,
        uncalculated_finished: uncalculatedFinished.length,
        sample_finished: finishedFixtures.slice(0, 5),
        sample_uncalculated: uncalculatedFinished.slice(0, 5),
        last_updated: allFixtures?.[0]?.updated_at
      },
      standings: {
        count: standings?.length || 0,
        last_updated: standings?.[0]?.updated_at,
        sample: standings?.slice(0, 3)
      },
      users: {
        total: users?.length || 0,
        last_updated: users?.[0]?.updated_at,
        sample: users?.slice(0, 3).map(u => ({
          user_id: u.user_id,
          display_name: u.display_name,
          fixture_points: u.fixture_points,
          table_points: u.table_points,
          total_points: u.total_points,
          exacts: u.exacts,
          results: u.results,
          updated_at: u.updated_at
        })) || []
      },
      errors: {
        fixtures: fixturesError?.message,
        standings: standingsError?.message,
        users: usersError?.message
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/standings/test-recalculate - Test endpoint to recalculate ALL user scores
router.get('/test-recalculate', async (req, res) => {
  try {
    
    // Get all users
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, fixture_predictions, table_prediction');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }


    // Get all finished fixtures (including already calculated ones)
    const { data: finishedFixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_score, away_score, status')
      .eq('status', 'FINISHED');

    if (fixturesError) {
      throw new Error(`Failed to fetch fixtures: ${fixturesError.message}`);
    }

    // Get current standings for table points calculation
    const { data: standings, error: standingsError } = await supabase
      .from('standings')
      .select('team_id, position')
      .eq('season', '2025')
      .order('position', { ascending: true });

    // Create lookup for team positions
    const standingsLookup = {};
    if (standings) {
      standings.forEach(standing => {
        standingsLookup[standing.team_id] = standing.position;
      });
    }

    let totalUpdated = 0;
    let totalExact = 0;
    let totalResult = 0;
    let totalTablePoints = 0;

    // Process each user
    for (const user of users) {
      
      let userExact = 0;
      let userResult = 0;
      let userFixturePoints = 0;
      let userTablePoints = 0;

      // Calculate table points
      if (user.table_prediction && Array.isArray(user.table_prediction)) {
        for (let i = 0; i < user.table_prediction.length; i++) {
          const predictedTeam = user.table_prediction[i];
          const actualPosition = standingsLookup[predictedTeam];
          
          if (actualPosition !== undefined) {
            const positionDiff = Math.abs((i + 1) - actualPosition);
            const teamPoints = Math.max(0, 20 - positionDiff);
            userTablePoints += teamPoints;
          }
        }
      }

      if (user.fixture_predictions) {
        // Process each finished fixture
        for (const fixture of finishedFixtures) {
          const prediction = user.fixture_predictions[fixture.id.toString()] || user.fixture_predictions[fixture.id];
          
          if (prediction) {
            const predictedScore = `${prediction.home_score}-${prediction.away_score}`;
            const actualScore = `${fixture.home_score}-${fixture.away_score}`;
            
            // Check if exact prediction
            if (predictedScore === actualScore) {
              userExact++;
              userFixturePoints += 3;
            } else {
              // Check if result prediction
              const predictedResult = prediction.home_score > prediction.away_score ? 'home' : 
                                    prediction.home_score < prediction.away_score ? 'away' : 'draw';
              const actualResult = fixture.home_score > fixture.away_score ? 'home' : 
                                 fixture.home_score < fixture.away_score ? 'away' : 'draw';
              
              if (predictedResult === actualResult) {
                userResult++;
                userFixturePoints += 1;
              }
            }
          }
        }
      }

      // Calculate total points
      const userTotalPoints = userFixturePoints + userTablePoints;

      // Update user profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          exact_predictions: userExact,
          result_predictions: userResult,
          fixture_points: userFixturePoints,
          table_points: userTablePoints,
          total_points: userTotalPoints,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.user_id);

      if (updateError) {
        console.error(`❌ [TEST] Error updating ${user.display_name}:`, updateError);
      } else {
        // Check for new achievements
        try {
          await checkAchievements(user.user_id);
        } catch (achievementError) {
          console.error(`Error checking achievements for ${user.display_name}:`, achievementError);
        }
        
        totalUpdated++;
        totalExact += userExact;
        totalResult += userResult;
        totalTablePoints += userTablePoints;
      }
    }

    console.log(`Recalculation completed! Updated ${totalUpdated} users`);

    res.json({
      success: true,
      message: 'Test recalculation completed successfully',
      stats: {
        usersUpdated: totalUpdated,
        totalExactPredictions: totalExact,
        totalResultPredictions: totalResult,
        totalTablePoints: totalTablePoints,
        fixturesProcessed: finishedFixtures.length
      }
    });

  } catch (error) {
    console.error('❌ [TEST] Error in test recalculation:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Shared function to handle standings refresh
async function handleStandingsRefresh(req, res, trigger = 'manual') {
  const startTime = Date.now();
  try {
    const season = '2025'; // Hardcoded season
    
    
    // Step 1: Refresh fixtures first (get latest match results)
    const fixturesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fixtures/refresh`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const fixturesResult = await fixturesResponse.json();
    
    // Step 2: Refresh standings (based on completed matches)
    const standingsData = await fetchStandingsFromAPI(season);
    const storedCount = await storeStandings(standingsData, season);
    
    // Step 3: Recalculate all user scores (based on updated standings and fixtures)
    
    let scoresResult = { success: false, results: 'No users processed' };
    
    // Create standings lookup for table points calculation
    const standingsLookup = {};
    if (standingsData && standingsData.standings) {
      // Extract the actual standings table from the API response
      const standingsTable = standingsData.standings.find(table => table.type === 'TOTAL');
      if (standingsTable && standingsTable.table) {
        standingsTable.table.forEach((team, index) => {
          const teamId = TEAM_NAME_TO_ID[team.team.name];
          if (teamId) {
            standingsLookup[teamId] = index + 1; // Position is 1-based
          }
        });
      }
    }
    
    // Get all users and recalculate their scores
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, table_prediction, fixture_predictions');

    if (usersError) {
      console.error(`❌ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Error fetching users:`, usersError);
      scoresResult = { success: false, results: `Error fetching users: ${usersError.message}` };
    } else {
      let successCount = 0;
      for (const user of users) {
        try {
          // Calculate table points
          let tablePoints = 0;
          const prediction = user.table_prediction || [];
          
          for (let i = 0; i < prediction.length; i++) {
            const predictedTeam = prediction[i];
            const actualPosition = standingsLookup[predictedTeam];
            
            if (actualPosition !== undefined) {
              const positionDiff = Math.abs((i + 1) - actualPosition);
              const teamPoints = Math.max(0, 20 - positionDiff);
              tablePoints += teamPoints;
            }
          }
          

          // Get existing fixture points, exacts, and results
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('fixture_points, exacts, results')
            .eq('user_id', user.user_id)
            .single();

          const existingFixturePoints = profile?.fixture_points || 0;
          const existingExacts = profile?.exacts || 0;
          const existingResults = profile?.results || 0;
          
          // Calculate new points from uncalculated finished fixtures
          let newFixturePoints = 0;
          let newExacts = 0;
          let newResults = 0;
          const { data: finishedFixtures, error: fixturesError } = await supabase
            .from('fixtures')
            .select('id, home_score, away_score')
            .eq('status', 'FINISHED')
            .eq('calculated', false);

          if (!fixturesError && finishedFixtures) {
            const fixturePredictions = user.fixture_predictions || {};
            
            for (const fixture of finishedFixtures) {
              const prediction = fixturePredictions[fixture.id.toString()] || fixturePredictions[fixture.id];
              
              if (prediction && prediction.home_score !== null && prediction.away_score !== null) {
                const predictedHome = parseInt(prediction.home_score);
                const predictedAway = parseInt(prediction.away_score);
                const actualHome = parseInt(fixture.home_score);
                const actualAway = parseInt(fixture.away_score);

                if (!isNaN(predictedHome) && !isNaN(predictedAway) && !isNaN(actualHome) && !isNaN(actualAway)) {
                  // Check for exact match (3 points)
                  if (predictedHome === actualHome && predictedAway === actualAway) {
                    newFixturePoints += 3;
                    newExacts += 1;
                  } else {
                    // Check for result match (1 point)
                    const predictedResult = predictedHome > predictedAway ? 'home' : (predictedHome < predictedAway ? 'away' : 'draw');
                    const actualResult = actualHome > actualAway ? 'home' : (actualHome < actualAway ? 'away' : 'draw');
                    
                    if (predictedResult === actualResult) {
                      newFixturePoints += 1;
                      newResults += 1;
                    }
                  }
                }
              }
            }
          }
          
          const totalFixturePoints = existingFixturePoints + newFixturePoints;
          const totalExacts = existingExacts + newExacts;
          const totalResults = existingResults + newResults;
          const totalPoints = totalFixturePoints + tablePoints;

          // Update user profile
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({
              fixture_points: totalFixturePoints,
              table_points: tablePoints,
              total_points: totalPoints,
              exacts: totalExacts,
              results: totalResults,
              updated_at: new Date().toISOString()
            })
            .eq('user_id', user.user_id);

          if (!updateError) {
            successCount++;
          } else {
            console.error(`Failed to update user ${user.user_id}:`, updateError);
          }
        } catch (error) {
          console.error(`❌ Error processing user ${user.user_id}:`, error);
        }
      }
      console.log(`Updated scores for ${successCount} users`);
      
      // Mark all processed fixtures as calculated after all users are processed
      const { data: finishedFixtures, error: fixturesError } = await supabase
        .from('fixtures')
        .select('id')
        .eq('status', 'FINISHED')
        .eq('calculated', false);

      if (!fixturesError && finishedFixtures && finishedFixtures.length > 0) {
        const fixtureIds = finishedFixtures.map(f => f.id);
        await supabase
          .from('fixtures')
          .update({ calculated: true })
          .in('id', fixtureIds);
      }
      
      // Update scoresResult with the actual results
      scoresResult = { 
        success: true, 
        results: `Updated scores for ${successCount} users, marked ${finishedFixtures?.length || 0} fixtures as calculated` 
      };
    }
    
    const duration = Date.now() - startTime;
    console.log(`Complete refresh finished in ${duration}ms`);
    
    res.json({
      success: true,
      message: `Complete refresh successful - Standings: ${storedCount} teams, Fixtures: ${fixturesResult.success ? 'Updated' : 'Failed'}, Scores: ${scoresResult.success ? 'Recalculated' : 'Failed'}`,
      details: {
        standings: {
          count: storedCount,
          success: true
        },
        fixtures: {
          success: fixturesResult.success,
          message: fixturesResult.message || 'Unknown'
        },
        scores: {
          success: scoresResult.success,
          results: scoresResult.results || 'Unknown'
        }
      },
      lastUpdated: new Date().toISOString(),
      duration: `${duration}ms`,
      triggeredBy: trigger
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Failed complete refresh after ${duration}ms:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`,
      triggeredBy: trigger
    });
  }
};

module.exports = router;
