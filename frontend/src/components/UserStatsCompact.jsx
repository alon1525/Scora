import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import RecentBadges from './RecentBadges';

const UserStatsCompact = ({ refreshTrigger, preloadedData }) => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const hasLoaded = useRef(false);

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
    if (user && !hasLoaded.current) {
      // Use preloaded data if available
      if (preloadedData?.userStats) {
        console.log('✅ Using preloaded user stats data for compact view');
        setUserStats(preloadedData.userStats);
        setLoading(false);
        hasLoaded.current = true;
      } else if (preloadedData?.loading === false) {
        // Only fetch if preloaded data has finished loading and userStats weren't included
        hasLoaded.current = true;
        fetchUserStats();
      }
      // If preloadedData.loading is true, wait for it to finish
    }
  }, [user, preloadedData]);

  // Separate effect for refresh trigger - only refetch on explicit refresh
  useEffect(() => {
    if (user && refreshTrigger) {
      hasLoaded.current = false; // Reset flag to allow refetch
      fetchUserStats();
    }
  }, [refreshTrigger]);

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
      
      {/* Recent Badges */}
      <RecentBadges 
        achievements={userStats.achievements || []}
        totalAchievements={userStats.achievements?.length || 0}
      />
    </div>
  );
};

export default UserStatsCompact;
