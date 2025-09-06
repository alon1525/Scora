// Hourly fixtures refresh and score recalculation scheduler
const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const REFRESH_INTERVAL = parseInt(process.env.STANDINGS_REFRESH_INTERVAL) || 60 * 60 * 1000; // Default 1 hour

// Function to refresh fixtures and recalculate all scores
async function refreshFixturesAndScores() {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Starting hourly fixtures refresh and score recalculation...`);
    
    const response = await fetch(`${API_BASE_URL}/api/fixtures/refresh-and-recalculate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [${new Date().toISOString()}] Fixtures refreshed and scores recalculated: ${data.fixtures_updated} fixtures, ${data.users_updated} users updated`);
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to refresh fixtures and scores:`, data.error);
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error refreshing fixtures and scores:`, error.message);
  }
}

// Run immediately on startup
console.log('🚀 Starting fixtures and scores scheduler...');
refreshFixturesAndScores();

// Then run every hour (or custom interval)
setInterval(refreshFixturesAndScores, REFRESH_INTERVAL);

console.log(`⏰ Fixtures and scores will refresh every ${REFRESH_INTERVAL / 1000 / 60} minutes`);
console.log('📊 Next refresh scheduled for:', new Date(Date.now() + REFRESH_INTERVAL).toISOString());
