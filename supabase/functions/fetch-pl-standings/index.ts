// Supabase Edge Function: fetch-pl-standings
// Fetches Premier League standings from football-data.org and maps them to the app's team IDs

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Map football-data TLAs to our local team ids from src/data/teams.ts
const TLA_TO_ID: Record<string, string> = {
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const API_KEY = Deno.env.get('FOOTBALL_DATA_API_KEY');
  
  try {
    if (!API_KEY) {
      console.log('No API key found, using fallback mock data');
      throw new Error('No API key - falling back to mock data');
    }

    const apiRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings?season=2025', {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!apiRes.ok) {
      console.log(`API request failed with status ${apiRes.status}, falling back to mock data`);
    const payload = await apiRes.json();
    const standings = Array.isArray(payload?.standings) ? payload.standings : [];
    const totalTable = standings.find((s: any) => s?.type === 'TOTAL' && Array.isArray(s?.table));
    const table = totalTable?.table || [];

    const positionsById: Record<string, number> = {};
    const standingsData: Array<{
      id: string;
      position: number;
      name: string;
      played: number;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
      goalDifference: number;
      points: number;
    }> = [];

    for (const entry of table) {
      const tla = entry?.team?.tla as string | undefined;
      const position = entry?.position as number | undefined;
      const name = entry?.team?.name as string | undefined;
      const played = entry?.playedGames as number | undefined;
      const wins = entry?.won as number | undefined;
      const draws = entry?.draw as number | undefined;
      const losses = entry?.lost as number | undefined;
      const goalsFor = entry?.goalsFor as number | undefined;
      const goalsAgainst = entry?.goalsAgainst as number | undefined;
      const goalDifference = entry?.goalDifference as number | undefined;
      const points = entry?.points as number | undefined;

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

    return new Response(
      JSON.stringify({
        source: 'football-data',
        fetchedAt: new Date().toISOString(),
        lastUpdated: payload?.competition?.lastUpdated || new Date().toISOString(),
        positionsById,
        standingsData,
        count: Object.keys(positionsById).length,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  } catch (e) {
    console.log('API failed, using fallback mock data:', String(e));
    
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

    const positionsById: Record<string, number> = {};
    mockStandings.forEach(team => {
      positionsById[team.id] = team.position;
    });

    return new Response(
      JSON.stringify({
        source: 'fallback-mock',
        fetchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        positionsById,
        standingsData: mockStandings,
        count: mockStandings.length,
      }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
