const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || `https://${process.env.SUPABASE_PROJECT_ID}.supabase.co`;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// ==============================================
// SEASON MANAGEMENT FUNCTIONS
// ==============================================

// Get current season info from football-data.org API
async function getCurrentSeasonInfo() {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  const response = await fetch('https://api.football-data.org/v4/competitions/PL', {
    headers: {
      'X-Auth-Token': API_KEY,
    },
  });

  if (!response.ok) {
    throw new Error(`API request failed with status ${response.status}`);
  }

  const data = await response.json();
  return {
    startDate: data.currentSeason?.startDate,
    endDate: data.currentSeason?.endDate,
    seasonCode: data.currentSeason?.startDate ? 
      `${data.currentSeason.startDate.substring(0, 4)}-${data.currentSeason.endDate.substring(2, 4)}` : 
      null
  };
}

// Check if it's July 25th or later for the current season's transition year
async function isSeasonTransitionTime() {
  try {
    // Get current season info from API to determine transition year
    const seasonInfo = await getCurrentSeasonInfo();
    
    if (!seasonInfo.seasonCode) {
      return false; // Can't determine if transition needed
    }
    
    // Extract the start year from season code (e.g., "2024-25" -> 2024)
    const currentSeasonStartYear = parseInt(seasonInfo.seasonCode.split('-')[0]);
    
    // The transition should happen in the year AFTER the season starts
    // So if current season is 2024-25, transition happens in 2025
    const transitionYear = currentSeasonStartYear + 1;
    
    const now = new Date();
    const july25th = new Date(transitionYear, 6, 25); // Month is 0-indexed, so 6 = July
    
    console.log(`Current season: ${seasonInfo.seasonCode}, Transition year: ${transitionYear}, July 25th: ${july25th.toISOString().split('T')[0]}, Today: ${now.toISOString().split('T')[0]}`);
    
    return now >= july25th;
  } catch (error) {
    console.error('Error checking season transition time:', error);
    return false;
  }
}


// Get current active season
async function getCurrentSeason() {
  try {
    const { data, error } = await supabase.rpc('get_current_season');
    
    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }
    
    return data;
  } catch (error) {
    console.error('Error getting current season:', error);
    return '2024-25'; // fallback
  }
}

// ==============================================
// API ENDPOINTS
// ==============================================

// GET /api/seasons/current - Get current season info
router.get('/current', async (req, res) => {
  try {
    const currentSeason = await getCurrentSeason();
    
    // Get season details from database
    const { data: seasonData, error } = await supabase
      .from('seasons')
      .select('*')
      .eq('season_code', currentSeason)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      season: seasonData
    });
  } catch (error) {
    console.error('Error getting current season:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/seasons/info - Get season info from API
router.get('/info', async (req, res) => {
  try {
    const seasonInfo = await getCurrentSeasonInfo();
    
    res.json({
      success: true,
      seasonInfo
    });
  } catch (error) {
    console.error('Error getting season info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/seasons/check-transition - Check if it's July 25th or later for current season
router.get('/check-transition', async (req, res) => {
  try {
    const isTransitionTime = await isSeasonTransitionTime();
    
    res.json({
      success: true,
      needsTransition: isTransitionTime,
      isTransitionTime,
      currentDate: new Date().toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error checking season transition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// POST /api/seasons/transition - Perform season transition
router.post('/transition', async (req, res) => {
  try {
    console.log('🔄 Starting season transition...');
    
    // SECURITY: Check if transition is actually needed
    const needsTransition = await isSeasonTransitionTime();
    if (!needsTransition) {
      return res.status(400).json({
        success: false,
        error: 'Season transition is not needed at this time. Only call this endpoint when July 25th has passed.',
        currentDate: new Date().toISOString().split('T')[0]
      });
    }
    
    // SECURITY: Check for secret key (optional but recommended)
    const providedSecret = req.headers['x-transition-secret'] || req.body.secret;
    const expectedSecret = process.env.TRANSITION_SECRET || process.env.CRON_SECRET;
    
    if (expectedSecret && providedSecret !== expectedSecret) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized: Invalid transition secret'
      });
    }
    
    // Get current season info from API
    const seasonInfo = await getCurrentSeasonInfo();
    
    if (!seasonInfo.seasonCode) {
      throw new Error('Could not determine new season code');
    }
    
    // Call the simple reset function
    console.log('🔄 Resetting all data for new season...');
    const { error: resetError } = await supabase.rpc('reset_for_new_season', {
      p_new_season: seasonInfo.seasonCode
    });
    
    if (resetError) {
      throw new Error(`Database error: ${resetError.message}`);
    }
    
    // Now fetch fresh data from API for the new season
    console.log('📥 Fetching fresh fixtures and standings from API...');
    
    // Import the existing refresh functions
    const fixturesRoutes = require('./fixtures');
    const standingsRoutes = require('./standings');
    
    // Refresh fixtures for new season
    try {
      const fixturesResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/fixtures/refresh?season=${seasonInfo.seasonCode}`);
      if (!fixturesResponse.ok) {
        console.warn('⚠️ Failed to refresh fixtures, but continuing...');
      } else {
        console.log('✅ Fixtures refreshed successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error refreshing fixtures:', error.message);
    }
    
    // Refresh standings for new season
    try {
      const standingsResponse = await fetch(`${process.env.API_BASE_URL || 'http://localhost:3001'}/api/standings/refresh?season=${seasonInfo.seasonCode}`);
      if (!standingsResponse.ok) {
        console.warn('⚠️ Failed to refresh standings, but continuing...');
      } else {
        console.log('✅ Standings refreshed successfully');
      }
    } catch (error) {
      console.warn('⚠️ Error refreshing standings:', error.message);
    }
    
    console.log('✅ Season transition completed successfully');
    
    res.json({
      success: true,
      message: 'Season transition completed successfully',
      newSeason: seasonInfo.seasonCode
    });
  } catch (error) {
    console.error('Error during season transition:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/seasons/best-stats/:userId - Get user's best stats
router.get('/best-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const { data: userProfile, error } = await supabase
      .from('user_profiles')
      .select('best_stats')
      .eq('user_id', userId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      bestStats: userProfile.best_stats || {
        best_table_score: 0,
        best_fixture_score: 0,
        best_exact_predictions: 0,
        best_result_predictions: 0,
        best_total_predictions: 0,
        best_badges_count: 0,
        best_season: null
      }
    });
  } catch (error) {
    console.error('Error getting user best stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
