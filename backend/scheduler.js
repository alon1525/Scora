// Hourly standings refresh scheduler
const fetch = require('node-fetch');
require('dotenv').config();

const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3001';
const REFRESH_INTERVAL = parseInt(process.env.STANDINGS_REFRESH_INTERVAL) || 60 * 60 * 1000; // Default 1 hour

// Function to refresh standings
async function refreshStandings() {
  try {
    console.log(`🔄 [${new Date().toISOString()}] Starting hourly standings refresh...`);
    
    const response = await fetch(`${API_BASE_URL}/api/standings/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const data = await response.json();
    
    if (data.success) {
      console.log(`✅ [${new Date().toISOString()}] Standings refreshed successfully: ${data.count} teams updated`);
    } else {
      console.error(`❌ [${new Date().toISOString()}] Failed to refresh standings:`, data.error);
    }
  } catch (error) {
    console.error(`❌ [${new Date().toISOString()}] Error refreshing standings:`, error.message);
  }
}

// Run immediately on startup
console.log('🚀 Starting standings scheduler...');
refreshStandings();

// Then run every hour (or custom interval)
setInterval(refreshStandings, REFRESH_INTERVAL);

console.log(`⏰ Standings will refresh every ${REFRESH_INTERVAL / 1000 / 60} minutes`);
console.log('📊 Next refresh scheduled for:', new Date(Date.now() + REFRESH_INTERVAL).toISOString());
