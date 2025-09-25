import React from 'react';

const AchievementsGrid = ({ userAchievements = [], allAchievements = [] }) => {
  const getAchievementStatus = (achievementId) => {
    const userAchievement = userAchievements.find(ua => ua.id === achievementId);
    return userAchievement ? 'unlocked' : 'locked';
  };

  const getProgress = (achievementId) => {
    const userAchievement = userAchievements.find(ua => ua.id === achievementId);
    return userAchievement?.progress || 0;
  };

  // If no achievements defined, use sample ones
  const achievements = allAchievements.length > 0 ? allAchievements : [
    {
      id: 1,
      name: "Rookie Predictor",
      description: "Made your first prediction",
      icon: "emoji_events",
      criteria: { type: "first_prediction", count: 1 },
      points: 10
    },
    {
      id: 2,
      name: "Precision Master",
      description: "Achieved 10 exact predictions",
      icon: "target",
      criteria: { type: "exact_predictions", count: 10 },
      points: 50
    },
    {
      id: 3,
      name: "Result King",
      description: "Got 15 result predictions correct",
      icon: "trending_up",
      criteria: { type: "result_predictions", count: 15 },
      points: 75
    },
    {
      id: 4,
      name: "Bullseye",
      description: "Got your first exact prediction",
      icon: "star",
      criteria: { type: "first_exact", count: 1 },
      points: 25
    }
  ];

  const unlockedCount = userAchievements.length;
  const totalCount = achievements.length;

  return (
    <div className="achievements-grid">
      <div className="achievements-header">
        <div className="achievements-title-section">
          <h3>🏆 Achievements</h3>
          <div className="achievements-counter">
            {unlockedCount}/{totalCount}
          </div>
        </div>
        <div className="achievements-progress">
          <div className="progress-bar-container">
            <div 
              className="progress-bar-fill" 
              style={{ width: `${(unlockedCount / totalCount) * 100}%` }}
            />
          </div>
          <span className="progress-text">{unlockedCount}/{totalCount}</span>
        </div>
      </div>
      <div className="achievements-container">
        {achievements.map(achievement => {
          const status = getAchievementStatus(achievement.id);
          const progress = getProgress(achievement.id);
          const isUnlocked = status === 'unlocked';
          
          return (
            <div 
              key={achievement.id} 
              className={`achievement-item ${status}`}
              title={isUnlocked ? achievement.description : `Locked: ${achievement.description}`}
            >
              <div className="achievement-icon">
                <span className="material-symbols-outlined">
                  {isUnlocked ? achievement.icon : 'lock'}
                </span>
              </div>
              <div className="achievement-info">
                <h4>{achievement.name}</h4>
                <p>{achievement.description}</p>
                {!isUnlocked && progress > 0 && (
                  <div className="progress-bar">
                    <div 
                      className="progress-fill" 
                      style={{ width: `${(progress / achievement.criteria.count) * 100}%` }}
                    />
                    <span className="progress-text">
                      {progress}/{achievement.criteria.count}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AchievementsGrid;
