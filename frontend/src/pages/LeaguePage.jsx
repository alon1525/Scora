import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

// Function to clean team names to short names (same as UserProfile)
const getCleanTeamName = (teamName) => {
  const nameMapping = {
    // Brighton variations
    'Brighton & Hove Albion': 'Brighton',
    'Brighton & Hove Albion FC': 'Brighton',
    'Brighton': 'Brighton',
    
    // Wolves variations
    'Wolverhampton Wanderers': 'Wolves',
    'Wolverhampton Wanderers FC': 'Wolves',
    'Wolves': 'Wolves',
    'Wolverhampton': 'Wolves',
    
    // AFC Bournemouth
    'AFC Bournemouth': 'Bournemouth',
    'Bournemouth': 'Bournemouth',
    
    // Arsenal
    'Arsenal FC': 'Arsenal',
    'Arsenal': 'Arsenal',
    
    // Aston Villa
    'Aston Villa FC': 'Aston Villa',
    'Aston Villa': 'Aston Villa',
    
    // Brentford
    'Brentford FC': 'Brentford',
    'Brentford': 'Brentford',
    
    // Burnley
    'Burnley FC': 'Burnley',
    'Burnley': 'Burnley',
    
    // Chelsea
    'Chelsea FC': 'Chelsea',
    'Chelsea': 'Chelsea',
    
    // Crystal Palace
    'Crystal Palace FC': 'Crystal Palace',
    'Crystal Palace': 'Crystal Palace',
    
    // Everton
    'Everton FC': 'Everton',
    'Everton': 'Everton',
    
    // Fulham
    'Fulham FC': 'Fulham',
    'Fulham': 'Fulham',
    
    // Leeds
    'Leeds United': 'Leeds',
    'Leeds United FC': 'Leeds',
    'Leeds': 'Leeds',
    
    // Liverpool
    'Liverpool FC': 'Liverpool',
    'Liverpool': 'Liverpool',
    
    // Manchester City
    'Manchester City FC': 'Manchester City',
    'Manchester City': 'Manchester City',
    
    // Manchester United
    'Manchester United FC': 'Manchester United',
    'Manchester United': 'Manchester United',
    
    // Newcastle
    'Newcastle United': 'Newcastle',
    'Newcastle United FC': 'Newcastle',
    'Newcastle': 'Newcastle',
    
    // Nottingham Forest
    'Nottingham Forest FC': 'Nottingham Forest',
    'Nottingham Forest': 'Nottingham Forest',
    'Nottingham': 'Nottingham Forest',
    
    // Sunderland
    'Sunderland AFC': 'Sunderland',
    'Sunderland FC': 'Sunderland',
    'Sunderland': 'Sunderland',
    
    // Tottenham
    'Tottenham Hotspur': 'Tottenham',
    'Tottenham Hotspur FC': 'Tottenham',
    'Tottenham': 'Tottenham',
    
    // West Ham
    'West Ham United': 'West Ham',
    'West Ham United FC': 'West Ham',
    'West Ham': 'West Ham'
  };
  
  return nameMapping[teamName] || teamName;
};

const LeaguePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fixtures, setFixtures] = useState([]);
  const [matchPredictions, setMatchPredictions] = useState({});

  useEffect(() => {
    if (id) {
      loadLeagueDetails();
      loadFixtures();
    }
  }, [id]);

  const loadLeagueDetails = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to view league details');
        return;
      }
      
      const token = session.access_token;
      
      const response = await axios.get(`${API_ENDPOINTS.LEAGUES_DETAILS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        setLeague(response.data.data);
      } else {
        toast.error(response.data.error || 'Failed to load league details');
        setLeague(createMockLeagueData());
      }
    } catch (error) {
      console.error('Error loading league details:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please sign in again.');
      } else if (error.response?.status === 403) {
        toast.error('You are not a member of this league');
      } else {
        toast.error('Failed to load league details');
      }
      setLeague(createMockLeagueData());
    } finally {
      setLoading(false);
    }
  };

  const createMockLeagueData = () => {
    return {
      id: id,
      name: "Premier League Predictions",
      code: "PL",
      members: [
        { id: 1, display_name: "John Doe", email: "john@example.com", points: 45, exact_predictions: 8, result_predictions: 12, accuracy: 75 },
        { id: 2, display_name: "Jane Smith", email: "jane@example.com", points: 42, exact_predictions: 7, result_predictions: 11, accuracy: 68 },
        { id: 3, display_name: "Mike Johnson", email: "mike@example.com", points: 38, exact_predictions: 6, result_predictions: 10, accuracy: 65 },
        { id: 4, display_name: "Sarah Wilson", email: "sarah@example.com", points: 35, exact_predictions: 5, result_predictions: 9, accuracy: 60 },
        { id: 5, display_name: "David Brown", email: "david@example.com", points: 32, exact_predictions: 4, result_predictions: 8, accuracy: 55 }
      ],
      standings: [
        { rank: 1, user_id: 1, display_name: "John Doe", points: 45, exact_predictions: 8, result_predictions: 12, accuracy: 75 },
        { rank: 2, user_id: 2, display_name: "Jane Smith", points: 42, exact_predictions: 7, result_predictions: 11, accuracy: 68 },
        { rank: 3, user_id: 3, display_name: "Mike Johnson", points: 38, exact_predictions: 6, result_predictions: 10, accuracy: 65 },
        { rank: 4, user_id: 4, display_name: "Sarah Wilson", points: 35, exact_predictions: 5, result_predictions: 9, accuracy: 60 },
        { rank: 5, user_id: 5, display_name: "David Brown", points: 32, exact_predictions: 4, result_predictions: 8, accuracy: 55 }
      ]
    };
  };

  const loadFixtures = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.FIXTURES_ALL);
      
      if (response.data.success) {
        setFixtures(response.data.data.slice(0, 10)); // Show first 10 fixtures
        generateMockPredictions(response.data.data.slice(0, 10));
      } else {
        // Fallback to mock data
        const mockFixtures = createMockFixtures();
        setFixtures(mockFixtures);
        generateMockPredictions(mockFixtures);
      }
    } catch (error) {
      console.error('Error loading fixtures:', error);
      // Fallback to mock data
      const mockFixtures = createMockFixtures();
      setFixtures(mockFixtures);
      generateMockPredictions(mockFixtures);
    }
  };

  const createMockFixtures = () => {
    const teams = ['Arsenal', 'Chelsea', 'Liverpool', 'Manchester City', 'Manchester United', 'Tottenham', 'Newcastle', 'Brighton'];
    const fixtures = [];
    
    for (let i = 0; i < 10; i++) {
      const homeTeam = teams[Math.floor(Math.random() * teams.length)];
      const awayTeam = teams[Math.floor(Math.random() * teams.length)];
      
      if (homeTeam !== awayTeam) {
        fixtures.push({
          id: i + 1,
          home_team_name: homeTeam,
          away_team_name: awayTeam,
          home_score: Math.floor(Math.random() * 4),
          away_score: Math.floor(Math.random() * 4),
          status: ['FINISHED', 'IN_PLAY', 'NOT_STARTED'][Math.floor(Math.random() * 3)],
          match_date: new Date(Date.now() + Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
        });
      }
    }
    
    return fixtures;
  };

  const generateMockPredictions = (fixtures) => {
    const predictions = {};
    
    fixtures.forEach(fixture => {
      const numPredictions = Math.floor(Math.random() * 15) + 5; // 5-20 predictions
      const fixturePredictions = [];
      
      for (let i = 0; i < numPredictions; i++) {
        fixturePredictions.push({
          home_score: Math.floor(Math.random() * 4),
          away_score: Math.floor(Math.random() * 4)
        });
      }
      
      predictions[fixture.id] = fixturePredictions;
    });
    
    setMatchPredictions(predictions);
  };


  const handleParticipantClick = (participant) => {
    navigate(`/user/${participant.user_id}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading league details...</p>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">League not found</h2>
          <Button onClick={() => navigate('/')}>Back to Dashboard</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">{league.name?.charAt(0) || 'L'}</span>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">{league.name}</h1>
                <div className="flex items-center space-x-6 text-sm">
                  <span className="flex items-center text-slate-300">
                    <span className="w-3 h-3 bg-green-500 rounded-full mr-3 shadow-lg"></span>
                    <span className="font-mono font-semibold text-green-400 bg-slate-800 px-3 py-1 rounded-lg">{league.code}</span>
                  </span>
                  <span className="flex items-center text-slate-300">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-3 shadow-lg"></span>
                    <span className="font-semibold">{league.standings?.length || 0} members</span>
                  </span>
                </div>
              </div>
            </div>
            <Button 
              onClick={() => navigate('/dashboard')} 
              className="flex items-center space-x-2 bg-slate-700 hover:bg-slate-600 text-white border-slate-600"
            >
              <span className="material-symbols-outlined text-lg">arrow_back</span>
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Standings Table */}
        <Card className="mb-8 shadow-2xl border-0 bg-gradient-to-br from-slate-800 to-slate-900">
          <div className="p-8">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center space-x-3">
                <span className="material-symbols-outlined text-3xl text-blue-400">emoji_events</span>
                <h2 className="text-3xl font-bold text-white">League Standings</h2>
              </div>
              <div className="text-sm text-slate-400 bg-slate-700 px-4 py-2 rounded-lg">
                Click on a player to view their predictions
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full standings-table">
                <thead>
                  <tr className="border-b-2 border-slate-600">
                    <th className="text-left py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Rank</th>
                    <th className="text-left py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Player</th>
                    <th className="text-center py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Total Points</th>
                    <th className="text-center py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Exact</th>
                    <th className="text-center py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Results</th>
                    <th className="text-center py-6 px-4 font-semibold text-slate-300 text-sm uppercase tracking-wider">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {league.standings?.map((participant, index) => (
                    <tr 
                      key={participant.user_id} 
                      className="border-b border-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-600 cursor-pointer transition-all duration-200"
                      onClick={() => handleParticipantClick(participant)}
                    >
                      <td className="py-4 px-4">
                        <div className="flex items-center">
                          {participant.rank <= 3 ? (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              participant.rank === 1 ? "bg-gradient-to-r from-yellow-400 to-yellow-600" :
                              participant.rank === 2 ? "bg-gradient-to-r from-gray-400 to-gray-600" :
                              "bg-gradient-to-r from-orange-400 to-orange-600"
                            }`}>
                              {participant.rank}
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                              {participant.rank}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-6 px-4">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                            <span className="text-white font-bold text-lg">
                              {participant.display_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-bold text-white text-lg">{participant.display_name}</div>
                            <div className="text-sm text-slate-400">{participant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="text-3xl font-bold text-white bg-slate-700 px-4 py-2 rounded-lg">{participant.total_points || participant.points || 0}</span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-green-600 text-white shadow-lg">
                          {participant.exact_predictions || 0}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-blue-600 text-white shadow-lg">
                          {participant.result_predictions || 0}
                        </span>
                      </td>
                      <td className="py-6 px-4 text-center">
                        <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-purple-600 text-white shadow-lg">
                          {participant.accuracy || 0}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

      </div>
    </div>
  );
};

export default LeaguePage;