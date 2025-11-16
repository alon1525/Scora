# Stats Implementation Summary

## Overview
This implementation adds team statistics and head-to-head (H2H) stats for fixtures, with automatic updates via GitHub Actions every 2 days.

## What Was Created

### 1. Database Migration
**File:** `supabase/migrations/add_teams_and_h2h_stats.sql`

- **New `teams` table** with fields:
  - Basic info: `team_id`, `team_name`, `external_team_id`, `team_logo`, `season`
  - League stats: `current_position`, `points`, `goals_for`, `goals_against`, `wins`, `draws`, `losses`
  - **Recent form (last 5 matches)**: `recent_form` (array of 'W', 'D', 'L'), `recent_goals_for`, `recent_goals_against`, `recent_clean_sheets`
  - Home/Away stats: `home_wins`, `home_draws`, `home_losses`, `away_wins`, `away_draws`, `away_losses`

- **Added `h2h_stats` JSONB field** to `fixtures` table containing:
  - Last 10 H2H matches
  - Average goals scored/conceded for each team
  - Head-to-head record (wins/draws/losses)
  - Last match result

### 2. Backend API Route
**File:** `backend/routes/stats.js`

**Endpoints:**
- `POST /api/stats/update` - Updates teams table and H2H stats for all fixtures
- `GET /api/stats/teams` - Get all teams for a season
- `GET /api/stats/fixture/:fixtureId` - Get H2H stats for a specific fixture

**Features:**
- Fetches teams from football-data.org standings API
- **Calculates recent form stats** (last 5 Premier League matches):
  - Recent form array (W/D/L)
  - Goals scored in last 5 matches
  - Goals conceded in last 5 matches
  - Clean sheets in last 5 matches
- **Updates current league position** from standings
- Calculates H2H stats by:
  1. Getting team IDs from `/teams` endpoint
  2. Fetching matches for each team from `/teams/{teamId}/matches`
  3. Filtering matches where teams played each other
  4. Calculating stats from last 10 H2H matches
- Processes fixtures in batches to avoid rate limiting
- Includes error handling and logging

### 3. GitHub Action Workflow
**File:** `.github/workflows/update-stats.yml`

- Runs every 2 days at 2 AM UTC (4 AM Israel time)
- Calls `/api/stats/update` endpoint
- Includes error handling and notifications
- Can be manually triggered via `workflow_dispatch`

### 4. Season Transition Update
**File:** `backend/routes/seasons.js`

- Added teams table reset during season transition
- Deletes old season teams when transitioning to new season

## Setup Instructions

### 1. Run Database Migration
Execute the SQL migration in your Supabase SQL Editor:
```sql
-- Run: supabase/migrations/add_teams_and_h2h_stats.sql
```

### 2. Add Environment Variable
Add to your backend `.env` and Vercel environment variables:
```env
STATS_UPDATE_SECRET=your_secret_key_here
```

### 3. Add GitHub Secret
In your GitHub repository settings, add:
- `STATS_UPDATE_SECRET` - Secret key for authenticating stats update requests

### 4. Test the Implementation

**Manual Test:**
```bash
# Update stats manually
curl -X POST "https://your-api-url.com/api/stats/update?season=2025" \
  -H "x-stats-secret: your_secret_key"
```

**Check Teams:**
```bash
curl "https://your-api-url.com/api/stats/teams?season=2025"
```

**Check Fixture H2H Stats:**
```bash
curl "https://your-api-url.com/api/stats/fixture/{fixtureId}"
```

## H2H Stats JSON Structure

```json
{
  "team1": "Arsenal FC",
  "team2": "Liverpool FC",
  "h2h_matches": [
    {
      "date": "2025-04-15",
      "home": "Arsenal FC",
      "away": "Liverpool FC",
      "score": "2-1",
      "home_score": 2,
      "away_score": 1
    }
  ],
  "avg_goals": {
    "team1": { "for": 1.8, "against": 1.1 },
    "team2": { "for": 1.2, "against": 1.8 }
  },
  "record": {
    "team1": { "wins": 6, "draws": 2, "losses": 2 },
    "team2": { "wins": 2, "draws": 2, "losses": 6 }
  },
  "last_match": {
    "date": "2025-04-15",
    "home": "Arsenal FC",
    "away": "Liverpool FC",
    "score": "2-1",
    "home_score": 2,
    "away_score": 1
  },
  "updated_at": "2025-01-20T10:00:00Z"
}
```

## Implemented Additional Stats

The following stats are now calculated and stored in the `teams` table:
- ✅ **Recent form** (last 5 Premier League matches) - Array of 'W', 'D', 'L'
- ✅ **Goals scored in last 5 matches** - `recent_goals_for`
- ✅ **Goals conceded in last 5 matches** - `recent_goals_against`
- ✅ **Clean sheets in last 5 matches** - `recent_clean_sheets`
- ✅ **Current league position** - `current_position` (from standings)

These are calculated by:
1. Fetching team's recent matches from `/teams/{teamId}/matches`
2. Filtering by competition (Premier League only)
3. Filtering for finished matches with scores
4. Sorting by date and taking last 5 matches
5. Calculating form, goals, and clean sheets from these matches

## Notes

- The stats update process may take several minutes for all fixtures due to API rate limiting
- H2H stats are only calculated if both teams have played each other in the past
- If no H2H matches are found, the stats object will have empty arrays and zero values
- The GitHub Action includes delays between API calls to respect rate limits

## Troubleshooting

**Issue: Stats not updating**
- Check GitHub Actions logs
- Verify `STATS_UPDATE_SECRET` is set correctly
- Check API key is valid and has sufficient quota

**Issue: No H2H stats for fixtures**
- Some teams may not have played each other recently
- Check API response for team IDs
- Verify matches are being filtered correctly

**Issue: Teams table empty**
- Run the stats update manually first
- Check if season matches current season in database
- Verify API key has access to standings endpoint

