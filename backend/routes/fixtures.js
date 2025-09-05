const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ";
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
      home_score: match.score?.fullTime?.home || null,
      away_score: match.score?.fullTime?.away || null,
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

    res.json({
      success: true,
      fixtures,
      count: fixtures.length,
      matchday: parseInt(matchday),
      season
    });
  } catch (error) {
    console.error('Error fetching matchday fixtures:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
