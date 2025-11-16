const express = require('express');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const router = express.Router();

// Supabase client
const supabaseUrl = process.env.SUPABASE_API_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase environment variables are not configured');
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Map our internal team IDs to football-data.org team names
const TEAM_ID_TO_NAME = {
  'arsenal': 'Arsenal FC',
  'aston-villa': 'Aston Villa FC',
  'bournemouth': 'AFC Bournemouth',
  'brentford': 'Brentford FC',
  'brighton': 'Brighton & Hove Albion FC',
  'burnley': 'Burnley FC',
  'chelsea': 'Chelsea FC',
  'crystal-palace': 'Crystal Palace FC',
  'everton': 'Everton FC',
  'fulham': 'Fulham FC',
  'leeds-united': 'Leeds United FC',
  'liverpool': 'Liverpool FC',
  'man-city': 'Manchester City FC',
  'man-united': 'Manchester United FC',
  'newcastle': 'Newcastle United FC',
  'nottingham': 'Nottingham Forest FC',
  'sunderland': 'Sunderland AFC',
  'tottenham': 'Tottenham Hotspur FC',
  'west-ham': 'West Ham United FC',
  'wolves': 'Wolverhampton Wanderers FC',
  'luton-town': 'Luton Town FC',
  'sheffield-united': 'Sheffield United FC',
  'ipswich-town': 'Ipswich Town FC',
  'leicester-city': 'Leicester City FC',
};

// Get team ID from football-data.org API
async function getTeamIdFromAPI(teamName) {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  try {
    const response = await fetch('https://api.football-data.org/v4/teams', {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const team = data.teams.find(t => t.name === teamName);
    
    return team ? team.id : null;
  } catch (error) {
    console.error(`Error fetching team ID for ${teamName}:`, error);
    return null;
  }
}

// Get matches for a team (from all seasons)
async function getTeamMatches(teamId, limit = 200) {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  try {
    // Get more matches to ensure we have enough finished H2H matches across seasons
    const response = await fetch(`https://api.football-data.org/v4/teams/${teamId}/matches?limit=${limit}`, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    return data.matches || [];
  } catch (error) {
    console.error(`Error fetching matches for team ${teamId}:`, error);
    return [];
  }
}

// Calculate H2H stats between two teams
// team1Name/team1Id = home team of the fixture
// team2Name/team2Id = away team of the fixture
async function calculateH2HStats(team1Name, team2Name, team1Id, team2Id, team1ExternalId = null, team2ExternalId = null) {
  try {
    // Get external team IDs from database first, fallback to API if needed
    if (!team1ExternalId || !team2ExternalId) {
      const { data: teams } = await supabase
        .from('teams')
        .select('external_team_id, team_name')
        .in('team_id', [team1Id, team2Id])
        .eq('season', '2025');
      
      if (teams && teams.length === 2) {
        const team1 = teams.find(t => t.team_id === team1Id || t.team_name === team1Name);
        const team2 = teams.find(t => t.team_id === team2Id || t.team_name === team2Name);
        team1ExternalId = team1?.external_team_id || team1ExternalId;
        team2ExternalId = team2?.external_team_id || team2ExternalId;
      }
      
      // Fallback to API if still not found
      if (!team1ExternalId) {
        team1ExternalId = await getTeamIdFromAPI(team1Name);
      }
      if (!team2ExternalId) {
        team2ExternalId = await getTeamIdFromAPI(team2Name);
      }
    }

    if (!team1ExternalId || !team2ExternalId) {
      console.log(`Could not find external IDs for ${team1Name} (${team1ExternalId}) or ${team2Name} (${team2ExternalId})`);
      return null;
    }

    // Get matches for team1 (from all seasons)
    const team1Matches = await getTeamMatches(team1ExternalId, 200);
    
    // Filter matches where team1 played against team2 AND are finished with scores
    const h2hMatches = team1Matches.filter(match => {
      const homeId = match.homeTeam?.id;
      const awayId = match.awayTeam?.id;
      const isH2H = (homeId === team1ExternalId && awayId === team2ExternalId) ||
                    (homeId === team2ExternalId && awayId === team1ExternalId);
      const isFinished = match.status === 'FINISHED';
      const hasScore = match.score?.fullTime?.home !== null && 
                       match.score?.fullTime?.away !== null;
      return isH2H && isFinished && hasScore;
    });

    // Sort by date descending and take last 10 finished matches
    h2hMatches.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
    const last10Matches = h2hMatches.slice(0, 10);

    if (last10Matches.length === 0) {
      return {
        h2h_matches: [],
        avg_goals: {
          home: { for: 0, against: 0 },
          away: { for: 0, against: 0 }
        },
        record: {
          home: { wins: 0, draws: 0, losses: 0 },
          away: { wins: 0, draws: 0, losses: 0 }
        },
        last_match: null,
        updated_at: new Date().toISOString()
      };
    }

    // Calculate stats relative to the current fixture (team1 = home, team2 = away)
    let homeGoalsFor = 0; // Goals scored by home team (team1) in historical matches
    let homeGoalsAgainst = 0; // Goals conceded by home team
    let awayGoalsFor = 0; // Goals scored by away team (team2) in historical matches
    let awayGoalsAgainst = 0; // Goals conceded by away team
    let homeWins = 0; // Wins by home team (team1)
    let homeDraws = 0;
    let homeLosses = 0;

    const formattedMatches = last10Matches.map(match => {
      const matchHomeId = match.homeTeam?.id;
      const matchHomeName = match.homeTeam?.name || '';
      const matchAwayName = match.awayTeam?.name || '';
      const matchHomeScore = match.score?.fullTime?.home ?? 0;
      const matchAwayScore = match.score?.fullTime?.away ?? 0;

      // Determine which team in the historical match corresponds to team1 (home team of current fixture)
      const isTeam1HomeInMatch = matchHomeId === team1ExternalId;
      
      if (isTeam1HomeInMatch) {
        // In this historical match, team1 was home, team2 was away
        homeGoalsFor += matchHomeScore;
        homeGoalsAgainst += matchAwayScore;
        awayGoalsFor += matchAwayScore;
        awayGoalsAgainst += matchHomeScore;

        if (matchHomeScore > matchAwayScore) {
          homeWins++;
        } else if (matchHomeScore < matchAwayScore) {
          homeLosses++;
        } else {
          homeDraws++;
        }
      } else {
        // In this historical match, team2 was home, team1 was away
        homeGoalsFor += matchAwayScore; // Team1 scored as away
        homeGoalsAgainst += matchHomeScore;
        awayGoalsFor += matchHomeScore; // Team2 scored as home
        awayGoalsAgainst += matchAwayScore;

        if (matchAwayScore > matchHomeScore) {
          homeWins++; // Team1 (away) won
        } else if (matchAwayScore < matchHomeScore) {
          homeLosses++; // Team1 (away) lost
        } else {
          homeDraws++;
        }
      }

      return {
        date: match.utcDate ? match.utcDate.split('T')[0] : null,
        home: matchHomeName,
        away: matchAwayName,
        score: `${matchHomeScore}-${matchAwayScore}`,
        home_score: matchHomeScore,
        away_score: matchAwayScore
      };
    });

    const matchCount = last10Matches.length; // All are finished with scores

    const avgGoalsHome = matchCount > 0 ? {
      for: parseFloat((homeGoalsFor / matchCount).toFixed(2)),
      against: parseFloat((homeGoalsAgainst / matchCount).toFixed(2))
    } : { for: 0, against: 0 };

    const avgGoalsAway = matchCount > 0 ? {
      for: parseFloat((awayGoalsFor / matchCount).toFixed(2)),
      against: parseFloat((awayGoalsAgainst / matchCount).toFixed(2))
    } : { for: 0, against: 0 };

    // Get last finished match (most recent)
    const lastFinishedMatch = formattedMatches.length > 0 ? formattedMatches[0] : null;

    return {
      h2h_matches: formattedMatches,
      avg_goals: {
        home: avgGoalsHome,
        away: avgGoalsAway
      },
      record: {
        home: { wins: homeWins, draws: homeDraws, losses: homeLosses },
        away: { wins: homeLosses, draws: homeDraws, losses: homeWins }
      },
      last_match: lastFinishedMatch,
      updated_at: new Date().toISOString()
    };
  } catch (error) {
    console.error(`Error calculating H2H stats for ${team1Name} vs ${team2Name}:`, error);
    return null;
  }
}

// Calculate recent form from team matches (last 5 matches)
async function calculateRecentForm(teamExternalId, season = '2025') {
  try {
    const matches = await getTeamMatches(teamExternalId, 200);
    
    // Filter for Premier League finished matches with scores
    const finishedMatches = matches.filter(match => {
      const isPL = match.competition?.code === 'PL' || 
                   match.competition?.name?.includes('Premier League');
      const isFinished = match.status === 'FINISHED';
      const hasScore = match.score?.fullTime?.home !== null && 
                       match.score?.fullTime?.away !== null;
      return isPL && isFinished && hasScore;
    });

    // Sort by date descending and take last 5
    finishedMatches.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
    const last5Matches = finishedMatches.slice(0, 5);

    if (last5Matches.length === 0) {
      return {
        recent_form: [],
        recent_goals_for: 0,
        recent_goals_against: 0,
        recent_clean_sheets: 0
      };
    }

    const form = [];
    let goalsFor = 0;
    let goalsAgainst = 0;
    let cleanSheets = 0;

    for (const match of last5Matches) {
      const homeId = match.homeTeam?.id;
      const homeScore = match.score?.fullTime?.home ?? 0;
      const awayScore = match.score?.fullTime?.away ?? 0;

      const isHome = homeId === teamExternalId;
      const teamScore = isHome ? homeScore : awayScore;
      const opponentScore = isHome ? awayScore : homeScore;

      goalsFor += teamScore;
      goalsAgainst += opponentScore;

      if (opponentScore === 0) {
        cleanSheets++;
      }

      if (teamScore > opponentScore) {
        form.push('W');
      } else if (teamScore < opponentScore) {
        form.push('L');
      } else {
        form.push('D');
      }
    }

    return {
      recent_form: form,
      recent_goals_for: goalsFor,
      recent_goals_against: goalsAgainst,
      recent_clean_sheets: cleanSheets
    };
  } catch (error) {
    console.error(`Error calculating recent form for team ${teamExternalId}:`, error);
    return {
      recent_form: [],
      recent_goals_for: 0,
      recent_goals_against: 0,
      recent_clean_sheets: 0
    };
  }
}

// Update teams table with current season teams
async function updateTeamsTable(season = '2025') {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  try {
    // Get teams from standings API (current season teams)
    const response = await fetch(`https://api.football-data.org/v4/competitions/PL/standings?season=${season}`, {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const standings = data.standings?.[0]?.table || [];

    const teamsToInsert = [];

    console.log(`📊 Processing ${standings.length} teams...`);

    // Process teams sequentially to avoid rate limiting
    for (let i = 0; i < standings.length; i++) {
      const teamStanding = standings[i];
      const team = teamStanding.team;
      const teamName = team.name;
      
      // Find our internal team ID
      const internalTeamId = Object.keys(TEAM_ID_TO_NAME).find(
        key => TEAM_ID_TO_NAME[key] === teamName
      );

      if (!internalTeamId) {
        console.log(`⚠️ Skipping ${teamName} - not found in team mapping`);
        continue;
      }

      console.log(`📈 Calculating stats for ${teamName} (${i + 1}/${standings.length})...`);
      
      // Calculate recent form with error handling
      let recentFormData;
      try {
        recentFormData = await calculateRecentForm(team.id, season);
      } catch (error) {
        console.error(`  ⚠ Error calculating form for ${teamName}:`, error.message);
        recentFormData = {
          recent_form: [],
          recent_goals_for: 0,
          recent_goals_against: 0,
          recent_clean_sheets: 0
        };
      }
      
      teamsToInsert.push({
        team_id: internalTeamId,
        team_name: teamName,
        external_team_id: team.id,
        season: season,
        current_position: teamStanding.position,
        recent_form: recentFormData.recent_form,
        recent_goals_for: recentFormData.recent_goals_for,
        recent_goals_against: recentFormData.recent_goals_against,
        recent_clean_sheets: recentFormData.recent_clean_sheets,
        updated_at: new Date().toISOString()
      });

      // Small delay to avoid rate limiting
      if (i < standings.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Upsert teams - update only the columns we have
    if (teamsToInsert.length > 0) {
      // First, delete existing teams for this season to avoid conflicts
      const { error: deleteError } = await supabase
        .from('teams')
        .delete()
        .eq('season', season);

      if (deleteError) {
        console.warn('Warning: Could not delete existing teams:', deleteError.message);
      }

      // Then insert all teams
      const { error } = await supabase
        .from('teams')
        .insert(teamsToInsert);

      if (error) {
        throw new Error(`Database error: ${error.message}`);
      }

      console.log(`✅ Updated ${teamsToInsert.length} teams in database with recent form stats`);
    }

    return teamsToInsert.length;
  } catch (error) {
    console.error('Error updating teams table:', error);
    throw error;
  }
}

// Update H2H stats for all fixtures
async function updateAllFixturesH2HStats(season = '2025') {
  try {
    // First, get all teams with their external IDs to avoid API calls
    const { data: allTeams, error: teamsError } = await supabase
      .from('teams')
      .select('team_id, external_team_id, team_name')
      .eq('season', season);

    if (teamsError) {
      console.warn('Warning: Could not fetch teams for caching:', teamsError.message);
    }

    // Create a map for quick lookup
    const teamIdMap = {};
    if (allTeams) {
      allTeams.forEach(team => {
        teamIdMap[team.team_id] = team.external_team_id;
        teamIdMap[team.team_name] = team.external_team_id;
      });
    }

    // Get all fixtures for the season
    const { data: fixtures, error: fixturesError } = await supabase
      .from('fixtures')
      .select('id, home_team_name, away_team_name, home_team_id, away_team_id')
      .eq('season', season);

    if (fixturesError) {
      throw new Error(`Database error: ${fixturesError.message}`);
    }

    if (!fixtures || fixtures.length === 0) {
      console.log('No fixtures found to update');
      return 0;
    }

    console.log(`📊 Updating H2H stats for ${fixtures.length} fixtures...`);

    let updatedCount = 0;
    let errorCount = 0;

    // Process fixtures in batches to avoid rate limiting
    const batchSize = 5;
    const totalBatches = Math.ceil(fixtures.length / batchSize);
    for (let i = 0; i < fixtures.length; i += batchSize) {
      const batch = fixtures.slice(i, i + batchSize);
      const currentBatch = Math.floor(i / batchSize) + 1;
      console.log(`📦 Processing batch ${currentBatch}/${totalBatches} (${batch.length} fixtures)...`);
      
      await Promise.all(batch.map(async (fixture) => {
        try {
          // Get external IDs from cache
          const team1ExternalId = teamIdMap[fixture.home_team_id] || teamIdMap[fixture.home_team_name];
          const team2ExternalId = teamIdMap[fixture.away_team_id] || teamIdMap[fixture.away_team_name];
          
          const h2hStats = await calculateH2HStats(
            fixture.home_team_name,
            fixture.away_team_name,
            fixture.home_team_id,
            fixture.away_team_id,
            team1ExternalId,
            team2ExternalId
          );

          if (h2hStats) {
            const { error: updateError } = await supabase
              .from('fixtures')
              .update({ h2h_stats: h2hStats })
              .eq('id', fixture.id);

            if (updateError) {
              console.error(`Error updating fixture ${fixture.id}:`, updateError);
              errorCount++;
            } else {
              updatedCount++;
              if (updatedCount % 10 === 0) {
                console.log(`  ✓ Updated ${updatedCount} fixtures so far...`);
              }
            }
          } else {
            console.log(`  ⚠ Could not calculate H2H stats for ${fixture.home_team_name} vs ${fixture.away_team_name}`);
            errorCount++;
          }

          // Small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 200));
        } catch (error) {
          console.error(`Error processing fixture ${fixture.id}:`, error);
          errorCount++;
        }
      }));

      // Delay between batches
      if (i + batchSize < fixtures.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Log progress
      console.log(`✅ Batch ${currentBatch}/${totalBatches} complete. Progress: ${updatedCount + errorCount}/${fixtures.length} fixtures processed`);
    }

    console.log(`✅ Updated H2H stats for ${updatedCount} fixtures (${errorCount} errors)`);
    return updatedCount;
  } catch (error) {
    console.error('Error updating fixtures H2H stats:', error);
    throw error;
  }
}

// POST /api/stats/update - Update teams and H2H stats
router.post('/update', async (req, res) => {
  try {
    const { season = '2025' } = req.query;
    const secret = req.headers['x-stats-secret'];

    // Optional: Add secret for security
    if (process.env.STATS_UPDATE_SECRET && secret !== process.env.STATS_UPDATE_SECRET) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    console.log('🔄 Starting stats update...');

    // Step 1: Update teams table
    console.log('📋 Step 1: Updating teams table...');
    const teamsCount = await updateTeamsTable(season);
    console.log(`✅ Updated ${teamsCount} teams`);

    // Step 2: Update H2H stats for all fixtures
    console.log('⚽ Step 2: Updating H2H stats for fixtures...');
    const fixturesCount = await updateAllFixturesH2HStats(season);
    console.log(`✅ Updated ${fixturesCount} fixtures`);

    res.json({
      success: true,
      message: 'Stats updated successfully',
      teams_updated: teamsCount,
      fixtures_updated: fixturesCount
    });
  } catch (error) {
    console.error('Error updating stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stats/teams - Get all teams
router.get('/teams', async (req, res) => {
  try {
    const { season = '2025' } = req.query;

    const { data: teams, error } = await supabase
      .from('teams')
      .select('*')
      .eq('season', season)
      .order('current_position', { ascending: true });

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      teams: teams || [],
      count: teams?.length || 0
    });
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// GET /api/stats/fixture/:fixtureId - Get H2H stats for a specific fixture
router.get('/fixture/:fixtureId', async (req, res) => {
  try {
    const { fixtureId } = req.params;

    const { data: fixture, error } = await supabase
      .from('fixtures')
      .select('h2h_stats')
      .eq('id', fixtureId)
      .single();

    if (error) {
      throw new Error(`Database error: ${error.message}`);
    }

    res.json({
      success: true,
      h2h_stats: fixture?.h2h_stats || null
    });
  } catch (error) {
    console.error('Error fetching fixture H2H stats:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

