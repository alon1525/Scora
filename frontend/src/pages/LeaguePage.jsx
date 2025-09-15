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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-xl">{league.name?.charAt(0) || 'L'}</span>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                    Code: <span className="font-mono font-semibold ml-1">{league.code}</span>
                  </span>
                  <span className="flex items-center">
                    <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                    {league.standings?.length || 0} members
                  </span>
                </div>
              </div>
            </div>
            <Button onClick={() => navigate('/dashboard')} variant="outline" className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Dashboard</span>
            </Button>
          </div>
        </div>

        {/* Standings Table */}
        <Card className="mb-8 shadow-lg border-0">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">League Standings</h2>
              <div className="text-sm text-gray-500">
                Click on a player to view their predictions
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full standings-table">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Rank</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Player</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Total Points</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Exact</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Results</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {league.standings?.map((participant, index) => (
                    <tr 
                      key={participant.user_id} 
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
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
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">
                              {participant.display_name?.charAt(0) || 'U'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{participant.display_name}</div>
                            <div className="text-sm text-gray-500">{participant.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="text-2xl font-bold text-gray-900">{participant.total_points || participant.points || 0}</span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                          {participant.exact_predictions || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {participant.result_predictions || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-purple-100 text-purple-800">
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