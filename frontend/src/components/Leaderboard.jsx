import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const Leaderboard = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userScores, setUserScores] = useState(null);
  const [loading, setLoading] = useState(false);
  // Hardcoded season - no need for state

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchUserScores();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/predictions/leaderboard?limit=50`);
      const data = await response.json();
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
      } else {
        console.error('Failed to fetch leaderboard:', data.error);
      }
    } catch (error) {
      console.error('Error fetching leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserScores = async () => {
    if (!user) return;

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(`http://localhost:3001/api/predictions/scores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        setUserScores(data.scores);
      }
    } catch (error) {
      console.error('Error fetching user scores:', error);
    }
  };

  const getRankIcon = (position) => {
    if (position === 1) return '🥇';
    if (position === 2) return '🥈';
    if (position === 3) return '🥉';
    return `#${position}`;
  };

  const getRankColor = (position) => {
    if (position === 1) return 'text-yellow-500';
    if (position === 2) return 'text-gray-400';
    if (position === 3) return 'text-orange-500';
    return 'text-gray-600';
  };

  if (!user) {
    return (
      <div className="prediction-section">
        <div className="prediction-header">
          <h2 className="prediction-title">Leaderboard</h2>
          <p className="prediction-description">
            Please sign in to view the leaderboard
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-section">
      <div className="prediction-header">
        <h2 className="prediction-title">Leaderboard</h2>
        <p className="prediction-description">
          See how you rank against other players
        </p>
      </div>


      {/* Leaderboard */}
      <div className="prediction-card">
        <CardHeader>
          <CardTitle className="text-center">2025/2026 Season Leaderboard</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p>No scores yet. Be the first to make predictions!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {leaderboard.map((entry, index) => {
                const position = index + 1;
                const isCurrentUser = entry.user_id === user?.id;
                
                return (
                  <div
                    key={entry.id}
                    className={`leaderboard-entry ${isCurrentUser ? 'current-user' : ''}`}
                  >
                    <div className="flex items-center justify-between p-4 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`text-2xl font-bold ${getRankColor(position)}`}>
                          {getRankIcon(position)}
                        </div>
                        <div>
                          <div className="font-semibold">
                            {entry.user?.raw_user_meta_data?.username || 
                             entry.user?.email?.split('@')[0] || 
                             'Anonymous User'}
                            {isCurrentUser && (
                              <Badge className="ml-2 bg-blue-500">You</Badge>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {entry.fixture_points} fixture + {entry.table_points} table
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-purple-500">
                          {entry.total_points}
                        </div>
                        <div className="text-sm text-gray-600">points</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </div>
    </div>
  );
};

export { Leaderboard };
