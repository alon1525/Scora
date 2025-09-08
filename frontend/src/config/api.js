// API Configuration
// This file centralizes all API endpoints for easy deployment

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  // Standings
  STANDINGS: `${API_BASE_URL}/api/standings`,
  STANDINGS_REFRESH: `${API_BASE_URL}/api/standings/refresh`,
  
  // Predictions
  TABLE_PREDICTIONS: `${API_BASE_URL}/api/predictions/table`,
  FIXTURE_PREDICTIONS: `${API_BASE_URL}/api/predictions/fixtures`,
  USER_SCORES: `${API_BASE_URL}/api/predictions/scores`,
  LEADERBOARD: `${API_BASE_URL}/api/predictions/leaderboard`,
  USER_STATS: `${API_BASE_URL}/api/predictions/user-stats`,
  RECALCULATE_USER: `${API_BASE_URL}/api/predictions/recalculate-user`,
  
  // Fixtures
  FIXTURES_MATCHDAY: `${API_BASE_URL}/api/fixtures/matchday`,
  FIXTURES_ALL: `${API_BASE_URL}/api/fixtures`,
  FIXTURES_REFRESH: `${API_BASE_URL}/api/fixtures/refresh`,
  FIXTURES_REFRESH_AND_RECALCULATE: `${API_BASE_URL}/api/fixtures/refresh-and-recalculate`,
  
  // Users
  CREATE_PROFILE: `${API_BASE_URL}/api/users/create-profile`,
  RECALCULATE_SCORES: `${API_BASE_URL}/api/users/recalculate-scores`,
  
  // Leagues
  LEAGUES_CREATE: `${API_BASE_URL}/api/leagues/create`,
  LEAGUES_JOIN: `${API_BASE_URL}/api/leagues/join`,
  LEAGUES_MY_LEAGUES: `${API_BASE_URL}/api/leagues/my-leagues`,
  LEAGUES_DETAILS: `${API_BASE_URL}/api/leagues`
};

export default API_BASE_URL;
