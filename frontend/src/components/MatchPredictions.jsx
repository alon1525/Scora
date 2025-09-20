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
import PredictionBar from './PredictionBar';

// Import team kit images
import Arsenal from '../assets/Teams_Kits/Arsenal.png';
import Aston_Villa from '../assets/Teams_Kits/Aston_Villa.png';
import Bournemouth from '../assets/Teams_Kits/Bournemouth.png';
import Brentford from '../assets/Teams_Kits/Brentford.png';
import Brighton from '../assets/Teams_Kits/Brighton.png';
import Burnley from '../assets/Teams_Kits/Burnley.png';
import Chelsea from '../assets/Teams_Kits/Chelsea.png';
import Crystal_Palace from '../assets/Teams_Kits/Crystal_Palace.png';
import Everton from '../assets/Teams_Kits/Everton.png';
import Fulham from '../assets/Teams_Kits/Fulham.png';
import Leeds_United from '../assets/Teams_Kits/Leeds_United.png';
import Liverpool from '../assets/Teams_Kits/Liverpool.png';
import Manchester_City from '../assets/Teams_Kits/Manchester_City.png';
import Manchester_United from '../assets/Teams_Kits/Manchester_United.png';
import Newcastle from '../assets/Teams_Kits/Newcastle.png';
import Nottingham_Forest from '../assets/Teams_Kits/Nottingham_Forest.png';
import Sunderland from '../assets/Teams_Kits/Sunderland.png';
import Tottenham from '../assets/Teams_Kits/Tottenham.png';
import West_Ham from '../assets/Teams_Kits/West_Ham.png';
import Wolves from '../assets/Teams_Kits/Wolves.png';

// Team kit images mapping
const TEAM_KITS = {
  'Arsenal': Arsenal,
  'Arsenal FC': Arsenal,
  'Aston Villa': Aston_Villa,
  'Aston Villa FC': Aston_Villa,
  'AFC Bournemouth': Bournemouth,
  'Bournemouth': Bournemouth,
  'Brentford': Brentford,
  'Brentford FC': Brentford,
  'Brighton & Hove Albion': Brighton,
  'Brighton': Brighton,
  'Burnley': Burnley,
  'Burnley FC': Burnley,
  'Chelsea': Chelsea,
  'Chelsea FC': Chelsea,
  'Crystal Palace': Crystal_Palace,
  'Crystal Palace FC': Crystal_Palace,
  'Everton': Everton,
  'Everton FC': Everton,
  'Fulham': Fulham,
  'Fulham FC': Fulham,
  'Leeds United': Leeds_United,
  'Leeds': Leeds_United,
  'Liverpool': Liverpool,
  'Liverpool FC': Liverpool,
  'Manchester City': Manchester_City,
  'Manchester City FC': Manchester_City,
  'Manchester United': Manchester_United,
  'Manchester United FC': Manchester_United,
  'Newcastle United': Newcastle,
  'Newcastle': Newcastle,
  'Nottingham Forest': Nottingham_Forest,
  'Nottingham': Nottingham_Forest,
  'Sunderland AFC': Sunderland,
  'Sunderland': Sunderland,
  'Tottenham Hotspur': Tottenham,
  'Tottenham': Tottenham,
  'West Ham United': West_Ham,
  'West Ham': West_Ham,
  'Wolverhampton Wanderers': Wolves,
  'Wolves': Wolves,
  'Wolverhampton': Wolves
};

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

// Function to clean up team names for display
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
  
  const cleanName = nameMapping[teamName] || teamName;
  return cleanName;
};

// Function to get team kit image
const getTeamKit = (teamName) => {
  // Try exact match first
  if (TEAM_KITS[teamName]) {
    return TEAM_KITS[teamName];
  }
  
  // Try to find a match by removing common suffixes
  const cleanName = teamName.replace(/\s+(FC|United|City|Town|Albion|Hotspur|Wanderers|Rovers)$/i, '').trim();
  
  // Try cleaned name
  if (TEAM_KITS[cleanName]) {
    return TEAM_KITS[cleanName];
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
    if (TEAM_KITS[variation]) {
      return TEAM_KITS[variation];
    }
  }
  
  // Return a default kit image if no match found
  return Arsenal; // Default fallback
};

// Function to get stadium info for a team
const getStadiumInfo = (teamName) => {
  if (!teamName) return null;
  
  // Try exact match first
  if (STADIUM_DATA[teamName]) {
    return STADIUM_DATA[teamName];
  }
  
  // Try to find a match by removing common suffixes
  const cleanName = teamName.replace(/\s+(FC|United|City|Town|Albion|Hotspur|Wanderers|Rovers)$/i, '').trim();
  
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

  // Exact score match = EXACT
  if (predictedHome === actualHome && predictedAway === actualAway) {
    return { type: 'hit', text: 'EXACT', points: 3 };
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

const MatchPredictions = ({ onPredictionSaved, preloadedData }) => {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [allFixtures, setAllFixtures] = useState([]); // Store all fixtures for team form
  const [currentMatchweek, setCurrentMatchweek] = useState(null); // Start with null, will be set from preloaded data
  const [maxMatchweek, setMaxMatchweek] = useState(38); // Premier League has 38 matchweeks
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  const [matchPredictions, setMatchPredictions] = useState({}); // Store all user predictions for each match
  // Hardcoded season - no need for state

  // Simple function to get current matchweek from preloaded data
  const getCurrentMatchweek = () => {
    // Check if we have currentMatchday directly in preloaded data
    if (preloadedData?.currentMatchday) {
      return preloadedData.currentMatchday;
    }
    
    return 1; // Fallback
  };

  // Set current matchweek when preloaded data is available
  useEffect(() => {
    if (preloadedData?.fixtures && Object.keys(preloadedData.fixtures).length > 0) {
      const currentMatchweek = getCurrentMatchweek();
      setCurrentMatchweek(currentMatchweek);
    }
  }, [preloadedData?.fixtures]);

  // Don't render if user is not logged in
  if (!user) {
    return (
      <div className="prediction-card">
        <div className="text-center py-8">
          <p>Please log in to view predictions</p>
        </div>
      </div>
    );
  }

  // Fetch team form data when fixtures change
  useEffect(() => {
    if (user && fixtures.length > 0) {
      fetchTeamForms();
    }
  }, [user, fixtures]);

  // Fetch fixtures for current matchweek
  useEffect(() => {
    if (user && currentMatchweek !== null) {
      // Check if we have preloaded fixtures for this matchweek
      if (preloadedData?.fixtures?.[currentMatchweek]) {
        setFixtures(preloadedData.fixtures[currentMatchweek]);
      } else {
        fetchFixtures();
      }
    }
  }, [user, currentMatchweek, preloadedData?.fixtures]);

  // Fetch user predictions for current matchweek
  useEffect(() => {
    if (user && fixtures.length > 0 && currentMatchweek !== null) {
      fetchPredictions();
    }
  }, [user, fixtures, currentMatchweek]);

  // Load match predictions for prediction bars
  useEffect(() => {
    if (user && fixtures.length > 0) {
      loadMatchPredictions();
    }
  }, [user, fixtures]);

  // Force re-render when fixtures or predictions change to update matchday points
  useEffect(() => {
    // This will trigger a re-render and recalculate matchday points
  }, [fixtures, predictions]);

  const fetchTeamForms = async () => {
    try {
      // Fetch fixtures from the last few matchdays to get recent form
      const recentFixtures = [];
      
      // Get fixtures from current matchweek and a few previous ones
      for (let matchweek = Math.max(1, currentMatchweek - 5); matchweek <= currentMatchweek; matchweek++) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.FIXTURES_MATCHDAY}/${matchweek}`);
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
      
      // Check if we have preloaded fixtures for this matchweek
      if (preloadedData?.fixtures?.[currentMatchweek]) {
        setFixtures(preloadedData.fixtures[currentMatchweek]);
        setLoading(false);
        return;
      }
      
      // Fallback to API call
      const response = await axios.get(`${API_ENDPOINTS.FIXTURES_MATCHDAY}/${currentMatchweek}`);
      const data = response.data;
      
      if (data.success) {
        setFixtures(data.fixtures);
      } else {
        toast.error('Failed to fetch fixtures');
      }
    } catch (error) {
      toast.error('Error fetching fixtures');
    } finally {
      setLoading(false);
    }
  };

  const fetchPredictions = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.get(`${API_ENDPOINTS.FIXTURE_PREDICTIONS}?matchday=${currentMatchweek}`, {
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
            // Removed debug logging
          }
        });
        setPredictions(predictionsMap);
      }
    } catch (error) {
      // Silent error handling
    }
  };

  const loadMatchPredictions = async () => {
    try {
      const predictions = {};

      // Get auth token
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) {
        return;
      }

      for (const fixture of fixtures) {
        try {
          const response = await axios.get(`${API_ENDPOINTS.MATCH_PREDICTIONS}/${fixture.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });

          if (response.data.success) {
            // Transform the data to match PredictionBar expected format
            const matchPredictions = response.data.data.map(pred => ({
              home_score: pred.home_score,
              away_score: pred.away_score
            }));
            predictions[fixture.id] = matchPredictions;
          } else {
            predictions[fixture.id] = [];
          }
        } catch (error) {
          predictions[fixture.id] = [];
        }
      }

      setMatchPredictions(predictions);
    } catch (error) {
      // Silent error handling
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
          
          // Scores recalculated after fixture prediction save
        } catch (scoreError) {
          // Silent error handling
        }
        
        // Trigger score refresh in parent component
        if (onPredictionSaved) {
          onPredictionSaved();
        }
      } else {
        toast.error(data.error || 'Failed to save prediction');
      }
    } catch (error) {
      toast.error('Error saving prediction');
    }
  };

  const getStatusBadge = (status, scheduledDate) => {
    const now = new Date();
    const fixtureDate = new Date(scheduledDate);
    
    if (status === 'FINISHED') {
      return <Badge className="bg-gray-600 text-white">Finished</Badge>;
    } else if (status === 'IN_PLAY') {
      return <Badge className="bg-gray-500 text-white">Live</Badge>;
    } else if (fixtureDate <= now) {
      return <Badge className="bg-gray-500 text-white">Started</Badge>;
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
    let totalPoints = 0;
    
    // Calculate points for each fixture in current matchday
    fixtures.forEach(fixture => {
      const prediction = predictions[fixture.id];
      if (!prediction || prediction.home_score === null || prediction.home_score === undefined || 
          prediction.away_score === null || prediction.away_score === undefined) {
        return;
      }
      
      // Only calculate points for finished games
      if (fixture.status === 'FINISHED' && fixture.home_score !== null && fixture.away_score !== null) {
        const predictedHome = parseInt(prediction.home_score);
        const predictedAway = parseInt(prediction.away_score);
        const actualHome = fixture.home_score;
        const actualAway = fixture.away_score;
        
        // Exact score match = 3 points
        if (predictedHome === actualHome && predictedAway === actualAway) {
          totalPoints += 3;
        }
        // Correct result (win/draw/loss) = 1 point
        else {
          const predictedResult = predictedHome > predictedAway ? 'home_win' : 
                                 predictedHome < predictedAway ? 'away_win' : 'draw';
          const actualResult = actualHome > actualAway ? 'home_win' : 
                               actualHome < actualAway ? 'away_win' : 'draw';
          
          if (predictedResult === actualResult) {
            totalPoints += 1;
          }
        }
      }
    });
    
    return totalPoints;
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

      <div className="prediction-card">
        {/* Round Navigation */}
        <RoundNavigation 
          currentMatchday={currentMatchweek}
          maxMatchday={maxMatchweek}
          onMatchdayChange={setCurrentMatchweek}
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
            <p>No fixtures found for matchweek {currentMatchweek}</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {fixtures.map((fixture) => {
              const prediction = predictions[fixture.id] || { home_score: '0', away_score: '0' };
              const canEdit = canEditPrediction(fixture.scheduled_date);
              
              return (
                <Card key={fixture.id} className="modern-match-card">
                  {/* Match Header */}
                  <div className="match-header">
                    <div className="match-date-info">
                      <span className="material-symbols-outlined calendar-icon">event</span>
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
                    </div>
                  </div>

                  {/* Stadium Info */}
                  <div className="stadium-info">
                    <div className="material-symbols-outlined stadium-icon">stadium</div>
                    <div className="stadium-details">
                      <span className="stadium-name">{getStadiumInfo(fixture.home_team_name).stadium}</span>
                      <span className="stadium-stats">Capacity: {getStadiumInfo(fixture.home_team_name).capacity}</span>
                    </div>
                  </div>

                  {/* Prediction Prompt - Only show for games that haven't started */}
                  {canEditPrediction(fixture.scheduled_date) && (
                    <div className="prediction-prompt">
                      <span className="material-symbols-outlined prompt-icon">keyboard_arrow_down</span>
                      <span className="prompt-text">Predict a score</span>
                    </div>
                  )}

                  {/* Teams and Score Input */}
                  <div className="teams-section">
                    {/* Home Team */}
                    <div className="team-section home-team">
                      <div className="team-jersey">
                        <img 
                          src={getTeamKit(fixture.home_team_name)} 
                          alt={`${fixture.home_team_name} kit`}
                          className="kit-image"
                        />
                      </div>
                      <div className="team-info">
                        <div className="team-name">{getCleanTeamName(fixture.home_team_name)}</div>
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
                          max="9"
                          maxLength="1"
                          value={prediction.home_score}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 1 && value >= 0 && value <= 9) {
                              const newPredictions = { ...predictions };
                              if (!newPredictions[fixture.id]) {
                                newPredictions[fixture.id] = { home_score: '', away_score: '' };
                              }
                              newPredictions[fixture.id].home_score = value;
                              setPredictions(newPredictions);
                            }
                          }}
                          disabled={!canEdit}
                          className="score-input"
                          placeholder="0"
                        />
                        <span className="score-separator">-</span>
                        <Input
                          type="number"
                          min="0"
                          max="9"
                          maxLength="1"
                          value={prediction.away_score}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value.length <= 1 && value >= 0 && value <= 9) {
                              const newPredictions = { ...predictions };
                              if (!newPredictions[fixture.id]) {
                                newPredictions[fixture.id] = { home_score: '', away_score: '' };
                              }
                              newPredictions[fixture.id].away_score = value;
                              setPredictions(newPredictions);
                            }
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
                            <div className="prediction-results-container">
                              <div className={`prediction-result ${result.type}`}>
                                <span className="result-badge">
                                  {result.text} ({result.points} pts)
                                </span>
                              </div>
                              {/* Actual Result displayed below prediction result */}
                              {fixture.home_score !== null && (
                                <div className="actual-result-inline">
                                  <span className="actual-score">
                                    Actual: {fixture.home_score} - {fixture.away_score}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })()
                      )}
                    </div>

                    {/* Away Team */}
                    <div className="team-section away-team">
                      <div className="team-jersey">
                        <img 
                          src={getTeamKit(fixture.away_team_name)} 
                          alt={`${fixture.away_team_name} kit`}
                          className="kit-image"
                        />
                      </div>
                      <div className="team-info">
                        <div className="team-name">{getCleanTeamName(fixture.away_team_name)}</div>
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
                    </div>
                  </div>

                  {/* Prediction Bar for all games except NOT_STARTED */}
                  {fixture.status !== 'NOT_STARTED' && (
                    <PredictionBar 
                      predictions={matchPredictions[fixture.id] || []}
                      homeTeam={getCleanTeamName(fixture.home_team_name)}
                      awayTeam={getCleanTeamName(fixture.away_team_name)}
                    />
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