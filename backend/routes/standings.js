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
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
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

    res.json({
      success: true,
      standingsData: standings,
      lastUpdated: standings.length > 0 ? standings[0].last_updated : null,
      count: standings.length,
      season
    });
  } catch (error) {
    console.error('Error fetching standings:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/standings/refresh - Refresh standings from API
router.post('/refresh', async (req, res) => {
  const startTime = Date.now();
  try {
    const season = '2025'; // Hardcoded season
    
    console.log(`🔄 [${new Date().toISOString()}] API Request: Fetching standings for season ${season}...`);
    const standingsData = await fetchStandingsFromAPI(season);
    
    console.log(`📊 [${new Date().toISOString()}] API Response: Received ${standingsData.standings[0].table.length} teams from football-data.org`);
    const storedCount = await storeStandings(standingsData, season);
    
    const duration = Date.now() - startTime;
    console.log(`✅ [${new Date().toISOString()}] Success: Refreshed ${storedCount} standings in ${duration}ms`);
    
    res.json({
      success: true,
      message: `Successfully refreshed ${storedCount} standings for season ${season}`,
      count: storedCount,
      lastUpdated: new Date().toISOString(),
      duration: `${duration}ms`
    });
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`❌ [${new Date().toISOString()}] Error: Failed to refresh standings after ${duration}ms:`, error.message);
    res.status(500).json({
      success: false,
      error: error.message,
      duration: `${duration}ms`
    });
  }
});

module.exports = router;
