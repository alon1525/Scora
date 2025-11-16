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

// Get matches for a team
async function getTeamMatches(teamId, limit = 100) {
  const API_KEY = process.env.LEAGUE_STANDINGS_API_KEY;
  
  if (!API_KEY) {
    throw new Error('No API key found');
  }

  try {
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
async function calculateH2HStats(team1Name, team2Name, team1Id, team2Id) {
  try {
    // Get external team IDs from API
    const team1ExternalId = await getTeamIdFromAPI(team1Name);
    const team2ExternalId = await getTeamIdFromAPI(team2Name);

    if (!team1ExternalId || !team2ExternalId) {
      console.log(`Could not find external IDs for ${team1Name} or ${team2Name}`);
      return null;
    }

    // Get matches for team1
    const team1Matches = await getTeamMatches(team1ExternalId, 100);
    
    // Filter matches where team1 played against team2
    const h2hMatches = team1Matches.filter(match => {
      const homeId = match.homeTeam?.id;
      const awayId = match.awayTeam?.id;
      return (homeId === team1ExternalId && awayId === team2ExternalId) ||
             (homeId === team2ExternalId && awayId === team1ExternalId);
    });

    // Sort by date descending and take last 10
    h2hMatches.sort((a, b) => new Date(b.utcDate) - new Date(a.utcDate));
    const last10Matches = h2hMatches.slice(0, 10);

    if (last10Matches.length === 0) {
      return {
        team1: team1Name,
        team2: team2Name,
        h2h_matches: [],
        avg_goals: {
          team1: { for: 0, against: 0 },
          team2: { for: 0, against: 0 }
        },
        record: {
          team1: { wins: 0, draws: 0, losses: 0 },
          team2: { wins: 0, draws: 0, losses: 0 }
        },
        last_match: null,
        updated_at: new Date().toISOString()
      };
    }

    // Calculate stats
    let team1GoalsFor = 0;
    let team1GoalsAgainst = 0;
    let team2GoalsFor = 0;
    let team2GoalsAgainst = 0;
    let team1Wins = 0;
    let team1Draws = 0;
    let team1Losses = 0;

    const formattedMatches = last10Matches.map(match => {
      const homeId = match.homeTeam?.id;
      const homeName = match.homeTeam?.name || '';
      const awayName = match.awayTeam?.name || '';
      const homeScore = match.score?.fullTime?.home ?? null;
      const awayScore = match.score?.fullTime?.away ?? null;

      let team1Score, team2Score;
      if (homeId === team1ExternalId) {
        team1Score = homeScore;
        team2Score = awayScore;
      } else {
        team1Score = awayScore;
        team2Score = homeScore;
      }

      // Only count if scores are available
      if (team1Score !== null && team2Score !== null) {
        team1GoalsFor += team1Score;
        team1GoalsAgainst += team2Score;
        team2GoalsFor += team2Score;
        team2GoalsAgainst += team1Score;

        if (team1Score > team2Score) {
          team1Wins++;
        } else if (team1Score < team2Score) {
          team1Losses++;
        } else {
          team1Draws++;
        }
      }

      return {
        date: match.utcDate ? match.utcDate.split('T')[0] : null,
        home: homeName,
        away: awayName,
        score: homeScore !== null && awayScore !== null ? `${homeScore}-${awayScore}` : null,
        home_score: homeScore,
        away_score: awayScore
      };
    });

    const matchCount = last10Matches.filter(m => 
      m.score?.fullTime?.home !== null && m.score?.fullTime?.away !== null
    ).length;

    const avgGoalsTeam1 = matchCount > 0 ? {
      for: parseFloat((team1GoalsFor / matchCount).toFixed(2)),
      against: parseFloat((team1GoalsAgainst / matchCount).toFixed(2))
    } : { for: 0, against: 0 };

    const avgGoalsTeam2 = matchCount > 0 ? {
      for: parseFloat((team2GoalsFor / matchCount).toFixed(2)),
      against: parseFloat((team2GoalsAgainst / matchCount).toFixed(2))
    } : { for: 0, against: 0 };

    return {
      team1: team1Name,
      team2: team2Name,
      h2h_matches: formattedMatches,
      avg_goals: {
        team1: avgGoalsTeam1,
        team2: avgGoalsTeam2
      },
      record: {
        team1: { wins: team1Wins, draws: team1Draws, losses: team1Losses },
        team2: { wins: team1Losses, draws: team1Draws, losses: team1Wins }
      },
      last_match: formattedMatches[0] || null,
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
    const matches = await getTeamMatches(teamExternalId, 100);
    
    // Filter for finished matches with scores
    const finishedMatches = matches.filter(match => {
      const isFinished = match.status === 'FINISHED';
      const hasScore = match.score?.fullTime?.home !== null && 
                       match.score?.fullTime?.away !== null;
      return isFinished && hasScore;
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

      if (internalTeamId) {
        console.log(`📈 Calculating stats for ${teamName} (${i + 1}/${standings.length})...`);
        
        // Calculate recent form
        const recentFormData = await calculateRecentForm(team.id, season);
        
        teamsToInsert.push({
          team_id: internalTeamId,
          team_name: teamName,
          external_team_id: team.id,
          team_logo: team.crest,
          season: season,
          current_position: teamStanding.position,
          points: teamStanding.points,
          goals_for: teamStanding.goalsFor,
          goals_against: teamStanding.goalsAgainst,
          wins: teamStanding.won,
          draws: teamStanding.draw,
          losses: teamStanding.lost,
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
    }

    // Upsert teams
    if (teamsToInsert.length > 0) {
      const { error } = await supabase
        .from('teams')
        .upsert(teamsToInsert, {
          onConflict: 'team_id,season',
          ignoreDuplicates: false
        });

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
    for (let i = 0; i < fixtures.length; i += batchSize) {
      const batch = fixtures.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (fixture) => {
        try {
          const h2hStats = await calculateH2HStats(
            fixture.home_team_name,
            fixture.away_team_name,
            fixture.home_team_id,
            fixture.away_team_id
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
            }
          } else {
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

