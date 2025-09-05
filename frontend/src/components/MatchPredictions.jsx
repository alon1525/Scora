import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';

const MatchPredictions = () => {
  const { user } = useAuth();
  const [fixtures, setFixtures] = useState([]);
  const [currentMatchday, setCurrentMatchday] = useState(1);
  const [maxMatchday, setMaxMatchday] = useState(1);
  const [predictions, setPredictions] = useState({});
  const [loading, setLoading] = useState(false);
  // Hardcoded season - no need for state

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

  const fetchFixtures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/fixtures/matchday/${currentMatchday}`);
      const data = await response.json();
      
      if (data.success) {
        setFixtures(data.fixtures);
        setMaxMatchday(Math.max(maxMatchday, currentMatchday));
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
      const response = await fetch(`http://localhost:3001/api/predictions/fixtures?matchday=${currentMatchday}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        const predictionsMap = {};
        data.predictions.forEach(fixture => {
          if (fixture.prediction) {
            predictionsMap[fixture.id] = {
              home_score: fixture.prediction.home_score,
              away_score: fixture.prediction.away_score,
              points_earned: fixture.prediction.points_earned
            };
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
      const response = await fetch('http://localhost:3001/api/predictions/fixture', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fixture_id: fixtureId,
          home_score: parseInt(homeScore) || 0,
          away_score: parseInt(awayScore) || 0
        })
      });

      const data = await response.json();
      
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
      return <Badge className="bg-green-500">Finished</Badge>;
    } else if (status === 'IN_PLAY') {
      return <Badge className="bg-blue-500">Live</Badge>;
    } else if (fixtureDate <= now) {
      return <Badge className="bg-gray-500">Started</Badge>;
    } else {
      return <Badge className="bg-yellow-500">Not Started</Badge>;
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

  const refreshFixtures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/fixtures/refresh?season=2025`);
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} fixtures`);
        fetchFixtures();
      } else {
        toast.error('Failed to refresh fixtures');
      }
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
      toast.error('Error refreshing fixtures');
    } finally {
      setLoading(false);
    }
  };

  const refreshUpcomingFixtures = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/fixtures/upcoming?season=2025&matchday=${currentMatchday}`);
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} upcoming fixtures`);
        fetchFixtures();
      } else {
        toast.error('Failed to refresh upcoming fixtures');
      }
    } catch (error) {
      console.error('Error refreshing upcoming fixtures:', error);
      toast.error('Error refreshing upcoming fixtures');
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/fixtures/results?season=2025&matchday=${currentMatchday}`);
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} results`);
        fetchFixtures();
      } else {
        toast.error('Failed to refresh results');
      }
    } catch (error) {
      console.error('Error refreshing results:', error);
      toast.error('Error refreshing results');
    } finally {
      setLoading(false);
    }
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
        <div className="prediction-actions" style={{ justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setCurrentMatchday(Math.max(1, currentMatchday - 1))}
              disabled={currentMatchday <= 1}
              variant="outline"
            >
              ← Previous
            </Button>
            <span className="font-semibold">Matchday {currentMatchday}</span>
            <Button
              onClick={() => setCurrentMatchday(currentMatchday + 1)}
              disabled={currentMatchday >= maxMatchday}
              variant="outline"
            >
              Next →
            </Button>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">
              Points this matchday: <strong>{calculateMatchdayPoints()}</strong>
            </span>
            <div className="flex gap-2">
              <Button onClick={refreshUpcomingFixtures} disabled={loading} size="sm" variant="outline">
                {loading ? 'Refreshing...' : 'Upcoming'}
              </Button>
              <Button onClick={refreshResults} disabled={loading} size="sm" variant="outline">
                {loading ? 'Refreshing...' : 'Results'}
              </Button>
              <Button onClick={refreshFixtures} disabled={loading} size="sm">
                {loading ? 'Refreshing...' : 'All Fixtures'}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Loading fixtures...</p>
          </div>
        ) : fixtures.length === 0 ? (
          <div className="text-center py-8">
            <p>No fixtures found for matchday {currentMatchday}</p>
            <Button onClick={refreshFixtures} className="mt-4">
              Refresh Fixtures
            </Button>
          </div>
        ) : (
          <div className="grid gap-4">
            {fixtures.map((fixture) => {
              const prediction = predictions[fixture.id] || { home_score: '', away_score: '' };
              const canEdit = canEditPrediction(fixture.scheduled_date);
              
              return (
                <Card key={fixture.id} className="match-card">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-600">
                          {new Date(fixture.scheduled_date).toLocaleDateString()} at{' '}
                          {new Date(fixture.scheduled_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(fixture.status, fixture.scheduled_date)}
                        {prediction.points_earned !== undefined && (
                          <Badge className="bg-purple-500">
                            {prediction.points_earned} pts
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="flex items-center justify-between">
                      {/* Home Team */}
                      <div className="flex items-center gap-3 flex-1">
                        <img
                          src={fixture.home_team_logo}
                          alt={fixture.home_team_name}
                          className="team-logo"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                        <span className="font-semibold">{fixture.home_team_name}</span>
                      </div>

                      {/* Score Input */}
                      <div className="flex items-center gap-2 mx-4">
                        <div className="flex items-center gap-1">
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
                            className="w-12 text-center"
                          />
                          <span className="text-gray-500">-</span>
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
                            className="w-12 text-center"
                          />
                        </div>
                        
                        {canEdit && (
                          <Button
                            onClick={() => savePrediction(fixture.id, prediction.home_score, prediction.away_score)}
                            size="sm"
                            disabled={prediction.home_score === '' || prediction.away_score === ''}
                          >
                            Save
                          </Button>
                        )}
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center gap-3 flex-1 justify-end">
                        <span className="font-semibold">{fixture.away_team_name}</span>
                        <img
                          src={fixture.away_team_logo}
                          alt={fixture.away_team_name}
                          className="team-logo"
                          onError={(e) => e.target.style.display = 'none'}
                        />
                      </div>
                    </div>

                    {/* Actual Result */}
                    {fixture.status === 'FINISHED' && fixture.home_score !== null && (
                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-4">
                          <span className="text-sm text-gray-600">Actual Result:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold">{fixture.home_team_name}</span>
                            <span className="text-lg font-bold">{fixture.home_score} - {fixture.away_score}</span>
                            <span className="font-semibold">{fixture.away_team_name}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
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