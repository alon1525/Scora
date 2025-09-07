📁 Backend File Structure:
Root Files:
server.js - Main server file (starts the API)
scheduler.js - Hourly standings refresh (runs separately)
package.json - Dependencies and scripts
.env - Environment variables (API keys, URLs)
routes/ Directory:
fixtures.js - Handles match/fixture data
standings.js - Handles live standings data
predictions_simple.js - Handles user predictions

🔍 What Each Route File Does:
1. fixtures.js - Match Data
GET /api/fixtures - Get all fixtures
GET /api/fixtures/matchday/:id - Get fixtures for specific matchday
POST /api/fixtures/refresh - Fetch new fixtures from API
GET /api/fixtures/upcoming - Get upcoming matches
GET /api/fixtures/results - Get finished matches
2. standings.js - Live Standings
GET /api/standings - Get cached standings (fast)
POST /api/standings/refresh - Update standings from API
3. predictions_simple.js - User Predictions
POST /api/predictions/table - Save table prediction
GET /api/predictions/table - Get user's table prediction
POST /api/predictions/fixture - Save match prediction
GET /api/predictions/fixtures - Get user's match predictions
GET /api/predictions/scores - Get user's scores
GET /api/predictions/leaderboard - Get leaderboard