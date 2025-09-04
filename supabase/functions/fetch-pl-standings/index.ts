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
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Missing FOOTBALL_DATA_API_KEY' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }

  try {
    const apiRes = await fetch('https://api.football-data.org/v4/competitions/PL/standings?season=2025', {
      headers: {
        'X-Auth-Token': API_KEY,
      },
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      return new Response(
        JSON.stringify({ error: 'Upstream error', status: apiRes.status, body: text }),
        { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
      );
    }

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
    return new Response(
      JSON.stringify({ error: 'Unhandled error', message: String(e) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
