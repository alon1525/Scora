const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Import routes
const fixturesRoutes = require('./routes/fixtures');
const predictionsRoutes = require('./routes/predictions_simple');
const standingsRoutes = require('./routes/standings');
const leaguesRoutes = require('./routes/leagues');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Routes
app.use('/api/fixtures', fixturesRoutes);
app.use('/api/predictions', predictionsRoutes);
app.use('/api/leagues', leaguesRoutes);
app.use('/api/standings', standingsRoutes);

// Test endpoint to check environment variables
app.get('/api/test-env', (req, res) => {
  res.json({
    hasSupabaseUrl: !!process.env.SUPABASE_API_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    hasPublishableKey: !!process.env.SUPABASE_PUBLISHABLE_KEY,
    hasLeagueApiKey: !!process.env.LEAGUE_STANDINGS_API_KEY,
    supabaseUrl: process.env.SUPABASE_API_URL ? 'Set' : 'Missing'
  });
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
      error: 'Internal server error' 
    });
  }
});

// POST /api/users/recalculate-scores - Recalculate all user scores
app.post('/api/users/recalculate-scores', async (req, res) => {
  try {
    console.log('🔄 Starting score recalculation for all users...');
    
    const { data: users, error: usersError } = await supabase
      .from('user_profiles')
      .select('user_id, display_name');

    if (usersError) {
      throw new Error(`Failed to fetch users: ${usersError.message}`);
    }

    console.log(`📊 Found ${users.length} users to recalculate`);

    let successCount = 0;
    let errorCount = 0;

    for (const user of users) {
      try {
        const { data: result, error: calcError } = await supabase.rpc('calculate_user_points', {
          p_user_id: user.user_id
        });

        if (calcError) {
          console.error(`❌ Error calculating points for user ${user.display_name}:`, calcError);
          errorCount++;
        } else {
          console.log(`✅ Recalculated points for ${user.display_name}: ${result} points`);
          successCount++;
        }
      } catch (error) {
        console.error(`❌ Exception calculating points for user ${user.display_name}:`, error);
        errorCount++;
      }
    }

    res.json({
      success: true,
      message: `Score recalculation completed`,
      results: {
        total: users.length,
        successful: successCount,
        errors: errorCount
      }
    });
  } catch (error) {
    console.error('Error in recalculate scores endpoint:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
});

module.exports = app;
