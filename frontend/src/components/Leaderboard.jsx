import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const Leaderboard = ({ preloadedData }) => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState([]);
  const [userScores, setUserScores] = useState(null);
  const [loading, setLoading] = useState(false);
  // Hardcoded season - no need for state

  useEffect(() => {
    // Use preloaded data if available
    if (preloadedData?.leaderboard) {
      console.log('✅ Using preloaded leaderboard data');
      setLeaderboard(preloadedData.leaderboard);
    } else {
      fetchLeaderboard();
    }
    
    if (user) {
      fetchUserScores();
    }
  }, [user, preloadedData]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.LEADERBOARD}?limit=50`);
      const data = response.data;
      
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
      const response = await axios.get(API_ENDPOINTS.USER_SCORES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = response.data;
      
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

  // Remove the auth requirement - leaderboard is now public

  return (
    <div className="prediction-section">
      <div className="prediction-header">
        <h2 className="prediction-title">Leaderboard</h2>
        <p className="prediction-description">
          {user ? 'See how you rank against other players' : 'View the top players and their scores'}
        </p>
      </div>


      {/* Leaderboard */}
      <div className="leaderboard-full-width">
        <div className="leaderboard-header">
          <h3 className="leaderboard-title">2025/2026 Season Leaderboard</h3>
          <p className="leaderboard-subtitle">
            Showing top {leaderboard.length} players
          </p>
        </div>
        <div className="leaderboard-content">
          {loading ? (
            <div className="text-center py-8">
              <p>Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <p>No scores yet. Be the first to make predictions!</p>
            </div>
          ) : (
            <div className="leaderboard-table-container">
              <table className="leaderboard-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Player</th>
                    <th>Fixture</th>
                    <th>Table</th>
                    <th>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const position = index + 1;
                    const isCurrentUser = user && entry.user_id === user.id;
                    const displayName = entry.display_name || 
                                       entry.email?.split('@')[0] || 
                                       'Anonymous User';
                    
                    return (
                      <tr 
                        key={entry.id}
                        className={`leaderboard-row ${
                          isCurrentUser 
                            ? 'current-user-row' 
                            : position <= 3 
                              ? 'top-three-row' 
                              : ''
                        }`}
                      >
                        <td className="leaderboard-position">
                          <span className={`position-icon ${getRankColor(position)}`}>
                            {getRankIcon(position)}
                          </span>
                        </td>
                        <td className="leaderboard-player">
                          <span className={`player-name ${isCurrentUser ? 'current-user' : ''}`}>
                            {displayName}
                          </span>
                        </td>
                        <td className="leaderboard-fixture">
                          {entry.fixture_points || 0}
                        </td>
                        <td className="leaderboard-table">
                          {entry.table_points || 0}
                        </td>
                        <td className="leaderboard-total">
                          <strong>{entry.total_points || 0}</strong>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export { Leaderboard };
