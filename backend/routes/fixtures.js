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

// Fetch fixtures from football-data.org API
async function fetchFixturesFromAPI(season = '2025', status = null, matchday = null) {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  // Build query parameters
  const params = new URLSearchParams();
  params.append('season', season);
  if (status) params.append('status', status);
  if (matchday) params.append('matchday', matchday);

  const url = `https://api.football-data.org/v4/competitions/PL/matches?${params.toString()}`;
  
  const response = await fetch(url, {
    headers: {
      'X-Auth-Token': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  return await response.json();
}

// Store fixtures in database
async function storeFixtures(fixturesData) {
  const fixtures = [];
  const season = '2025'; // Hardcoded season
  
  for (const match of fixturesData.matches) {
    const homeTeamId = TEAM_NAME_TO_ID[match.homeTeam.name];
    const awayTeamId = TEAM_NAME_TO_ID[match.awayTeam.name];
    
    if (!homeTeamId || !awayTeamId) {
      console.log(`Skipping match: ${match.homeTeam.name} vs ${match.awayTeam.name} - team not found in mapping`);
      continue;
    }

    const fixture = {
      external_id: match.id,
      home_team_id: homeTeamId,
      away_team_id: awayTeamId,
      home_team_name: match.homeTeam.name,
      away_team_name: match.awayTeam.name,
      home_team_logo: match.homeTeam.crest,
      away_team_logo: match.awayTeam.crest,
      matchday: match.matchday,
      season: season,
      status: match.status,
      scheduled_date: match.utcDate,
      home_score: match.score?.fullTime?.home || 0,
      away_score: match.score?.fullTime?.away || 0,
    };

    fixtures.push(fixture);
  }

  // Upsert fixtures
  const { error } = await supabase
    .from('fixtures')
    .upsert(fixtures, { 
      onConflict: 'external_id',
      ignoreDuplicates: false 
    });

  if (error) {
    throw new Error(`Database error: ${error.message}`);
  }

  return fixtures.length;
}

// GET /api/fixtures - Get all fixtures for 2025 season
router.get('/', async (req, res) => {
  try {
    const { matchday } = req.query;
    const season = '2025'; // Hardcoded season
    
    let query = supabase
      .from('fixtures')
      .select('*')
      .eq('season', season)
      .order('scheduled_date', { ascending: true });

    if (matchday) {
      query = query.eq('matchday', parseInt(matchday));
    }

    const { data: fixtures, error } = await query;

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      fixtures,
      count: fixtures.length,
      season,
      matchday: matchday ? parseInt(matchday) : null
    });
  } catch (error) {
    console.error('Error fetching fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/refresh - Fetch and store fixtures from API
router.get('/refresh', async (req, res) => {
  try {
    const { season = '2025', status = null, matchday = null } = req.query;
    
    console.log(`Fetching fixtures for season ${season}...`);
    const fixturesData = await fetchFixturesFromAPI(season, status, matchday);
    
    console.log(`Storing ${fixturesData.matches.length} fixtures...`);
    const storedCount = await storeFixtures(fixturesData);
    
    res.json({
      success: true,
      message: `Successfully stored ${storedCount} fixtures for season ${season}`,
      total_matches: fixturesData.matches.length,
      stored_count: storedCount
    });
  } catch (error) {
    console.error('Error refreshing fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/upcoming - Get upcoming fixtures (SCHEDULED)
router.get('/upcoming', async (req, res) => {
  try {
    const { season = '2025', matchday } = req.query;
    
    console.log(`Fetching upcoming fixtures for season ${season}...`);
    const fixturesData = await fetchFixturesFromAPI(season, 'SCHEDULED', matchday);
    
    console.log(`Storing ${fixturesData.matches.length} upcoming fixtures...`);
    const storedCount = await storeFixtures(fixturesData);
    
    res.json({
      success: true,
      message: `Successfully stored ${storedCount} upcoming fixtures for season ${season}`,
      total_matches: fixturesData.matches.length,
      stored_count: storedCount
    });
  } catch (error) {
    console.error('Error refreshing upcoming fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/results - Get finished fixtures (FINISHED)
router.get('/results', async (req, res) => {
  try {
    const { season = '2025', matchday } = req.query;
    
    console.log(`Fetching results for season ${season}...`);
    const fixturesData = await fetchFixturesFromAPI(season, 'FINISHED', matchday);
    
    console.log(`Storing ${fixturesData.matches.length} results...`);
    const storedCount = await storeFixtures(fixturesData);
    
    res.json({
      success: true,
      message: `Successfully stored ${storedCount} results for season ${season}`,
      total_matches: fixturesData.matches.length,
      stored_count: storedCount
    });
  } catch (error) {
    console.error('Error refreshing results:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/live - Get live fixtures (IN_PLAY)
router.get('/live', async (req, res) => {
  try {
    const { season = '2025' } = req.query;
    
    console.log(`Fetching live fixtures for season ${season}...`);
    const fixturesData = await fetchFixturesFromAPI(season, 'IN_PLAY');
    
    console.log(`Storing ${fixturesData.matches.length} live fixtures...`);
    const storedCount = await storeFixtures(fixturesData);
    
    res.json({
      success: true,
      message: `Successfully stored ${storedCount} live fixtures for season ${season}`,
      total_matches: fixturesData.matches.length,
      stored_count: storedCount
    });
  } catch (error) {
    console.error('Error refreshing live fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/:id - Get specific fixture
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data: fixture, error } = await supabase
      .from('fixtures')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    if (!fixture) {
      return res.status(404).json({
        success: false,
        error: 'Fixture not found'
      });
    }

    res.json({
      success: true,
      fixture
    });
  } catch (error) {
    console.error('Error fetching fixture:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/fixtures/matchday/:matchday - Get fixtures for specific matchday
router.get('/matchday/:matchday', async (req, res) => {
  try {
    const { matchday } = req.params;
    const season = '2025'; // Hardcoded season
    
    const { data: fixtures, error } = await supabase
      .from('fixtures')
      .select('*')
      .eq('season', season)
      .eq('matchday', parseInt(matchday))
      .order('scheduled_date', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    // Get current matchday from football-data.org API
    let currentMatchday = null;
    try {
      const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
      if (API_KEY) {
        const response = await fetch(`https://api.football-data.org/v4/competitions/PL/matches?season=${season}&matchday=${matchday}`, {
          headers: { 'X-Auth-Token': API_KEY }
        });
        const data = await response.json();
        if (data.matches && data.matches.length > 0) {
          currentMatchday = data.matches[0].season?.currentMatchday;
        }
      }
    } catch (apiError) {
      console.log('Could not fetch current matchday from API:', apiError.message);
    }

    res.json({
      success: true,
      fixtures,
      count: fixtures.length,
      matchday: parseInt(matchday),
      season,
      currentMatchday
    });
  } catch (error) {
    console.error('Error fetching matchday fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Refresh fixtures and recalculate all scores (when games end)
router.post('/refresh-and-recalculate', async (req, res) => {
  try {
    console.log('🔄 Refreshing fixtures and recalculating scores...');
    
    // First, refresh fixtures from API
    const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
    if (!API_KEY) {
      return res.status(500).json({
        success: false,
        error: 'API key not configured'
      });
    }

    // Get current season fixtures
    const response = await fetch('https://api.football-data.org/v4/competitions/PL/matches?season=2025', {
      headers: {
        'X-Auth-Token': API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }

    const data = await response.json();
    const matches = data.matches || [];

    // Update fixtures in database
    let updatedCount = 0;
    for (const match of matches) {
      const homeTeam = match.homeTeam?.shortName?.toLowerCase().replace(/\s+/g, '-');
      const awayTeam = match.awayTeam?.shortName?.toLowerCase().replace(/\s+/g, '-');
      
      if (homeTeam && awayTeam) {
        const { error: upsertError } = await supabase
          .from('fixtures')
          .upsert({
            external_id: match.id,
            home_team_id: homeTeam,
            away_team_id: awayTeam,
            home_team_name: match.homeTeam.name,
            away_team_name: match.awayTeam.name,
            home_team_logo: match.homeTeam.crest,
            away_team_logo: match.awayTeam.crest,
            matchday: match.matchday,
            season: '2025',
            status: match.status,
            scheduled_date: match.utcDate,
            home_score: match.score?.fullTime?.home || 0,
            away_score: match.score?.fullTime?.away || 0,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'external_id'
          });

        if (!upsertError) {
          updatedCount++;
        }
      }
    }

    // Recalculate all user scores
    console.log('🔄 Recalculating all user scores...');
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('*');

    if (!profilesError && profiles) {
      // Get current standings
      const { data: standings, error: standingsError } = await supabase
        .from('standings')
        .select('team_id, position')
        .eq('season', '2025')
        .order('position');

      if (!standingsError && standings) {
        const standingsLookup = {};
        standings.forEach(team => {
          standingsLookup[team.team_id] = team.position;
        });

        // Get finished fixtures for fixture points calculation
        const { data: finishedFixtures, error: fixturesError } = await supabase
          .from('fixtures')
          .select('id, home_score, away_score, status')
          .eq('status', 'FINISHED')
          .not('home_score', 'is', null)
          .not('away_score', 'is', null);

        // Update each user's scores
        for (const profile of profiles) {
          // Calculate table points
          let tablePoints = 0;
          const prediction = profile.table_prediction || [];
          
          for (let i = 0; i < prediction.length; i++) {
            const predictedTeam = prediction[i];
            const actualPosition = standingsLookup[predictedTeam];
            
            if (actualPosition !== undefined) {
              const positionDiff = Math.abs((i + 1) - actualPosition);
              const teamPoints = Math.max(0, 20 - positionDiff);
              tablePoints += teamPoints;
            }
          }

          // Calculate fixture points
          let fixturePoints = 0;
          let exactPredictions = 0;
          let resultPredictions = 0;
          let missPredictions = 0;
          let totalPredictions = 0;

          if (profile.fixture_predictions && finishedFixtures) {
            for (const fixture of finishedFixtures) {
              const prediction = profile.fixture_predictions[fixture.id.toString()];
              if (!prediction || !prediction.home_score || !prediction.away_score) {
                continue;
              }

              // Calculate points
              let points = 0;
              
              // Exact score match = 3 points
              if (prediction.home_score === fixture.home_score && prediction.away_score === fixture.away_score) {
                points = 3;
              }
              // Correct result (win/draw/loss) = 1 point
              else {
                const predictedResult = prediction.home_score > prediction.away_score ? 'home_win' : 
                                       prediction.home_score < prediction.away_score ? 'away_win' : 'draw';
                const actualResult = fixture.home_score > fixture.away_score ? 'home_win' : 
                                     fixture.home_score < fixture.away_score ? 'away_win' : 'draw';
                
                if (predictedResult === actualResult) {
                  points = 1;
                }
              }

              fixturePoints += points;
              totalPredictions++;

              if (points === 3) {
                exactPredictions++;
              } else if (points === 1) {
                resultPredictions++;
              }
            }
          }

          const totalPoints = fixturePoints + tablePoints;

          // Update user profile
          await supabase
            .from('user_profiles')
            .update({
              table_points: tablePoints,
              fixture_points: fixturePoints,
              exact_predictions: exactPredictions,
              result_predictions: resultPredictions,
              total_predictions: totalPredictions,
              total_points: totalPoints,
              updated_at: new Date().toISOString()
            })
            .eq('id', profile.id);
        }
      }
    }

    res.json({
      success: true,
      message: 'Fixtures refreshed and scores recalculated',
      fixtures_updated: updatedCount,
      users_updated: profiles?.length || 0
    });

  } catch (error) {
    console.error('Error refreshing fixtures and recalculating scores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
