const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

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
  
  console.log(`🔍 Fetching standings from: ${url}`);
  console.log(`🔑 API Key present: ${!!API_KEY}, length: ${API_KEY ? API_KEY.length : 0}`);
  console.log(`🔑 API Key starts with: ${API_KEY ? API_KEY.substring(0, 8) + '...' : 'undefined'}`);
  
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
        } else {
          console.log(`Skipping team: ${team.team.name} - not found in mapping`);
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

// Shared function to handle standings refresh
async function handleStandingsRefresh(req, res, trigger = 'manual') {
  const startTime = Date.now();
  try {
    const season = '2025'; // Hardcoded season
    
    console.log(`🔄 [${new Date().toISOString()}] ${trigger.toUpperCase()}: Starting complete refresh (standings + fixtures + scores)...`);
    console.log(`🔍 ${trigger.toUpperCase()} Environment check:`, {
      hasApiKey: !!process.env.LEAGUE_STANDINGS_API_KEY,
      hasSupabaseUrl: !!process.env.SUPABASE_API_URL,
      hasSupabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY
    });
    
    // Step 1: Refresh fixtures first (get latest match results)
    console.log(`⚽ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Step 1 - Refreshing fixtures...`);
    const fixturesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/fixtures/refresh`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const fixturesResult = await fixturesResponse.json();
    console.log(`✅ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Fixtures refresh result:`, fixturesResult.success ? 'Success' : 'Failed');
    
    // Step 2: Refresh standings (based on completed matches)
    console.log(`📊 [${new Date().toISOString()}] ${trigger.toUpperCase()}: Step 2 - Fetching standings...`);
    const standingsData = await fetchStandingsFromAPI(season);
    const storedCount = await storeStandings(standingsData, season);
    console.log(`✅ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Refreshed ${storedCount} standings`);
    
    // Step 3: Recalculate all user scores (based on updated standings and fixtures)
    console.log(`🧮 [${new Date().toISOString()}] ${trigger.toUpperCase()}: Step 3 - Recalculating user scores...`);
    const scoresResponse = await fetch(`${req.protocol}://${req.get('host')}/api/users/recalculate-scores`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    const scoresResult = await scoresResponse.json();
    console.log(`✅ [${new Date().toISOString()}] ${trigger.toUpperCase()}: Scores recalculation result:`, scoresResult.success ? 'Success' : 'Failed');
    
    const duration = Date.now() - startTime;
    console.log(`🎉 [${new Date().toISOString()}] ${trigger.toUpperCase()}: Complete refresh finished in ${duration}ms`);
    
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
