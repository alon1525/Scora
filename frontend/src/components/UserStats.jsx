import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const UserStats = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`${API_ENDPOINTS.USER_STATS}/${user.id}`);
      
      if (response.data.success) {
        setUserStats(response.data.data);
      } else {
        setError('Failed to fetch user statistics');
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError('Error fetching user statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, refreshTrigger]);

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="user-stats-section">
        <Card className="user-stats-card">
          <CardHeader>
            <CardTitle className="text-center">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">Loading...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !userStats) {
    return (
      <div className="user-stats-section">
        <Card className="user-stats-card">
          <CardHeader>
            <CardTitle className="text-center">Your Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center text-muted-foreground">Unable to load stats</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getCountryFlag = (countryCode) => {
    const flags = {
      'GB': '🇬🇧',
      'US': '🇺🇸',
      'DE': '🇩🇪',
      'FR': '🇫🇷',
      'IT': '🇮🇹',
      'ES': '🇪🇸',
      'NL': '🇳🇱',
      'BE': '🇧🇪',
      'PL': '🇵🇱',
      'TR': '🇹🇷',
      'BR': '🇧🇷',
      'AR': '🇦🇷',
      'MX': '🇲🇽',
      'CA': '🇨🇦',
      'AU': '🇦🇺',
      'JP': '🇯🇵',
      'KR': '🇰🇷',
      'CN': '🇨🇳',
      'IN': '🇮🇳',
      'RU': '🇷🇺',
      'IL': '🇮🇱'
    };
    return flags[countryCode] || '🌍';
  };


  return (
    <div className="user-stats-section">
      <Card className="user-stats-card">
        <CardContent className="user-stats-content">
          <div className="user-profile">
            <div className="user-avatar">
              <div className="avatar-placeholder">
                <span className="avatar-initial">
                  {userStats.display_name?.charAt(0)?.toUpperCase() || userStats.email?.charAt(0)?.toUpperCase() || '?'}
                </span>
              </div>
            </div>
            <div className="user-name">
              {userStats.display_name || userStats.email?.split('@')[0] || 'Anonymous User'}
            </div>
          </div>

          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-label">PLAYED</div>
              <div className="stat-value">{userStats.total_predictions || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">EXACT</div>
              <div className="stat-value">{userStats.exact_predictions || 0}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">RESULT</div>
              <div className="stat-value">{userStats.result_predictions || 0}</div>
            </div>
            <div className="stat-item points">
              <div className="stat-label">POINTS</div>
              <div className="stat-value">{userStats.total_points || 0}</div>
            </div>
          </div>

          <div className="achievements-section">
            <div className="achievement-item">
              <div className="achievement-icon">🌍</div>
              <div className="achievement-text">
                {userStats.globalRank ? `${userStats.globalRank} / ${userStats.totalUsers || 0}` : '- / 0'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStats;
