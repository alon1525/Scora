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
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [participantPredictions, setParticipantPredictions] = useState([]);
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
      const response = await axios.get(`${API_ENDPOINTS.LEAGUES_DETAILS}/${id}`);
      
      if (response.data.success) {
        setLeague(response.data.data);
      } else {
        // Fallback to mock data for development
        setLeague(createMockLeagueData());
      }
    } catch (error) {
      console.error('Error loading league details:', error);
      // Fallback to mock data for development
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
        { id: 1, display_name: "John Doe", email: "john@example.com", points: 45, exact_predictions: 8, hits: 12, accuracy: 75 },
        { id: 2, display_name: "Jane Smith", email: "jane@example.com", points: 42, exact_predictions: 7, hits: 11, accuracy: 68 },
        { id: 3, display_name: "Mike Johnson", email: "mike@example.com", points: 38, exact_predictions: 6, hits: 10, accuracy: 65 },
        { id: 4, display_name: "Sarah Wilson", email: "sarah@example.com", points: 35, exact_predictions: 5, hits: 9, accuracy: 60 },
        { id: 5, display_name: "David Brown", email: "david@example.com", points: 32, exact_predictions: 4, hits: 8, accuracy: 55 }
      ],
      standings: [
        { rank: 1, user_id: 1, display_name: "John Doe", points: 45, exact_predictions: 8, hits: 12, accuracy: 75 },
        { rank: 2, user_id: 2, display_name: "Jane Smith", points: 42, exact_predictions: 7, hits: 11, accuracy: 68 },
        { rank: 3, user_id: 3, display_name: "Mike Johnson", points: 38, exact_predictions: 6, hits: 10, accuracy: 65 },
        { rank: 4, user_id: 4, display_name: "Sarah Wilson", points: 35, exact_predictions: 5, hits: 9, accuracy: 60 },
        { rank: 5, user_id: 5, display_name: "David Brown", points: 32, exact_predictions: 4, hits: 8, accuracy: 55 }
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

  const loadParticipantPredictions = async (participantId) => {
    try {
      const response = await axios.get(`${API_ENDPOINTS.USER_PREDICTIONS}/${participantId}`);
      
      if (response.data.success) {
        setParticipantPredictions(response.data.data);
      } else {
        // Fallback to mock data
        setParticipantPredictions(createMockUserPredictions());
      }
    } catch (error) {
      console.error('Error loading participant predictions:', error);
      // Fallback to mock data
      setParticipantPredictions(createMockUserPredictions());
    }
  };

  const createMockUserPredictions = () => {
    return [
      { fixture_id: 1, home_team: 'Arsenal', away_team: 'Chelsea', home_score: 2, away_score: 1, points: 3 },
      { fixture_id: 2, home_team: 'Liverpool', away_team: 'Manchester City', home_score: 1, away_score: 1, points: 1 },
      { fixture_id: 3, home_team: 'Tottenham', away_team: 'Newcastle', home_score: 3, away_score: 0, points: 3 },
      { fixture_id: 4, home_team: 'Brighton', away_team: 'Manchester United', home_score: 0, away_score: 2, points: 1 },
      { fixture_id: 5, home_team: 'Arsenal', away_team: 'Liverpool', home_score: 1, away_score: 2, points: 0 }
    ];
  };

  const handleParticipantClick = (participant) => {
    setSelectedParticipant(participant);
    loadParticipantPredictions(participant.id);
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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{league.name}</h1>
              <p className="text-gray-600">Code: {league.code} • {league.members?.length || 0} members</p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline">
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Standings Table */}
        <Card className="mb-8">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4">League Standings</h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Rank</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Player</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Points</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Exact</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Hits</th>
                    <th className="text-center py-3 px-4 font-medium text-gray-700">Accuracy</th>
                  </tr>
                </thead>
                <tbody>
                  {league.standings?.map((participant, index) => (
                    <tr 
                      key={participant.user_id} 
                      className="border-b hover:bg-gray-50 cursor-pointer"
                      onClick={() => handleParticipantClick(participant)}
                    >
                      <td className="py-3 px-4">
                        <Badge 
                          variant={participant.rank <= 3 ? "default" : "secondary"}
                          className={
                            participant.rank === 1 ? "bg-yellow-500" :
                            participant.rank === 2 ? "bg-gray-400" :
                            participant.rank === 3 ? "bg-orange-500" : ""
                          }
                        >
                          {participant.rank}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-medium">{participant.display_name}</td>
                      <td className="py-3 px-4 text-center font-semibold">{participant.points}</td>
                      <td className="py-3 px-4 text-center">{participant.exact_predictions}</td>
                      <td className="py-3 px-4 text-center">{participant.hits}</td>
                      <td className="py-3 px-4 text-center">{participant.accuracy}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        {/* Participant Details Modal */}
        {selectedParticipant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">{selectedParticipant.display_name}'s Predictions</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => setSelectedParticipant(null)}
                  >
                    Close
                  </Button>
                </div>
                
                <div className="space-y-4">
                  {participantPredictions.map((prediction, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium">{prediction.home_team} vs {prediction.away_team}</span>
                        <Badge variant={prediction.points > 0 ? "default" : "secondary"}>
                          {prediction.points} pts
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600">
                        Prediction: {prediction.home_score} - {prediction.away_score}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeaguePage;