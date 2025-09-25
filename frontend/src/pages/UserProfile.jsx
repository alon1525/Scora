import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Trophy, Target, Calendar, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import AchievementsGrid from "../components/AchievementsGrid";
import "./UserProfile.css";

// Team kit imports
import Arsenal from "../assets/Teams_Kits/Arsenal.png";
import Chelsea from "../assets/Teams_Kits/Chelsea.png";
import ManchesterCity from "../assets/Teams_Kits/Manchester_City.png";
import Liverpool from "../assets/Teams_Kits/Liverpool.png";
import Tottenham from "../assets/Teams_Kits/Tottenham.png";
import Newcastle from "../assets/Teams_Kits/Newcastle.png";
import Brighton from "../assets/Teams_Kits/Brighton.png";
import WestHam from "../assets/Teams_Kits/West_Ham.png";
import Everton from "../assets/Teams_Kits/Everton.png";
import Fulham from "../assets/Teams_Kits/Fulham.png";
import AstonVilla from "../assets/Teams_Kits/Aston_Villa.png";
import CrystalPalace from "../assets/Teams_Kits/Crystal_Palace.png";
import Brentford from "../assets/Teams_Kits/Brentford.png";
import NottinghamForest from "../assets/Teams_Kits/Nottingham_Forest.png";
import Wolves from "../assets/Teams_Kits/Wolves.png";
import Burnley from "../assets/Teams_Kits/Burnley.png";
import Bournemouth from "../assets/Teams_Kits/Bournemouth.png";
import LeedsUnited from "../assets/Teams_Kits/Leeds_United.png";
import ManchesterUnited from "../assets/Teams_Kits/Manchester_United.png";
import Sunderland from "../assets/Teams_Kits/Sunderland.png";

// Mock data interfaces and data
const mockPlayers = [
  { id: "1", name: "Alex Johnson", points: 1247, accuracy: 68, predictions: 156, streak: 4 },
  { id: "2", name: "Sarah Chen", points: 1156, accuracy: 71, predictions: 143, streak: 2 },
  { id: "3", name: "Mike Rodriguez", points: 1098, accuracy: 64, predictions: 178, streak: 1 },
  { id: "4", name: "Emma Thompson", points: 1034, accuracy: 69, predictions: 134, streak: 3 },
  { id: "5", name: "David Kim", points: 987, accuracy: 62, predictions: 167, streak: 0 },
];

const mockPredictions = [
  {
    id: "1",
    playerId: "1",
    homeTeam: "Arsenal",
    awayTeam: "Chelsea",
    predictedScore: "2-1",
    actualScore: "2-1",
    matchDate: "2024-03-15",
    correct: true,
    result: "2-1",
    points: 5
  },
  {
    id: "2",
    playerId: "1", 
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    predictedScore: "3-2",
    actualScore: "1-1",
    matchDate: "2024-03-12",
    correct: false,
    result: "1-1",
    points: 0
  },
  {
    id: "3",
    playerId: "1",
    homeTeam: "Tottenham",
    awayTeam: "Newcastle", 
    predictedScore: "2-0",
    matchDate: "2024-03-20",
    correct: undefined,
    result: undefined,
    points: 0
  },
  {
    id: "4",
    playerId: "1",
    homeTeam: "Brighton",
    awayTeam: "West Ham",
    predictedScore: "1-2",
    actualScore: "1-2",
    matchDate: "2024-03-08",
    correct: true,
    result: "1-2", 
    points: 5
  }
];

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [player, setPlayer] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedWeek, setSelectedWeek] = useState('all');
  const [availableWeeks, setAvailableWeeks] = useState([]);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadFixtures();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      console.log('🔍 Loading profile for user ID:', userId);
      
      // Use the same API endpoint that the leaderboard uses to get all users
      console.log('🔄 Fetching all users via leaderboard API...');
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/predictions/leaderboard?limit=100`);
      const data = await response.json();
      
      if (data.success && data.leaderboard) {
        console.log('📊 All users from leaderboard API:', data.leaderboard);
        console.log('📊 Available user IDs:', data.leaderboard.map(u => ({ 
          id: u.id, 
          user_id: u.user_id, 
          name: u.display_name,
          email: u.email 
        })));
        
        // Find the user in the leaderboard data
        const userProfile = data.leaderboard.find(user => user.user_id === userId);
        
        if (userProfile) {
          console.log('✅ User found in leaderboard data:', userProfile);
          const transformedPlayer = {
            id: userProfile.user_id,
            name: userProfile.display_name || 'Unknown Player',
            points: userProfile.total_points || 0,
            accuracy: 0,
            predictions: 0,
            exacts: userProfile.exact_predictions || 0,
            results: userProfile.result_predictions || 0,
            streak: 0
          };

          setPlayer(transformedPlayer);
          await loadPlayerPredictions(userProfile.fixture_predictions);
          return;
        } else {
          console.log('❌ User not found in leaderboard data');
          console.log('🔍 Available user IDs:', data.leaderboard.map(u => ({ id: u.id, user_id: u.user_id, name: u.display_name })));
        toast.error('User not found');
        return;
      }
      } else {
        console.error('❌ Failed to fetch leaderboard data:', data);
        toast.error('Failed to load user data');
        return;
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadPlayerPredictions = async (fixturePredictions) => {
    try {
      // Get all finished fixtures with matchday information
      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, home_team_logo, away_team_logo, home_score, away_score, status, scheduled_date, matchday')
        .in('status', ['FINISHED', 'IN_PLAY', 'PAUSED', 'STARTED'])
        .order('matchday', { ascending: false })
        .order('scheduled_date', { ascending: false })
        .limit(100); // Get more fixtures to find predictions

      if (fixturesError) {
        console.error('Error loading fixtures:', fixturesError);
        return;
      }

      if (!fixturesData || fixturesData.length === 0) {
        console.log('No finished fixtures found');
        return;
      }

      // Group fixtures by matchday
      const fixturesByMatchday = {};
      fixturesData.forEach(fixture => {
        const matchday = fixture.matchday || 'Unknown Matchday';
        if (!fixturesByMatchday[matchday]) {
          fixturesByMatchday[matchday] = [];
        }
        fixturesByMatchday[matchday].push(fixture);
      });

      // Create cards for all finished fixtures, with or without predictions
      const predictionsArray = [];
      
      // Process each matchday
      Object.keys(fixturesByMatchday).sort((a, b) => parseInt(b) - parseInt(a)).forEach(matchday => {
        fixturesByMatchday[matchday].forEach(fixture => {
          // Try both string and number keys for fixture ID
          const prediction = fixturePredictions ? 
            (fixturePredictions[fixture.id.toString()] || fixturePredictions[fixture.id]) : null;
          const actualScore = `${fixture.home_score}-${fixture.away_score}`;
          
          // Debug logging for user ID 1
          if (userId === '1' && fixture.id <= 5) {
            console.log(`Fixture ${fixture.id}:`, {
              fixtureId: fixture.id,
              fixtureIdString: fixture.id.toString(),
              hasPrediction: !!prediction,
              prediction: prediction,
              fixturePredictionsKeys: fixturePredictions ? Object.keys(fixturePredictions) : 'null'
            });
          }
          
          if (prediction) {
            // Player made a prediction
            const predictedScore = `${prediction.home_score}-${prediction.away_score}`;
            
            // Determine if it's exact or result prediction
            const isExact = predictedScore === actualScore;
            const isResult = !isExact && (
              (prediction.home_score > prediction.away_score && fixture.home_score > fixture.away_score) ||
              (prediction.home_score < prediction.away_score && fixture.home_score < fixture.away_score) ||
              (prediction.home_score === prediction.away_score && fixture.home_score === fixture.away_score)
            );
            
            // Calculate points (exact = 3, result = 1)
            let points = 0;
            if (isExact) {
              points = 3; // Exact prediction points
            } else if (isResult) {
              points = 1; // Result prediction points
            }

            predictionsArray.push({
              id: fixture.id,
              playerId: userId,
              homeTeam: fixture.home_team_name,
              awayTeam: fixture.away_team_name,
              predictedScore: predictedScore,
              actualScore: actualScore,
              points: points,
              correct: isExact || isResult,
              isExact: isExact,
              isResult: isResult,
              matchDate: fixture.scheduled_date,
              week: matchday,
              result: actualScore,
              hasPrediction: true
            });
          } else {
            // Player didn't make a prediction
            predictionsArray.push({
              id: fixture.id,
              playerId: userId,
              homeTeam: fixture.home_team_name,
              awayTeam: fixture.away_team_name,
              predictedScore: "",
              actualScore: actualScore,
              points: 0,
              correct: false,
              isExact: false,
              isResult: false,
              matchDate: fixture.scheduled_date,
              week: matchday,
              result: actualScore,
              hasPrediction: false
            });
          }
        });
      });

      setPredictions(predictionsArray);
      
      // Extract available matchdays for filtering
      const matchdays = [...new Set(predictionsArray.map(p => p.week))].sort((a, b) => parseInt(b) - parseInt(a));
      setAvailableWeeks(matchdays);
      
      // Set default to current/latest matchweek
      if (matchdays.length > 0) {
        setSelectedWeek(matchdays[0]); // First matchday (most recent)
      }
      
      // Debug: Log team names to see what we're getting from database
      const uniqueTeams = [...new Set(predictionsArray.flatMap(p => [p.homeTeam, p.awayTeam]))];
      console.log('Team names from database:', uniqueTeams);
      
      console.log(`Loaded ${predictionsArray.length} fixtures for player ${userId} (${predictionsArray.filter(p => p.hasPrediction).length} with predictions)`);
      
      // Calculate actual stats from predictions
      const totalPredictions = predictionsArray.filter(p => p.hasPrediction).length;
      const exactPredictions = predictionsArray.filter(p => p.isExact).length;
      const resultPredictions = predictionsArray.filter(p => p.isResult).length;
      const correctPredictions = exactPredictions + resultPredictions;
      const accuracy = totalPredictions > 0 ? Math.round((correctPredictions / totalPredictions) * 100) : 0;
      
      // Update player stats
      setPlayer(prev => ({
        ...prev,
        predictions: totalPredictions,
        accuracy: accuracy,
        exacts: exactPredictions,
        results: resultPredictions
      }));
      
    } catch (error) {
      console.error('Error loading player predictions:', error);
    }
  };

  const loadFixtures = async () => {
    try {
      // Get finished fixtures to match with predictions
      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, home_score, away_score, status')
        .eq('status', 'FINISHED')
        .limit(20);

      if (fixturesError) {
        console.error('Error loading fixtures:', fixturesError);
        return;
      }

      setFixtures(fixturesData || []);
      
      // Update predictions with team names from fixtures
      if (fixturesData && predictions.length > 0) {
        const updatedPredictions = predictions.map(prediction => {
          const fixture = fixturesData.find(f => f.id === prediction.id);
          if (fixture) {
            return {
              ...prediction,
              homeTeam: fixture.home_team_name,
              awayTeam: fixture.away_team_name,
              actualScore: `${fixture.home_score}-${fixture.away_score}`,
              correct: prediction.predictedScore === `${fixture.home_score}-${fixture.away_score}`
            };
          }
          return prediction;
        });
        setPredictions(updatedPredictions);
      }
    } catch (error) {
      console.error('Error loading fixtures:', error);
    }
  };

  const getTeamLogo = (teamName) => {
    // First clean the team name to get the short name (same as fixtures tab)
    const getCleanTeamName = (teamName) => {
      const nameMapping = {
        // Brighton variations
        'Brighton & Hove Albion': 'Brighton',
        'Brighton & Hove Albion FC': 'Brighton',
        'Brighton': 'Brighton',
        
        // Wolves variations
        'Wolverhampton Wanderers': 'Wolves',
        'Wolverhampton Wanderers FC': 'Wolves',
        'Wolves': 'Wolves',
        'Wolverhampton': 'Wolves',
        
        // AFC Bournemouth
        'AFC Bournemouth': 'Bournemouth',
        'Bournemouth': 'Bournemouth',
        
        // Arsenal
        'Arsenal FC': 'Arsenal',
        'Arsenal': 'Arsenal',
        
        // Aston Villa
        'Aston Villa FC': 'Aston Villa',
        'Aston Villa': 'Aston Villa',
        
        // Brentford
        'Brentford FC': 'Brentford',
        'Brentford': 'Brentford',
        
        // Burnley
        'Burnley FC': 'Burnley',
        'Burnley': 'Burnley',
        
        // Chelsea
        'Chelsea FC': 'Chelsea',
        'Chelsea': 'Chelsea',
        
        // Crystal Palace
        'Crystal Palace FC': 'Crystal Palace',
        'Crystal Palace': 'Crystal Palace',
        
        // Everton
        'Everton FC': 'Everton',
        'Everton': 'Everton',
        
        // Fulham
        'Fulham FC': 'Fulham',
        'Fulham': 'Fulham',
        
        // Leeds
        'Leeds United': 'Leeds',
        'Leeds United FC': 'Leeds',
        'Leeds': 'Leeds',
        
        // Liverpool
        'Liverpool FC': 'Liverpool',
        'Liverpool': 'Liverpool',
        
        // Manchester City
        'Manchester City FC': 'Manchester City',
        'Manchester City': 'Manchester City',
        
        // Manchester United
        'Manchester United FC': 'Manchester United',
        'Manchester United': 'Manchester United',
        
        // Newcastle
        'Newcastle United': 'Newcastle',
        'Newcastle United FC': 'Newcastle',
        'Newcastle': 'Newcastle',
        
        // Nottingham Forest
        'Nottingham Forest FC': 'Nottingham Forest',
        'Nottingham Forest': 'Nottingham Forest',
        'Nottingham': 'Nottingham Forest',
        
        // Sunderland
        'Sunderland AFC': 'Sunderland',
        'Sunderland FC': 'Sunderland',
        'Sunderland': 'Sunderland',
        
        // Tottenham
        'Tottenham Hotspur': 'Tottenham',
        'Tottenham Hotspur FC': 'Tottenham',
        'Tottenham': 'Tottenham',
        
        // West Ham
        'West Ham United': 'West Ham',
        'West Ham United FC': 'West Ham',
        'West Ham': 'West Ham'
      };
      
      return nameMapping[teamName] || teamName;
    };

    // Get the clean short name
    const cleanTeamName = getCleanTeamName(teamName);
    
    // Map clean team names to imported kit files
    const teamLogoMap = {
      "Arsenal": Arsenal,
      "Chelsea": Chelsea,
      "Manchester City": ManchesterCity,
      "Liverpool": Liverpool,
      "Tottenham": Tottenham,
      "Newcastle": Newcastle,
      "Brighton": Brighton,
      "West Ham": WestHam,
      "Everton": Everton,
      "Fulham": Fulham,
      "Aston Villa": AstonVilla,
      "Crystal Palace": CrystalPalace,
      "Brentford": Brentford,
      "Nottingham Forest": NottinghamForest,
      "Wolves": Wolves,
      "Burnley": Burnley,
      "Bournemouth": Bournemouth,
      "Leeds": LeedsUnited,
      "Manchester United": ManchesterUnited,
      "Sunderland": Sunderland
    };
    
    return teamLogoMap[cleanTeamName] || Arsenal;
  };

  // Use real data from database
  const currentPlayer = player;
  
  // Filter predictions by selected week
  const currentPredictions = selectedWeek === 'all' 
    ? predictions.filter(p => availableWeeks.slice(0, Math.min(3, availableWeeks.length)).includes(p.week)) // Up to 3 matchdays, or all if less than 3
    : predictions.filter(p => p.week === selectedWeek);

  const correctPredictions = currentPredictions.filter(p => p.correct);
  const totalPoints = correctPredictions.reduce((sum, p) => sum + p.points, 0);

  if (loading) {
    return (
      <div className="user-profile-loading">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading user profile...</p>
      </div>
    );
  }

  if (!currentPlayer) {
    return (
      <div className="user-profile-error">
        <h1 className="error-title">Player not found</h1>
        <button onClick={() => navigate("/dashboard")} className="back-button">
            Go back
        </button>
      </div>
    );
  }

  return (
    <div className="user-profile-container">
      <div className="user-profile-content">
        {/* Header */}
        <div className="user-profile-header">
          <button 
            className="back-button-ghost"
            onClick={() => navigate("/dashboard")}
          >
            <ArrowLeft className="back-icon" />
          </button>
          <div className="header-content">
            <h1 className="player-name">
              {currentPlayer.name}
            </h1>
            <p className="player-subtitle">
              Player Profile & Statistics
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="stats-grid">
          <div className="stat-card stat-card-points">
            <div className="stat-content">
              <div className="stat-value">{currentPlayer.points}</div>
              <div className="stat-icon-text">
                <span className="material-symbols-outlined stat-icon">emoji_events</span>
                <span className="stat-text">Points</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card stat-card-accuracy">
            <div className="stat-content">
              <div className="stat-value">{currentPlayer.accuracy}%</div>
              <div className="stat-icon-text">
                <span className="material-symbols-outlined stat-icon">target</span>
                <span className="stat-text">Accuracy</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card stat-card-predictions">
            <div className="stat-content">
              <div className="stat-value">{currentPlayer.predictions}</div>
              <div className="stat-icon-text">
                <span className="material-symbols-outlined stat-icon">assignment</span>
                <span className="stat-text">Guesses</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card stat-card-exacts">
            <div className="stat-content">
              <div className="stat-value">{currentPlayer.exacts}</div>
              <div className="stat-icon-text">
                <span className="material-symbols-outlined stat-icon">check_circle</span>
                <span className="stat-text">Exacts</span>
              </div>
            </div>
          </div>
          
          <div className="stat-card stat-card-results">
            <div className="stat-content">
              <div className="stat-value">{currentPlayer.results}</div>
              <div className="stat-icon-text">
                <span className="material-symbols-outlined stat-icon">radio_button_unchecked</span>
                <span className="stat-text">Results</span>
              </div>
            </div>
          </div>
        </div>

        {/* Achievements Section */}
        <AchievementsGrid 
          userAchievements={currentPlayer.achievements || []}
          allAchievements={[]}
        />

        {/* Predictions History */}
        <div className="predictions-card">
          <div className="predictions-header">
            <div className="predictions-title">
              <div className="title-icon">
                <Calendar className="calendar-icon" />
              </div>
              Recent Predictions
            </div>
            <div className="week-selector">
              <label htmlFor="week-select" className="week-label">Week:</label>
              <select 
                id="week-select"
                value={selectedWeek} 
                onChange={(e) => setSelectedWeek(e.target.value)}
                className="week-dropdown"
              >
                <option value="all">All Matchdays</option>
                {availableWeeks.map(week => (
                  <option key={week} value={week}>Matchday {week}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="predictions-content">
            <div className="predictions-list">
              {currentPredictions.map((prediction, index) => (
                <div
                  key={prediction.id}
                  className="prediction-item"
                  style={{ animationDelay: `${0.4 + index * 0.1}s` }}
                >
                  {/* Mobile Layout */}
                  <div className="prediction-mobile">
                    <div className="prediction-mobile-header">
                      <div className="prediction-status">
                        {!prediction.hasPrediction ? (
                          <span className="material-symbols-outlined status-icon status-no-prediction">help_outline</span>
                        ) : prediction.correct ? (
                          <CheckCircle className="status-icon status-correct" />
                        ) : prediction.result ? (
                          <XCircle className="status-icon status-incorrect" />
                        ) : (
                          <Calendar className="status-icon status-pending" />
                        )}
                        <span className="predicted-score">
                          {prediction.hasPrediction ? prediction.predictedScore : ''}
                        </span>
                      </div>
                      <div className="prediction-badge-container">
                        {!prediction.hasPrediction ? (
                          <div className="prediction-badge prediction-badge-no-prediction">
                            NO PREDICTION
                          </div>
                        ) : prediction.correct ? (
                          <div className={`prediction-badge ${prediction.isExact ? 'prediction-badge-exact' : 'prediction-badge-result'}`}>
                            {prediction.isExact ? 'EXACT' : 'RESULT'} +{prediction.points}pts
                          </div>
                        ) : prediction.result && !prediction.correct ? (
                          <div className="prediction-badge prediction-badge-incorrect">
                            INCORRECT
                          </div>
                        ) : (
                          <div className="prediction-badge prediction-badge-pending">
                            PENDING
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="prediction-teams-mobile">
                      <div className="team-row">
                        <span className="team-name">{prediction.homeTeam}</span>
                        <img 
                          src={getTeamLogo(prediction.homeTeam)} 
                          alt={prediction.homeTeam}
                          className="team-logo"
                        />
                      </div>
                      <div className="team-row">
                        <span className="team-name">{prediction.awayTeam}</span>
                        <img 
                          src={getTeamLogo(prediction.awayTeam)} 
                          alt={prediction.awayTeam}
                          className="team-logo"
                        />
        </div>
      </div>
        </div>
                  
                  {/* Desktop Layout */}
                  <div className="prediction-desktop">
                    <div className="prediction-status-desktop">
                      {!prediction.hasPrediction ? (
                        <span className="material-symbols-outlined status-icon-desktop status-no-prediction">help_outline</span>
                      ) : prediction.correct ? (
                        <CheckCircle className="status-icon-desktop status-correct" />
                      ) : prediction.result ? (
                        <XCircle className="status-icon-desktop status-incorrect" />
                      ) : (
                        <Calendar className="status-icon-desktop status-pending" />
                      )}
        </div>
                    
                    <div className="prediction-teams-desktop">
                      <div className="team-section">
                        <div className="team-info">
                          <span className="team-name-desktop">{prediction.homeTeam}</span>
                          <img 
                            src={getTeamLogo(prediction.homeTeam)} 
                            alt={prediction.homeTeam}
                            className="team-logo-desktop"
                          />
        </div>
      </div>
                      
                      <div className="score-section">
                        <span className="predicted-score-desktop">
                          {prediction.hasPrediction ? prediction.predictedScore : ''}
                        </span>
                        <div className="prediction-badge-container-desktop">
                          {!prediction.hasPrediction ? (
                            <div className="prediction-badge prediction-badge-no-prediction">
                              NO PREDICTION
                            </div>
                          ) : prediction.correct ? (
                            <div className={`prediction-badge ${prediction.isExact ? 'prediction-badge-exact' : 'prediction-badge-result'}`}>
                              {prediction.isExact ? 'EXACT' : 'RESULT'} +{prediction.points} pts
                            </div>
                          ) : prediction.result && !prediction.correct ? (
                            <div className="prediction-badge prediction-badge-incorrect">
                              INCORRECT 0 pts
                            </div>
                          ) : (
                            <div className="prediction-badge prediction-badge-pending">
                              PENDING
                            </div>
                          )}
        </div>
      </div>

                      <div className="team-section">
                        <div className="team-info">
                          <span className="team-name-desktop">{prediction.awayTeam}</span>
                          <img 
                            src={getTeamLogo(prediction.awayTeam)} 
                            alt={prediction.awayTeam}
                            className="team-logo-desktop"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
