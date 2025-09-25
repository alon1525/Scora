import React from 'react';

const RecentBadges = ({ achievements = [], totalAchievements = 0 }) => {
  const recentBadges = achievements.slice(0, 3);
  const placeholderCount = 3 - recentBadges.length;
  const totalAvailableAchievements = 4; // Total number of achievements available

  return (
    <div className="recent-badges">
      <div className="badges-container">
        {recentBadges.map((achievement, index) => (
          <div key={index} className="badge-item unlocked">
            <span className="material-symbols-outlined">
              {achievement.icon}
            </span>
            <div className="badge-tooltip">
              {achievement.name}
            </div>
          </div>
        ))}
        {Array.from({ length: placeholderCount }).map((_, index) => (
          <div key={`placeholder-${index}`} className="badge-item locked">
            <span className="material-symbols-outlined">lock</span>
          </div>
        ))}
      </div>
      <div className="badge-counter">
        {totalAchievements}/{totalAvailableAchievements} Achievements
      </div>
    </div>
  );
};

export default RecentBadges;
