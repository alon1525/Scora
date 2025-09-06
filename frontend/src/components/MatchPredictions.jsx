import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import RoundNavigation from './RoundNavigation';

// Stadium data for Premier League teams (including common API variations)
const STADIUM_DATA = {
  // Original names
  'Arsenal': { stadium: 'Emirates Stadium', capacity: '60,704' },
  'Aston Villa': { stadium: 'Villa Park', capacity: '42,918' },
  'AFC Bournemouth': { stadium: 'Vitality Stadium', capacity: '11,307' },
  'Brentford': { stadium: 'Gtech (Brentford Community Stadium)', capacity: '17,250' },
  'Brighton & Hove Albion': { stadium: 'AMEX (Falmer) Stadium', capacity: '31,876' },
  'Burnley': { stadium: 'Turf Moor', capacity: '21,944' },
  'Chelsea': { stadium: 'Stamford Bridge', capacity: '40,173' },
  'Crystal Palace': { stadium: 'Selhurst Park', capacity: '25,194' },
  'Everton': { stadium: 'Everton Stadium (Hill Dickinson St.)', capacity: '52,769' },
  'Fulham': { stadium: 'Craven Cottage', capacity: '29,589' },
  'Leeds United': { stadium: 'Elland Road', capacity: '37,645' },
  'Liverpool': { stadium: 'Anfield', capacity: '61,276' },
  'Manchester City': { stadium: 'Etihad Stadium', capacity: '52,900' },
  'Manchester United': { stadium: 'Old Trafford', capacity: '74,197' },
  'Newcastle United': { stadium: 'St James\' Park', capacity: '52,258' },
  'Nottingham Forest': { stadium: 'City Ground', capacity: '30,404' },
  'Sunderland AFC': { stadium: 'Stadium of Light', capacity: '49,000' },
  'Tottenham Hotspur': { stadium: 'Tottenham Hotspur Stadium', capacity: '62,850' },
  'West Ham United': { stadium: 'London Stadium', capacity: '62,500' },
  'Wolverhampton Wanderers': { stadium: 'Molineux Stadium', capacity: '31,750' },
  
  // Common API variations
  'Arsenal FC': { stadium: 'Emirates Stadium', capacity: '60,704' },
  'Aston Villa FC': { stadium: 'Villa Park', capacity: '42,918' },
  'Bournemouth': { stadium: 'Vitality Stadium', capacity: '11,307' },
  'Brentford FC': { stadium: 'Gtech (Brentford Community Stadium)', capacity: '17,250' },
  'Brighton': { stadium: 'AMEX (Falmer) Stadium', capacity: '31,876' },
  'Burnley FC': { stadium: 'Turf Moor', capacity: '21,944' },
  'Chelsea FC': { stadium: 'Stamford Bridge', capacity: '40,173' },
  'Crystal Palace FC': { stadium: 'Selhurst Park', capacity: '25,194' },
  'Everton FC': { stadium: 'Everton Stadium (Hill Dickinson St.)', capacity: '52,769' },
  'Fulham FC': { stadium: 'Craven Cottage', capacity: '29,589' },
  'Leeds': { stadium: 'Elland Road', capacity: '37,645' },
  'Liverpool FC': { stadium: 'Anfield', capacity: '61,276' },
  'Manchester City FC': { stadium: 'Etihad Stadium', capacity: '52,900' },
  'Manchester United FC': { stadium: 'Old Trafford', capacity: '74,197' },
  'Newcastle': { stadium: 'St James\' Park', capacity: '52,258' },
  'Nottingham': { stadium: 'City Ground', capacity: '30,404' },
  'Sunderland': { stadium: 'Stadium of Light', capacity: '49,000' },
  'Tottenham': { stadium: 'Tottenham Hotspur Stadium', capacity: '62,850' },
  'West Ham': { stadium: 'London Stadium', capacity: '62,500' },
  'Wolves': { stadium: 'Molineux Stadium', capacity: '31,750' },
  'Wolverhampton': { stadium: 'Molineux Stadium', capacity: '31,750' }
};

// Function to get stadium info for a team
const getStadiumInfo = (teamName) => {
  // Debug: log the team name to see what we're getting
  console.log('Team name from API:', teamName);
  
  // Try exact match first
  if (STADIUM_DATA[teamName]) {
    return STADIUM_DATA[teamName];
  }
  
  // Try to find a match by removing common suffixes
  const cleanName = teamName.replace(/\s+(FC|United|City|Town|Albion|Hotspur|Wanderers|Rovers)$/i, '').trim();
  console.log('Cleaned team name:', cleanName);
  
  // Try cleaned name
  if (STADIUM_DATA[cleanName]) {
    return STADIUM_DATA[cleanName];
  }
  
  // Try some common variations
  const variations = [
    teamName.replace('FC', '').trim(),
    teamName.replace('United', '').trim(),
    teamName.replace('City', '').trim(),
    teamName.replace('Town', '').trim(),
    teamName.replace('Albion', '').trim(),
    teamName.replace('Hotspur', '').trim(),
    teamName.replace('Wanderers', '').trim(),
    teamName.replace('Rovers', '').trim()
  ];
  
  for (const variation of variations) {
    if (STADIUM_DATA[variation]) {
      return STADIUM_DATA[variation];
    }
  }
  
  return { stadium: 'Unknown Stadium', capacity: 'N/A' };
};

// Calculate prediction result for finished games
const getPredictionResult = (fixture, prediction) => {
  if (!fixture || fixture.status !== 'FINISHED' || 
      fixture.home_score === null || fixture.home_score === undefined ||
      fixture.away_score === null || fixture.away_score === undefined ||
      !prediction || 
      prediction.home_score === null || prediction.home_score === undefined ||
      prediction.away_score === null || prediction.away_score === undefined) {
    return null;
  }

  const predictedHome = parseInt(prediction.home_score);
  const predictedAway = parseInt(prediction.away_score);
  const actualHome = fixture.home_score;
  const actualAway = fixture.away_score;

  // Exact score match = HIT
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { type: 'hit', text: 'HIT', points: 3 };
  }

  // Correct result (win/draw/loss) = RESULT
  const predictedResult = predictedHome > predictedAway ? 'home_win' : 
                         predictedHome < predictedAway ? 'away_win' : 'draw';
  const actualResult = actualHome > actualAway ? 'home_win' : 
                       actualHome < actualAway ? 'away_win' : 'draw';
  
  if (predictedResult === actualResult) {
    return { type: 'result', text: 'RESULT', points: 1 };
  }

  // Wrong prediction = MISS
  return { type: 'miss', text: 'MISS', points: 0 };
};

const MatchPredictions = ({ onPredictionSaved }) => {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [allFixtures, setAllFixtures] = useState([]); // Store all fixtures for team form
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [maxMatchday, setMaxMatchday] = useState(38); // Premier League has 38 matchdays
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  // Hardcoded season - no need for state

  // Fetch team form data when fixtures change
  useEffect(() => {
    if (user && fixtures.length > 0) {
      fetchTeamForms();
    }
  }, [user, fixtures]);

  // Fetch fixtures for current matchday
  useEffect(() => {
    if (user) {
      fetchFixtures();
    }
  }, [user, currentMatchday]);

  // Fetch user predictions for current matchday
  useEffect(() => {
    if (user && fixtures.length > 0) {
      fetchPredictions();
    }
  }, [user, fixtures, currentMatchday]);

  const fetchTeamForms = async () => {
    try {
      // Fetch fixtures from the last few matchdays to get recent form
      const recentFixtures = [];
      
      // Get fixtures from current matchday and a few previous ones
      for (let matchday = Math.max(1, currentMatchday - 5); matchday <= currentMatchday; matchday++) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.FIXTURES_MATCHDAY}/${matchday}`);
          if (response.data.success && response.data.fixtures) {
            recentFixtures.push(...response.data.fixtures);
          }
        } catch (error) {
          // Continue if matchday doesn't exist
          continue;
        }
      }

      // Get unique teams from current fixtures
      const teams = new Set();
      fixtures.forEach(fixture => {
        teams.add(fixture.home_team_name);
        teams.add(fixture.away_team_name);
      });

      // Calculate form for each team from recent fixtures
      const teamForms = {};
      
      teams.forEach(teamName => {
        const teamFixtures = recentFixtures
          .filter(fixture => 
            (fixture.home_team_name === teamName || fixture.away_team_name === teamName) &&
            fixture.status === 'FINISHED' && 
            fixture.home_score !== null && 
            fixture.away_score !== null
          )
          .sort((a, b) => new Date(b.scheduled_date) - new Date(a.scheduled_date))
          .slice(0, 3);

        // Convert to form results
        teamForms[teamName] = teamFixtures.map(fixture => {
          const isHome = fixture.home_team_name === teamName;
          const teamScore = isHome ? fixture.home_score : fixture.away_score;
          const opponentScore = isHome ? fixture.away_score : fixture.home_score;

          if (teamScore > opponentScore) return { result: 'W', class: 'win' };
          if (teamScore === opponentScore) return { result: 'D', class: 'draw' };
          return { result: 'L', class: 'loss' };
        });
      });

      setAllFixtures(teamForms);
    } catch (error) {
      console.error('Error fetching team forms:', error);
    }
  };

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_ENDPOINTS.FIXTURES_MATCHDAY}/${currentMatchday}`);
      const data = response.data;
      
      if (data.success) {
        setFixtures(data.fixtures);
      } else {
        toast.error('Failed to fetch fixtures');
      }
    } catch (error) {
      console.error('Error fetching fixtures:', error);
      toast.error('Error fetching fixtures');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.get(`${API_ENDPOINTS.FIXTURE_PREDICTIONS}?matchday=${currentMatchday}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = response.data;
      
      if (data.success) {
        const predictionsMap = {};
        data.predictions.forEach(fixture => {
          if (fixture.prediction) {
            predictionsMap[fixture.id] = {
              home_score: fixture.prediction.home_score,
              away_score: fixture.prediction.away_score,
              points_earned: fixture.prediction.points_earned
            };
            // Debug logging
            console.log(`Fixture ${fixture.id} prediction:`, {
              home_score: fixture.prediction.home_score,
              away_score: fixture.prediction.away_score,
              fixture_status: fixture.status,
              actual_scores: { home: fixture.home_score, away: fixture.away_score }
            });
          }
        });
        setPredictions(predictionsMap);
      }
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const savePrediction = async (fixtureId, homeScore, awayScore) => {
    if (!user) {
      toast.error('You must be logged in to make predictions');
      return;
    }

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.post(API_ENDPOINTS.FIXTURE_PREDICTIONS, {
        fixture_id: fixtureId,
        home_score: parseInt(homeScore) || 0,
        away_score: parseInt(awayScore) || 0
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      if (data.success) {
        setPredictions(prev => ({
          ...prev,
          [fixtureId]: {
            home_score: parseInt(homeScore) || 0,
            away_score: parseInt(awayScore) || 0,
            points_earned: data.points_earned
          }
        }));
        toast.success('Prediction saved!');
        
        // Recalculate scores after saving prediction
        try {
          const scoreResponse = await axios.post(`${API_ENDPOINTS.RECALCULATE_USER}/${user.id}`, {}, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Scores recalculated after fixture prediction save');
        } catch (scoreError) {
          console.error('❌ Error recalculating scores:', scoreError);
        }
        
        // Trigger score refresh in parent component
        if (onPredictionSaved) {
          onPredictionSaved();
        }
      } else {
        toast.error(data.error || 'Failed to save prediction');
      }
    } catch (error) {
      console.error('Error saving prediction:', error);
      toast.error('Error saving prediction');
    }
  };

  const getStatusBadge = (status, scheduledDate) => {
    const now = new Date();
    const fixtureDate = new Date(scheduledDate);
    
    if (status === 'FINISHED') {
      return <Badge className="bg-gray-600 text-white">Finished</Badge>;
    } else if (status === 'IN_PLAY') {
      return <Badge className="bg-blue-500">Live</Badge>;
    } else if (fixtureDate <= now) {
      return <Badge className="bg-gray-500">Started</Badge>;
    } else {
      return <Badge className="bg-gray-400 text-gray-700">Not Started</Badge>;
    }
  };

  const canEditPrediction = (scheduledDate) => {
    const now = new Date();
    const fixtureDate = new Date(scheduledDate);
    return fixtureDate > now;
  };

  const calculateMatchdayPoints = () => {
    return Object.values(predictions).reduce((total, pred) => total + (pred.points_earned || 0), 0);
  };

  // Function to get last 3 results for a team from cached team forms
  const getLastThreeResults = (teamName) => {
    // Return the cached form data for this team
    return allFixtures[teamName] || [];
  };


  if (!user) {
    return (
      <div className="prediction-section">
        <div className="prediction-header">
          <h2 className="prediction-title">Match Predictions</h2>
          <p className="prediction-description">
            Please sign in to make match predictions
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="prediction-section">
      <div className="prediction-header">
        <h2 className="prediction-title">Match Predictions</h2>
        <p className="prediction-description">
          Predict the scores for Premier League matches
        </p>
      </div>

      <div className="prediction-card">
        {/* Round Navigation */}
        <RoundNavigation 
          currentMatchday={currentMatchday}
          maxMatchday={maxMatchday}
          onMatchdayChange={setCurrentMatchday}
        />

        {/* Matchday Points */}
        <div className="prediction-actions" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Points this matchday: <strong>{calculateMatchdayPoints()}</strong>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading fixtures...</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8">
            <p>No fixtures found for matchday {currentMatchday}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {fixtures.map((fixture) => {
              const prediction = predictions[fixture.id] || { home_score: '', away_score: '' };
              const canEdit = canEditPrediction(fixture.scheduled_date);
              
              return (
                <Card key={fixture.id} className="modern-match-card">
                  {/* Match Header */}
                  <div className="match-header">
                    <div className="match-date-info">
                      <span className="calendar-icon">📅</span>
                      <span className="match-date">
                        {new Date(fixture.scheduled_date).toLocaleDateString('en-US', { 
                          weekday: 'short', 
                          day: 'numeric', 
                          month: 'short' 
                        })}
                      </span>
                    </div>
                    <div className="match-time">
                      {new Date(fixture.scheduled_date).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </div>
                    <div className="match-status">
                      {getStatusBadge(fixture.status, fixture.scheduled_date)}
                      {prediction.points_earned !== undefined && (
                        <Badge className="points-badge">
                          {prediction.points_earned} pts
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Stadium Info */}
                  <div className="stadium-info">
                    <div className="stadium-icon">🏟️</div>
                    <div className="stadium-details">
                      <span className="stadium-name">{getStadiumInfo(fixture.home_team_name).stadium}</span>
                      <span className="stadium-stats">Capacity: {getStadiumInfo(fixture.home_team_name).capacity}</span>
                    </div>
                  </div>

                  {/* Prediction Prompt - Only show for games that haven't started */}
                  {canEditPrediction(fixture.scheduled_date) && (
                    <div className="prediction-prompt">
                      <span className="prompt-icon">👇</span>
                      <span className="prompt-text">Predict a score</span>
                    </div>
                  )}

                  {/* Teams and Score Input */}
                  <div className="teams-section">
                    {/* Home Team */}
                    <div className="team-section home-team">
                      <div className="team-jersey">👕</div>
                      <div className="team-info">
                        <div className="team-name">{fixture.home_team_name}</div>
                        <div className="team-stats">Recent Form</div>
                        <div className="team-form">
                          {getLastThreeResults(fixture.home_team_name).map((result, index) => (
                            <span key={index} className={`form-result ${result.class}`}>
                              {result.result}
                            </span>
                          ))}
                          {/* Fill with empty slots if less than 3 results */}
                          {Array.from({ length: Math.max(0, 3 - getLastThreeResults(fixture.home_team_name).length) }).map((_, index) => (
                            <span key={`empty-${index}`} className="form-result empty">-</span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Score Prediction */}
                    <div className="score-prediction">
                      <div className="score-inputs">
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={prediction.home_score}
                          onChange={(e) => {
                            const newPredictions = { ...predictions };
                            if (!newPredictions[fixture.id]) {
                              newPredictions[fixture.id] = { home_score: '', away_score: '' };
                            }
                            newPredictions[fixture.id].home_score = e.target.value;
                            setPredictions(newPredictions);
                          }}
                          disabled={!canEdit}
                          className="score-input"
                          placeholder="0"
                        />
                        <span className="score-separator">-</span>
                        <Input
                          type="number"
                          min="0"
                          max="20"
                          value={prediction.away_score}
                          onChange={(e) => {
                            const newPredictions = { ...predictions };
                            if (!newPredictions[fixture.id]) {
                              newPredictions[fixture.id] = { home_score: '', away_score: '' };
                            }
                            newPredictions[fixture.id].away_score = e.target.value;
                            setPredictions(newPredictions);
                          }}
                          disabled={!canEdit}
                          className="score-input"
                          placeholder="0"
                        />
                      </div>
                      
                      {canEdit && (
                        <Button
                          onClick={() => savePrediction(fixture.id, prediction.home_score, prediction.away_score)}
                          className="save-prediction-btn"
                          disabled={prediction.home_score === '' || prediction.away_score === ''}
                        >
                          Save
                        </Button>
                      )}

                      {/* Prediction Result Indicator for Finished Games */}
                      {fixture.status === 'FINISHED' && prediction && 
                       prediction.home_score !== undefined && prediction.home_score !== null && 
                       prediction.away_score !== undefined && prediction.away_score !== null && (
                        (() => {
                          const result = getPredictionResult(fixture, prediction);
                          if (!result) return null;
                          
                          return (
                            <div className={`prediction-result ${result.type}`}>
                              <span className="result-badge">
                                {result.text} ({result.points} pts)
                              </span>
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="team-section away-team">
                      <div className="team-info">
                        <div className="team-name">{fixture.away_team_name}</div>
                        <div className="team-stats">Recent Form</div>
                        <div className="team-form">
                          {getLastThreeResults(fixture.away_team_name).map((result, index) => (
                            <span key={index} className={`form-result ${result.class}`}>
                              {result.result}
                            </span>
                          ))}
                          {/* Fill with empty slots if less than 3 results */}
                          {Array.from({ length: Math.max(0, 3 - getLastThreeResults(fixture.away_team_name).length) }).map((_, index) => (
                            <span key={`empty-${index}`} className="form-result empty">-</span>
                          ))}
                        </div>
                      </div>
                      <div className="team-jersey">👕</div>
                    </div>
                  </div>

                  {/* Actual Result */}
                  {fixture.status === 'FINISHED' && fixture.home_score !== null && (
                    <div className="actual-result">
                      <div className="actual-result-content">
                        <span className="result-label">Actual Result:</span>
                        <div className="result-score">
                          <span className="score">{fixture.home_score} - {fixture.away_score}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export { MatchPredictions };