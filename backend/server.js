const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import routes
const fixturesRoutes = require('./routes/fixtures');
const predictionsRoutes = require('./routes/predictions_simple');
const standingsRoutes = require('./routes/standings');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL || "https://nopucomnlyvogmfdldaw.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5vcHVjb21ubHl2b2dtZmRsZGF3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY5NzYzNDYsImV4cCI6MjA3MjU1MjM0Nn0.mUjCaE0knZ5KzaM1bdVX3a16u3PUXl7w0gkZfMnaVlQ";


const supabase = createClient(supabaseUrl, supabaseKey);

// Map football-data TLAs to our local team ids
const TLA_TO_ID = {
  ARS: 'arsenal',
  AVL: 'aston-villa', 
  BOU: 'bournemouth',
  BRE: 'brentford',
  BHA: 'brighton',
  BUR: 'burnley',
  CHE: 'chelsea',
  CRY: 'crystal-palace',
  EVE: 'everton',
  FUL: 'fulham',
  LEE: 'leeds-united',
  LIV: 'liverpool',
  MCI: 'man-city',
  MUN: 'man-united',
  NEW: 'newcastle',
  NOT: 'nottingham',
  SUN: 'sunderland',
  TOT: 'tottenham',
  WHU: 'west-ham',
  WOL: 'wolves',
};

// Mock standings function
function getMockStandings() {
  // Fallback mock data - current season standings
  const mockStandings = [
    { id: 'arsenal', position: 1, name: 'Arsenal FC', played: 20, wins: 15, draws: 3, losses: 2, goalsFor: 45, goalsAgainst: 20, goalDifference: 25, points: 48 },
    { id: 'man-city', position: 2, name: 'Manchester City', played: 20, wins: 14, draws: 4, losses: 2, goalsFor: 50, goalsAgainst: 22, goalDifference: 28, points: 46 },
    { id: 'liverpool', position: 3, name: 'Liverpool FC', played: 20, wins: 13, draws: 5, losses: 2, goalsFor: 42, goalsAgainst: 18, goalDifference: 24, points: 44 },
    { id: 'aston-villa', position: 4, name: 'Aston Villa', played: 20, wins: 12, draws: 4, losses: 4, goalsFor: 38, goalsAgainst: 25, goalDifference: 13, points: 40 },
    { id: 'tottenham', position: 5, name: 'Tottenham Hotspur', played: 20, wins: 11, draws: 5, losses: 4, goalsFor: 40, goalsAgainst: 28, goalDifference: 12, points: 38 },
    { id: 'man-united', position: 6, name: 'Manchester United', played: 20, wins: 10, draws: 6, losses: 4, goalsFor: 32, goalsAgainst: 26, goalDifference: 6, points: 36 },
    { id: 'west-ham', position: 7, name: 'West Ham United', played: 20, wins: 10, draws: 5, losses: 5, goalsFor: 35, goalsAgainst: 30, goalDifference: 5, points: 35 },
    { id: 'newcastle', position: 8, name: 'Newcastle United', played: 20, wins: 9, draws: 7, losses: 4, goalsFor: 33, goalsAgainst: 28, goalDifference: 5, points: 34 },
    { id: 'chelsea', position: 9, name: 'Chelsea FC', played: 20, wins: 9, draws: 6, losses: 5, goalsFor: 31, goalsAgainst: 25, goalDifference: 6, points: 33 },
    { id: 'brighton', position: 10, name: 'Brighton & Hove Albion', played: 20, wins: 8, draws: 8, losses: 4, goalsFor: 30, goalsAgainst: 25, goalDifference: 5, points: 32 },
    { id: 'crystal-palace', position: 11, name: 'Crystal Palace', played: 20, wins: 8, draws: 6, losses: 6, goalsFor: 28, goalsAgainst: 27, goalDifference: 1, points: 30 },
    { id: 'wolves', position: 12, name: 'Wolverhampton Wanderers', played: 20, wins: 7, draws: 8, losses: 5, goalsFor: 26, goalsAgainst: 26, goalDifference: 0, points: 29 },
    { id: 'fulham', position: 13, name: 'Fulham FC', played: 20, wins: 7, draws: 7, losses: 6, goalsFor: 27, goalsAgainst: 28, goalDifference: -1, points: 28 },
    { id: 'brentford', position: 14, name: 'Brentford FC', played: 20, wins: 6, draws: 9, losses: 5, goalsFor: 25, goalsAgainst: 26, goalDifference: -1, points: 27 },
    { id: 'everton', position: 15, name: 'Everton FC', played: 20, wins: 6, draws: 8, losses: 6, goalsFor: 22, goalsAgainst: 25, goalDifference: -3, points: 26 },
    { id: 'nottingham', position: 16, name: 'Nottingham Forest', played: 20, wins: 5, draws: 9, losses: 6, goalsFor: 21, goalsAgainst: 26, goalDifference: -5, points: 24 },
    { id: 'luton-town', position: 17, name: 'Luton Town', played: 20, wins: 4, draws: 8, losses: 8, goalsFor: 20, goalsAgainst: 32, goalDifference: -12, points: 20 },
    { id: 'burnley', position: 18, name: 'Burnley FC', played: 20, wins: 3, draws: 7, losses: 10, goalsFor: 18, goalsAgainst: 35, goalDifference: -17, points: 16 },
    { id: 'sheffield-united', position: 19, name: 'Sheffield United', played: 20, wins: 2, draws: 5, losses: 13, goalsFor: 15, goalsAgainst: 45, goalDifference: -30, points: 11 },
    { id: 'bournemouth', position: 20, name: 'AFC Bournemouth', played: 20, wins: 1, draws: 4, losses: 15, goalsFor: 12, goalsAgainst: 48, goalDifference: -36, points: 7 }
  ];

  const positionsById = {};
  mockStandings.forEach(team => {
    positionsById[team.id] = team.position;
  });

  return {
    source: 'fallback-mock',
    fetchedAt: new Date().toISOString(),
    lastUpdated: new Date().toISOString(),
    positionsById,
    standingsData: mockStandings,
    count: mockStandings.length,
  };
}

// Routes
app.use('/api/fixtures', fixturesRoutes);
app.use('/api/predictions', predictionsRoutes);
// app.use('/api/standings', standingsRoutes); // Commented out to use direct endpoint below

app.get('/api/standings', async (req, res) => {
  try {
    const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
    if (!API_KEY) {
      console.log('No API key found, using fallback mock data');
      return res.json(getMockStandings());
    }

    const apiRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings?season=2025', {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!apiRes.ok) {
      console.log(`API request failed with status ${apiRes.status}, falling back to mock data`);
      return res.json(getMockStandings());
    }

    const payload = await apiRes.json();
    const standings = Array.isArray(payload?.standings) ? payload.standings : [];
    const totalTable = standings.find((s) => s?.type === 'TOTAL' && Array.isArray(s?.table));
    const table = totalTable?.table || [];

    const positionsById = {};
    const standingsData = [];

    for (const entry of table) {
      const tla = entry?.team?.tla;
      const position = entry?.position;
      const name = entry?.team?.name;
      const played = entry?.playedGames;
      const wins = entry?.won;
      const draws = entry?.draw;
      const losses = entry?.lost;
      const goalsFor = entry?.goalsFor;
      const goalsAgainst = entry?.goalsAgainst;
      const goalDifference = entry?.goalDifference;
      const points = entry?.points;

      console.log(`Processing team: ${name} (${tla}) at position ${position}`);
      
      if (!tla || !position || !name) continue;
      const id = TLA_TO_ID[tla];
      if (id) {
        positionsById[id] = position;
        standingsData.push({
          id,
          position,
          name,
          played: played || 0,
          wins: wins || 0,
          draws: draws || 0,
          losses: losses || 0,
          goalsFor: goalsFor || 0,
          goalsAgainst: goalsAgainst || 0,
          goalDifference: goalDifference || 0,
          points: points || 0,
        });
      } else {
        console.log(`Unknown team TLA: ${tla} for team ${name} - skipping`);
      }
    }

    console.log(`Processed ${Object.keys(positionsById).length} teams out of ${table.length} total entries`);

    // Check if all teams are at position 1 (season hasn't started)
    const uniquePositions = [...new Set(Object.values(positionsById))];
    if (uniquePositions.length === 1 && uniquePositions[0] === 1) {
      console.log('All teams at position 1, randomizing order for testing...');
      
      // Create random positions 1-20
      const teamIds = Object.keys(positionsById);
      const randomPositions = Array.from({length: teamIds.length}, (_, i) => i + 1);
      
      // Shuffle the positions
      for (let i = randomPositions.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [randomPositions[i], randomPositions[j]] = [randomPositions[j], randomPositions[i]];
      }
      
      // Assign random positions
      teamIds.forEach((teamId, index) => {
        positionsById[teamId] = randomPositions[index];
      });
      
      // Update standings data with random positions
      standingsData.forEach((team, index) => {
        team.position = positionsById[team.id];
      });
      
      // Sort by position for display
      standingsData.sort((a, b) => a.position - b.position);
    }

    res.json({
      source: 'football-data',
      fetchedAt: new Date().toISOString(),
      lastUpdated: payload?.competition?.lastUpdated || new Date().toISOString(),
      positionsById,
      standingsData,
      count: Object.keys(positionsById).length,
    });
  } catch (error) {
    console.log('API failed, using fallback mock data:', error.message);
    res.json(getMockStandings());
  }
});

// Refresh standings endpoint
app.post('/api/standings/refresh', async (req, res) => {
  try {
    const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
    if (!API_KEY) {
      return res.status(400).json({ error: 'No API key found' });
    }

    const apiRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings?season=2025', {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!apiRes.ok) {
      return res.status(apiRes.status).json({ error: `API request failed with status ${apiRes.status}` });
    }

    const payload = await apiRes.json();
    const standings = Array.isArray(payload?.standings) ? payload.standings : [];
    const totalTable = standings.find((s) => s?.type === 'TOTAL' && Array.isArray(s?.table));
    const table = totalTable?.table || [];

    // Clear existing standings
    await supabase.from('standings').delete().eq('season', '2025');

    // Insert new standings
    const standingsToInsert = [];
    for (const entry of table) {
      const tla = entry?.team?.tla;
      const position = entry?.position;
      const name = entry?.team?.name;
      const played = entry?.playedGames;
      const wins = entry?.won;
      const draws = entry?.draw;
      const losses = entry?.lost;
      const goalsFor = entry?.goalsFor;
      const goalsAgainst = entry?.goalsAgainst;
      const goalDifference = entry?.goalDifference;
      const points = entry?.points;

      if (!tla || !position || !name) continue;
      const id = TLA_TO_ID[tla];
      if (id) {
        standingsToInsert.push({
          season: '2025',
          team_id: id,
          position,
          team_name: name,
          played: played || 0,
          wins: wins || 0,
          draws: draws || 0,
          losses: losses || 0,
          goals_for: goalsFor || 0,
          goals_against: goalsAgainst || 0,
          goal_difference: goalDifference || 0,
          points: points || 0,
          last_updated: new Date().toISOString()
        });
      }
    }

    if (standingsToInsert.length > 0) {
      const { error } = await supabase.from('standings').insert(standingsToInsert);
      if (error) {
        console.error('Error inserting standings:', error);
        return res.status(500).json({ error: 'Database error' });
      }
    }


    res.json({
      success: true,
      count: standingsToInsert.length,
      message: 'Standings refreshed successfully'
    });
  } catch (error) {
    console.error('Error refreshing standings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users/create-profile - Create user profile with default prediction
app.post('/api/users/create-profile', async (req, res) => {
  try {
    const { user_id, email, display_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ 
        success: false, 
        error: 'user_id is required' 
      });
    }

    // Create user profile with default prediction
    const { data, error } = await supabase
      .from('user_profiles')
      .insert({
        user_id: user_id,
        email: email || null,
        display_name: display_name || email || 'User',
        table_prediction: [
          'arsenal', 'aston-villa', 'bournemouth', 'brentford', 'brighton',
          'burnley', 'chelsea', 'crystal-palace', 'everton', 'fulham',
          'leeds-united', 'liverpool', 'man-city', 'man-united', 'newcastle',
          'nottingham', 'sunderland', 'tottenham', 'west-ham', 'wolves'
        ],
        fixture_points: 0,
        table_points: 20, // Default 20 points for table prediction
        total_points: 20,
        fixture_predictions: {}
      })
      .select();

    if (error) {
      console.error('Error creating user profile:', error);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to create user profile' 
      });
    }

    res.json({ 
      success: true, 
      message: 'User profile created with default prediction',
      profile: data[0]
    });
  } catch (error) {
    console.error('Error in create profile endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// GET /api/users/prediction-lock-status - Check if predictions are locked for user
app.get('/api/users/prediction-lock-status/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params;

    // Check if predictions are locked
    const { data: lockData, error: lockError } = await supabase
      .rpc('are_predictions_locked', { user_id_param: user_id });

    if (lockError) {
      console.error('Error checking prediction lock:', lockError);
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to check prediction lock status' 
      });
    }

    // Get lock date
    const { data: lockDate, error: dateError } = await supabase
      .rpc('get_user_prediction_lock_date', { user_id_param: user_id });

    if (dateError) {
      console.error('Error getting lock date:', dateError);
    }

    res.json({ 
      success: true, 
      locked: lockData,
      lock_date: lockDate,
      current_time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in lock status endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// POST /api/users/recalculate-scores - Recalculate all user scores
app.post('/api/users/recalculate-scores', async (req, res) => {
  try {
    // Get all user profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('user_profiles')
      .select('user_id, table_prediction');

    if (profilesError) {
      throw new Error(`Database error: ${profilesError.message}`);
    }

    let updatedCount = 0;
    
    // Recalculate scores for each user
    for (const profile of profiles) {
      const { error: updateError } = await supabase
        .rpc('update_user_scores', { user_id_param: profile.user_id });

      if (!updateError) {
        updatedCount++;
      } else {
        console.error(`Error updating scores for user ${profile.user_id}:`, updateError);
      }
    }

    res.json({
      success: true,
      message: `Recalculated scores for ${updatedCount} users`,
      updated_count: updatedCount,
      total_users: profiles.length
    });
  } catch (error) {
    console.error('Error recalculating scores:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
