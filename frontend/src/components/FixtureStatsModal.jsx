import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { TEAMS } from '../data/teams';
import './fixture-stats-modal.css';

const FixtureStatsModal = ({ isOpen, onClose, fixtureId, fixtureTitle }) => {
  const { user } = useAuth();
  const [fixture, setFixture] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (isOpen && fixtureId) {
      loadFixtureData();
    }
  }, [isOpen, fixtureId]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const loadFixtureData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.FIXTURES}/${fixtureId}`);
      
      if (response.data.success) {
        setFixture(response.data.fixture);
        // Placeholder stats - will be replaced with AI API data later
        setStats({
          homeTeam: {
            form: 'WWDLW',
            avgGoals: 2.1,
            avgConceded: 0.8,
            possession: 58,
            shots: 14.2,
            shotsOnTarget: 5.3
          },
          awayTeam: {
            form: 'LDWWL',
            avgGoals: 1.8,
            avgConceded: 1.2,
            possession: 42,
            shots: 11.5,
            shotsOnTarget: 4.1
          },
          headToHead: {
            homeWins: 12,
            draws: 8,
            awayWins: 10,
            lastMeeting: '2-1'
          },
          prediction: {
            homeWin: 45,
            draw: 28,
            awayWin: 27
          }
        });
      }
    } catch (error) {
      console.error('Error loading fixture:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCleanTeamName = (teamName) => {
    const nameMapping = {
      'Brighton & Hove Albion': 'Brighton',
      'Brighton & Hove Albion FC': 'Brighton',
      'Wolverhampton Wanderers': 'Wolves',
      'Wolverhampton Wanderers FC': 'Wolves',
      'AFC Bournemouth': 'Bournemouth',
      'Arsenal FC': 'Arsenal',
      'Aston Villa FC': 'Aston Villa',
      'Brentford FC': 'Brentford',
      'Burnley FC': 'Burnley',
      'Chelsea FC': 'Chelsea',
      'Crystal Palace FC': 'Crystal Palace',
      'Everton FC': 'Everton',
      'Fulham FC': 'Fulham',
      'Leeds United': 'Leeds',
      'Leeds United FC': 'Leeds',
      'Liverpool FC': 'Liverpool',
      'Manchester City FC': 'Manchester City',
      'Manchester United FC': 'Manchester United',
      'Newcastle United': 'Newcastle',
      'Newcastle United FC': 'Newcastle',
      'Nottingham Forest FC': 'Nottingham Forest',
      'Sunderland AFC': 'Sunderland',
      'Tottenham Hotspur': 'Tottenham',
      'Tottenham Hotspur FC': 'Tottenham',
      'West Ham United': 'West Ham',
      'West Ham United FC': 'West Ham'
    };
    return nameMapping[teamName] || teamName;
  };

  const getTeamLogo = (teamName) => {
    const cleanName = getCleanTeamName(teamName);
    const team = TEAMS.find(t => t.name === cleanName || t.name === teamName);
    return team?.logo || '';
  };

  if (!isOpen) return null;

  const homeTeamName = fixture ? getCleanTeamName(fixture.home_team_name) : '';
  const awayTeamName = fixture ? getCleanTeamName(fixture.away_team_name) : '';

  const modalContent = (
    <div className="fixture-stats-modal-overlay" onClick={onClose}>
      <div className="fixture-stats-modal" onClick={(e) => e.stopPropagation()}>
        <div className="fixture-stats-modal-header">
          <div className="fixture-stats-modal-title">
            <h2>Fixture Stats</h2>
            {fixtureTitle && <p>{fixtureTitle}</p>}
          </div>
          <button className="fixture-stats-modal-close" onClick={onClose}>
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="fixture-stats-modal-content">
          {loading ? (
            <div className="fixture-stats-loading">
              <div className="loading-spinner"></div>
              <p>Loading fixture stats...</p>
            </div>
          ) : !fixture ? (
            <div className="fixture-stats-error">
              <p>Fixture not found</p>
            </div>
          ) : (
            <>
              {/* Match Info Card */}
              <div className="fixture-stats-match-card">
                <div className="fixture-stats-teams">
                  <div className="fixture-stats-team">
                    <img src={getTeamLogo(fixture.home_team_name)} alt={homeTeamName} />
                    <span>{homeTeamName}</span>
                  </div>
                  <div className="fixture-stats-vs">
                    {fixture.status === 'FINISHED' ? (
                      <div className="fixture-stats-score">
                        <span>{fixture.home_score || 0}</span>
                        <span>-</span>
                        <span>{fixture.away_score || 0}</span>
                      </div>
                    ) : (
                      <span className="fixture-stats-time">
                        {fixture.scheduled_date ? new Date(fixture.scheduled_date).toLocaleDateString() : 'TBD'}
                      </span>
                    )}
                  </div>
                  <div className="fixture-stats-team">
                    <img src={getTeamLogo(fixture.away_team_name)} alt={awayTeamName} />
                    <span>{awayTeamName}</span>
                  </div>
                </div>
              </div>

              {/* Stats Sections */}
              {stats && (
                <div className="fixture-stats-content">
                  {/* Team Form */}
                  <div className="fixture-stats-section">
                    <h3 className="fixture-stats-section-title">
                      <span className="material-symbols-outlined">trending_up</span>
                      Recent Form
                    </h3>
                    <div className="fixture-stats-form-grid">
                      <div className="fixture-stats-form-card">
                        <div className="fixture-stats-form-team">
                          <img src={getTeamLogo(fixture.home_team_name)} alt={homeTeamName} />
                          <span>{homeTeamName}</span>
                        </div>
                        <div className="fixture-stats-form-badges">
                          {stats.homeTeam.form.split('').map((result, idx) => (
                            <span key={idx} className={`form-badge form-${result}`}>
                              {result}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="fixture-stats-form-card">
                        <div className="fixture-stats-form-team">
                          <img src={getTeamLogo(fixture.away_team_name)} alt={awayTeamName} />
                          <span>{awayTeamName}</span>
                        </div>
                        <div className="fixture-stats-form-badges">
                          {stats.awayTeam.form.split('').map((result, idx) => (
                            <span key={idx} className={`form-badge form-${result}`}>
                              {result}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Team Statistics */}
                  <div className="fixture-stats-section">
                    <h3 className="fixture-stats-section-title">
                      <span className="material-symbols-outlined">analytics</span>
                      Team Statistics
                    </h3>
                    <div className="fixture-stats-comparison-grid">
                      <div className="fixture-stats-stat-row">
                        <div className="fixture-stats-stat-item">
                          <span className="stat-label">Avg Goals</span>
                          <div className="stat-comparison">
                            <span className="stat-value">{stats.homeTeam.avgGoals}</span>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-home" 
                                style={{ width: `${(stats.homeTeam.avgGoals / 3) * 100}%` }}
                              ></div>
                            </div>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-away" 
                                style={{ width: `${(stats.awayTeam.avgGoals / 3) * 100}%` }}
                              ></div>
                            </div>
                            <span className="stat-value">{stats.awayTeam.avgGoals}</span>
                          </div>
                        </div>
                      </div>
                      <div className="fixture-stats-stat-row">
                        <div className="fixture-stats-stat-item">
                          <span className="stat-label">Avg Conceded</span>
                          <div className="stat-comparison">
                            <span className="stat-value">{stats.homeTeam.avgConceded}</span>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-home" 
                                style={{ width: `${(stats.homeTeam.avgConceded / 2) * 100}%` }}
                              ></div>
                            </div>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-away" 
                                style={{ width: `${(stats.awayTeam.avgConceded / 2) * 100}%` }}
                              ></div>
                            </div>
                            <span className="stat-value">{stats.awayTeam.avgConceded}</span>
                          </div>
                        </div>
                      </div>
                      <div className="fixture-stats-stat-row">
                        <div className="fixture-stats-stat-item">
                          <span className="stat-label">Possession</span>
                          <div className="stat-comparison">
                            <span className="stat-value">{stats.homeTeam.possession}%</span>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-home" 
                                style={{ width: `${stats.homeTeam.possession}%` }}
                              ></div>
                            </div>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-away" 
                                style={{ width: `${stats.awayTeam.possession}%` }}
                              ></div>
                            </div>
                            <span className="stat-value">{stats.awayTeam.possession}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="fixture-stats-stat-row">
                        <div className="fixture-stats-stat-item">
                          <span className="stat-label">Shots per Game</span>
                          <div className="stat-comparison">
                            <span className="stat-value">{stats.homeTeam.shots}</span>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-home" 
                                style={{ width: `${(stats.homeTeam.shots / 20) * 100}%` }}
                              ></div>
                            </div>
                            <div className="stat-bar">
                              <div 
                                className="stat-bar-fill stat-bar-away" 
                                style={{ width: `${(stats.awayTeam.shots / 20) * 100}%` }}
                              ></div>
                            </div>
                            <span className="stat-value">{stats.awayTeam.shots}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Head to Head */}
                  <div className="fixture-stats-section">
                    <h3 className="fixture-stats-section-title">
                      <span className="material-symbols-outlined">history</span>
                      Head to Head
                    </h3>
                    <div className="fixture-stats-h2h-card">
                      <div className="fixture-stats-h2h-stats">
                        <div className="h2h-stat">
                          <span className="h2h-value">{stats.headToHead.homeWins}</span>
                          <span className="h2h-label">{homeTeamName} Wins</span>
                        </div>
                        <div className="h2h-stat">
                          <span className="h2h-value">{stats.headToHead.draws}</span>
                          <span className="h2h-label">Draws</span>
                        </div>
                        <div className="h2h-stat">
                          <span className="h2h-value">{stats.headToHead.awayWins}</span>
                          <span className="h2h-label">{awayTeamName} Wins</span>
                        </div>
                      </div>
                      <div className="fixture-stats-last-meeting">
                        <span className="last-meeting-label">Last Meeting:</span>
                        <span className="last-meeting-score">{stats.headToHead.lastMeeting}</span>
                      </div>
                    </div>
                  </div>

                  {/* Prediction */}
                  <div className="fixture-stats-section">
                    <h3 className="fixture-stats-section-title">
                      <span className="material-symbols-outlined">psychology</span>
                      AI Prediction
                    </h3>
                    <div className="fixture-stats-prediction-card">
                      <div className="fixture-stats-prediction-bars">
                        <div className="prediction-bar-item">
                          <div className="prediction-bar-header">
                            <span>{homeTeamName} Win</span>
                            <span className="prediction-percentage">{stats.prediction.homeWin}%</span>
                          </div>
                          <div className="prediction-bar-container">
                            <div 
                              className="prediction-bar-fill prediction-home" 
                              style={{ width: `${stats.prediction.homeWin}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="prediction-bar-item">
                          <div className="prediction-bar-header">
                            <span>Draw</span>
                            <span className="prediction-percentage">{stats.prediction.draw}%</span>
                          </div>
                          <div className="prediction-bar-container">
                            <div 
                              className="prediction-bar-fill prediction-draw" 
                              style={{ width: `${stats.prediction.draw}%` }}
                            ></div>
                          </div>
                        </div>
                        <div className="prediction-bar-item">
                          <div className="prediction-bar-header">
                            <span>{awayTeamName} Win</span>
                            <span className="prediction-percentage">{stats.prediction.awayWin}%</span>
                          </div>
                          <div className="prediction-bar-container">
                            <div 
                              className="prediction-bar-fill prediction-away" 
                              style={{ width: `${stats.prediction.awayWin}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                      <div className="fixture-stats-ai-note">
                        <span className="material-symbols-outlined">info</span>
                        <span>AI-powered predictions will be available soon</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default FixtureStatsModal;

