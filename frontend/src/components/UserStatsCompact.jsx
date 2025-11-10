import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import RecentBadges from './RecentBadges';

const UserStatsCompact = ({ refreshTrigger, preloadedData }) => {
  const { user } = useAuth();
  // Initialize with preloaded data if available immediately
  const [userStats, setUserStats] = useState(() => {
    // Try to get preloaded data on initial render
    return preloadedData?.userStats || null;
  });
  const [loading, setLoading] = useState(() => {
    // Only show loading if we don't have preloaded data
    return !preloadedData?.userStats;
  });
  const hasLoaded = useRef(false);
  const lastUserStatsRef = useRef(null); // Track last loaded stats to prevent resets

  const fetchUserStats = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const response = await axios.get(`${API_ENDPOINTS.USER_STATS}/${user.id}`);
      
      if (response.data.success) {
        const stats = response.data.data;
        setUserStats(stats);
        lastUserStatsRef.current = stats; // Store loaded stats
        setLoading(false);
      }
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && !hasLoaded.current) {
      // Use preloaded data if available
      if (preloadedData?.userStats) {
        console.log('✅ Using preloaded user stats data for compact view');
        setUserStats(preloadedData.userStats);
        lastUserStatsRef.current = preloadedData.userStats;
        setLoading(false);
        hasLoaded.current = true;
      } else if (preloadedData?.loading === false) {
        // Only fetch if preloaded data has finished loading and userStats weren't included
        hasLoaded.current = true;
        fetchUserStats();
      }
      // If preloadedData.loading is true, wait for it to finish
    }
  }, [user, preloadedData?.userStats, preloadedData?.loading]);

  // Update stats when preloaded data becomes available (but don't reset if we already have stats)
  useEffect(() => {
    if (preloadedData?.userStats && !lastUserStatsRef.current) {
      setUserStats(preloadedData.userStats);
      lastUserStatsRef.current = preloadedData.userStats;
      setLoading(false);
    }
  }, [preloadedData?.userStats]);

  // Separate effect for refresh trigger - only refetch on explicit refresh
  useEffect(() => {
    if (user && refreshTrigger && refreshTrigger > 0) {
      fetchUserStats();
    }
  }, [refreshTrigger]);

  // Use the ref to prevent showing 0 0 0 if we've ever had stats
  // This prevents the flash of empty state after stats have loaded
  const displayStats = userStats || lastUserStatsRef.current;
  const isLoading = !user || (loading && !displayStats);
  
  return (
    <div className="user-stats-compact" style={{ opacity: isLoading ? 0.6 : 1 }}>
      <div className="user-stats-content-compact">
        {isLoading || !displayStats ? (
          <>
            <div className="user-name-small">Loading...</div>
            <div className="stats-row-compact">
              <span data-label="Rank" data-value="#-"></span>
              <span data-label="Exacts" data-value="0"></span>
              <span data-label="Points" data-value="0" className="points-compact"></span>
            </div>
            <div className="global-rank-compact">🌍 - / 0</div>
          </>
        ) : (
          <>
            <div className="user-name-small">
              {displayStats.display_name || displayStats.email?.split('@')[0] || 'Anonymous User'}
            </div>
            <div className="stats-row-compact">
              <span data-label="Rank" data-value={`#${displayStats.globalRank || '-'}`}></span>
              <span data-label="Exacts" data-value={displayStats.exact_predictions || 0}></span>
              <span data-label="Points" data-value={displayStats.total_points || 0} className="points-compact"></span>
            </div>
            <div className="global-rank-compact">
              🌍 {displayStats.globalRank ? `${displayStats.globalRank} / ${displayStats.totalUsers || 0}` : '- / 0'}
            </div>
            {/* Recent Badges */}
            <RecentBadges 
              achievements={displayStats.achievements || []}
              totalAchievements={displayStats.achievements?.length || 0}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default UserStatsCompact;
