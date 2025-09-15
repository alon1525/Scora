import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

const UserStatsCompact = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await axios.get(`${API_ENDPOINTS.USER_STATS}/${user.id}`);
      
      if (response.data.success) {
        setUserStats(response.data.data);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchUserStats();
    }
  }, [user, refreshTrigger]);

  if (!user || loading || !userStats) {
    return (
      <div className="user-stats-compact">
        <div className="user-avatar-small">
          <div className="avatar-initial-small">?</div>
        </div>
        <div className="user-stats-content-compact">
          <div className="user-name-small">Loading...</div>
          <div className="stats-row-compact">
            <span data-label="Rank" data-value="#-"></span>
            <span data-label="Exacts" data-value="0"></span>
            <span data-label="Points" data-value="0" className="points-compact"></span>
          </div>
          <div className="global-rank-compact">🌍 - / 0</div>
        </div>
      </div>
    );
  }

  return (
    <div className="user-stats-compact">
      <div className="user-avatar-small">
        <div className="avatar-initial-small">
          {userStats.display_name?.charAt(0)?.toUpperCase() || userStats.email?.charAt(0)?.toUpperCase() || '?'}
        </div>
      </div>
      <div className="user-stats-content-compact">
        <div className="user-name-small">
          {userStats.display_name || userStats.email?.split('@')[0] || 'Anonymous User'}
        </div>
        <div className="stats-row-compact">
          <span data-label="Rank" data-value={`#${userStats.globalRank || '-'}`}></span>
          <span data-label="Exacts" data-value={userStats.exact_predictions || 0}></span>
          <span data-label="Points" data-value={userStats.total_points || 0} className="points-compact"></span>
        </div>
        <div className="global-rank-compact">
          🌍 {userStats.globalRank ? `${userStats.globalRank} / ${userStats.totalUsers || 0}` : '- / 0'}
        </div>
      </div>
    </div>
  );
};

export default UserStatsCompact;
