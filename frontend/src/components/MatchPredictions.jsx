import { useState, useEffect } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { TEAMS } from "../data/teams";

export const MatchPredictions = () => {
  const [currentMatch, setCurrentMatch] = useState(null);
  const [completedMatches, setCompletedMatches] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [completedPredictions, setCompletedPredictions] = useState({});
  const [userProfiles, setUserProfiles] = useState([]);
  const [homeScore, setHomeScore] = useState("");
  const [awayScore, setAwayScore] = useState("");
  const [username, setUsername] = useState("");
  const [selectedWinner, setSelectedWinner] = useState("");
  const [loading, setLoading] = useState(false);
  const [tableScores, setTableScores] = useState({});
  const { toast } = useToast();

  useEffect(() => {
    fetchCurrentMatch();
    fetchCompletedMatches();
    fetchUserProfiles();
    calculateTableScores();
  }, []);

  useEffect(() => {
    if (currentMatch) {
      fetchMatchPredictions(currentMatch.id);
    }
  }, [currentMatch]);

  useEffect(() => {
    if (completedMatches.length > 0) {
      fetchCompletedPredictions();
    }
  }, [completedMatches]);

  const fetchCurrentMatch = async () => {
    try {
      const now = new Date().toISOString();
      
      // First, check for matches with betting still open
      const { data, error } = await supabase
        .from('match_events')
        .select('*')
        .lte('betting_opens_at', now)
        .gte('betting_closes_at', now)
        .eq('status', 'betting_open')
        .order('match_date', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (data && data.length > 0) {
        setCurrentMatch(data[0]);
        return;
      }

      // Check for matches that have closed betting but not completed yet
      const { data: closedData, error: closedError } = await supabase
        .from('match_events')
        .select('*')
        .eq('status', 'betting_closed')
        .order('match_date', { ascending: true })
        .limit(1);

      if (closedError) throw closedError;

      if (closedData && closedData.length > 0) {
        setCurrentMatch(closedData[0]);
        return;
      }

      // Check for matches that should be automatically closed (time passed but still open)
      const { data: shouldCloseData, error: shouldCloseError } = await supabase
        .from('match_events')
        .select('*')
        .eq('status', 'betting_open')
        .lt('betting_closes_at', now)
        .order('match_date', { ascending: true })
        .limit(1);

      if (shouldCloseError) throw shouldCloseError;

      if (shouldCloseData && shouldCloseData.length > 0) {
        // Auto-close betting but keep match visible for winner selection
        const { error: updateError } = await supabase
          .from('match_events')
          .update({ status: 'betting_closed' })
          .eq('id', shouldCloseData[0].id);

        if (updateError) throw updateError;
        setCurrentMatch({ ...shouldCloseData[0], status: 'betting_closed' });
        return;
      }

      // Finally, check for upcoming matches that should be opened
      const { data: upcomingData, error: upcomingError } = await supabase
        .from('match_events')
        .select('*')
        .eq('status', 'upcoming')
        .lte('betting_opens_at', now)
        .order('match_date', { ascending: true })
        .limit(1);

      if (upcomingError) throw upcomingError;

      if (upcomingData && upcomingData.length > 0) {
        // Update status to betting_open
        const { error: updateError } = await supabase
          .from('match_events')
          .update({ status: 'betting_open' })
          .eq('id', upcomingData[0].id);

        if (updateError) throw updateError;
        setCurrentMatch({ ...upcomingData[0], status: 'betting_open' });
      }
    } catch (error) {
      console.error('Error fetching current match:', error);
    }
  };

  const fetchCompletedMatches = async () => {
    try {
      const { data, error } = await supabase
        .from('match_events')
        .select('*')
        .eq('status', 'completed')
        .order('match_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      setCompletedMatches(data || []);
    } catch (error) {
      console.error('Error fetching completed matches:', error);
    }
  };

  const fetchCompletedPredictions = async () => {
    try {
      const predictions = {};
      
      for (const match of completedMatches) {
        const { data, error } = await supabase
          .from('match_predictions')
          .select('*')
          .eq('match_id', match.id)
          .order('created_at', { ascending: true });

        if (error) throw error;
        predictions[match.id] = data || [];
      }
      
      setCompletedPredictions(predictions);
    } catch (error) {
      console.error('Error fetching completed predictions:', error);
    }
  };

  const fetchMatchPredictions = async (matchId) => {
    try {
      const { data, error } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('match_id', matchId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setPredictions(data || []);
    } catch (error) {
      console.error('Error fetching predictions:', error);
    }
  };

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('total_penalties', { ascending: true });

      if (error) throw error;
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
    }
  };

  const calculateTableScores = async () => {
    try {
      // Get current real standings
      const { data: realData } = await supabase
        .from('real_standings')
        .select('positions')
        .eq('label', 'current')
        .maybeSingle();

      if (!realData?.positions) return;

      // Get prediction sets
      const { data: predictionData } = await supabase
        .from('prediction_sets')
        .select('p1_order, p2_order')
        .eq('label', 'default')
        .maybeSingle();

      if (!predictionData) return;

      const real = realData.positions;
      
      // Calculate scores for each user using the same logic as the main page
      const calculateScore = (order) => {
        return TEAMS.reduce((sum, t) => {
          const predicted = order.indexOf(t.id) + 1; // 1-based
          const rr = real[t.id];
          if (typeof rr === 'number' && predicted > 0) {
            return sum + Math.abs(predicted - rr);
          }
          return sum;
        }, 0);
      };

      const scores = {
        alon: calculateScore(predictionData.p1_order ? JSON.parse(predictionData.p1_order) : []),
        nadav: calculateScore(predictionData.p2_order ? JSON.parse(predictionData.p2_order) : [])
      };

      setTableScores(scores);
    } catch (error) {
      console.error('Error calculating table scores:', error);
    }
  };

  const submitPrediction = async () => {
    if (!currentMatch || !username || homeScore === "" || awayScore === "") {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Check if prediction already exists for this user and match (case-insensitive)
      const { data: existingPrediction } = await supabase
        .from('match_predictions')
        .select('*')
        .eq('match_id', currentMatch.id)
        .ilike('username', username)
        .maybeSingle();

      if (existingPrediction) {
        toast({
          title: "Prediction Already Exists",
          description: `${username} has already made a prediction for this match`,
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Get or create user profile (case-insensitive check)
      const { data: existingProfile } = await supabase
        .from('user_profiles')
        .select('*')
        .ilike('username', username)
        .maybeSingle();

      let userProfileId;

      if (!existingProfile) {
        // Create new profile
        const newUserId = crypto.randomUUID();
        const { data: newProfile, error: profileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: newUserId,
            username,
            total_penalties: 0
          })
          .select('id')
          .single();

        if (profileError) throw profileError;
        userProfileId = newProfile.id;
      } else {
        userProfileId = existingProfile.id;
      }

      // Submit prediction with correct user_id from profile
      const { error } = await supabase
        .from('match_predictions')
        .insert({
          match_id: currentMatch.id,
          user_id: userProfileId,
          username,
          predicted_home_score: parseInt(homeScore),
          predicted_away_score: parseInt(awayScore),
        });

      if (error) throw error;

      toast({
        title: "Prediction Submitted",
        description: `Your prediction: ${homeScore}-${awayScore}`,
      });

      setHomeScore("");
      setAwayScore("");
      await fetchMatchPredictions(currentMatch.id);
    } catch (error) {
      console.error('Error submitting prediction:', error);
      toast({
        title: "Error",
        description: "Failed to submit prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deletePrediction = async (predictionId, predictionUsername) => {
    if (!currentMatch) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('match_predictions')
        .delete()
        .eq('id', predictionId);

      if (error) throw error;

      toast({
        title: "Prediction Deleted",
        description: `${predictionUsername}'s prediction has been removed`,
      });

      await fetchMatchPredictions(currentMatch.id);
    } catch (error) {
      console.error('Error deleting prediction:', error);
      toast({
        title: "Error",
        description: "Failed to delete prediction",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeCurrentBetting = async () => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      // Update match status to betting_closed to show winner selection
      await supabase
        .from('match_events')
        .update({ status: 'betting_closed' })
        .eq('id', currentMatch.id);

      toast({
        title: "Ready to Close",
        description: "Select a winner from the current predictions to complete the match.",
      });

      setCurrentMatch({ ...currentMatch, status: 'betting_closed' });
    } catch (error) {
      console.error('Error closing betting:', error);
      toast({
        title: "Error",
        description: "Failed to close betting",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const setWinner = async (winnerUsername) => {
    if (!currentMatch) return;

    setLoading(true);
    try {
      // Apply penalty to winner
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('total_penalties')
        .eq('username', winnerUsername)
        .single();

      if (profile) {
        await supabase
          .from('user_profiles')
          .update({ 
            total_penalties: profile.total_penalties - 0.25 
          })
          .eq('username', winnerUsername);

        // Update prediction with penalty
        await supabase
          .from('match_predictions')
          .update({ penalty_applied: -0.25 })
          .eq('match_id', currentMatch.id)
          .eq('username', winnerUsername);

        // Update match status to completed
        await supabase
          .from('match_events')
          .update({ status: 'completed' })
          .eq('id', currentMatch.id);

        toast({
          title: "Winner Selected",
          description: `${winnerUsername} gets -0.25 penalty points! Match completed.`,
        });

        fetchUserProfiles();
        calculateTableScores(); // Recalculate scores after event completion
        fetchCompletedMatches(); // Refresh completed matches
        fetchCurrentMatch(); // Refresh to get next available match or clear current match
      }
    } catch (error) {
      console.error('Error setting winner:', error);
      toast({
        title: "Error",
        description: "Failed to set winner",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Always render the leaderboard and any available content

  return (
    <div className="w-full max-w-4xl mx-auto mt-8 space-y-6">
      {/* Current Match */}
      {currentMatch ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{currentMatch.home_team} vs {currentMatch.away_team}</span>
              <div className="flex items-center gap-2">
                <Badge variant={currentMatch.status === 'betting_open' ? 'default' : 'secondary'}>
                  {currentMatch.status.replace('_', ' ').toUpperCase()}
                </Badge>
                {currentMatch.status === 'betting_open' && predictions.length > 0 && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={closeCurrentBetting}
                    disabled={loading}
                  >
                    Ready to Select Winner
                  </Button>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-foreground">
              Match Date: {new Date(currentMatch.match_date).toLocaleDateString()}
            </p>

            {currentMatch.status === 'betting_open' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Select value={username} onValueChange={setUsername}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your username" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="nadav">Nadav</SelectItem>
                      <SelectItem value="alon">Alon</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex space-x-2">
                    <Input
                      type="number"
                      placeholder="Home"
                      value={homeScore}
                      onChange={(e) => setHomeScore(e.target.value)}
                      min="0"
                    />
                    <span className="flex items-center text-foreground">-</span>
                    <Input
                      type="number"
                      placeholder="Away"
                      value={awayScore}
                      onChange={(e) => setAwayScore(e.target.value)}
                      min="0"
                    />
                  </div>
                  <Button onClick={submitPrediction} disabled={loading} className="w-full">
                    Submit Prediction
                  </Button>
                </div>
              </div>
            )}

            {currentMatch.status === 'betting_closed' && predictions.length > 0 && (
              <div className="space-y-4">
                <p className="text-sm text-foreground">Betting is now closed. Select the winner:</p>
                <div className="flex space-x-2">
                  <Select value={selectedWinner} onValueChange={setSelectedWinner}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Select winner" />
                    </SelectTrigger>
                    <SelectContent>
                      {predictions.map((prediction) => (
                        <SelectItem key={prediction.id} value={prediction.username}>
                          {prediction.username} ({prediction.predicted_home_score}-{prediction.predicted_away_score})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => setWinner(selectedWinner)}
                    disabled={loading || !selectedWinner}
                  >
                    Set Winner
                  </Button>
                </div>
              </div>
            )}

            {currentMatch.status === 'completed' && (
              <div className="text-center">
                <Badge variant="default" className="text-lg px-4 py-2">
                  Match Completed!
                </Badge>
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Match Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-foreground">No matches available for prediction at the moment.</p>
          </CardContent>
        </Card>
      )}

      {/* Current Predictions - Always show when available */}
      {currentMatch && predictions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Current Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {predictions.map((prediction) => (
                <div key={prediction.id} className="flex justify-between items-center p-2 border rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-card-foreground">{prediction.username}</span>
                    <span className="text-card-foreground">{prediction.predicted_home_score} - {prediction.predicted_away_score}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {prediction.penalty_applied !== 0 && (
                      <Badge variant={prediction.penalty_applied < 0 ? 'default' : 'destructive'}>
                        {prediction.penalty_applied > 0 ? '+' : ''}{prediction.penalty_applied}
                      </Badge>
                    )}
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => deletePrediction(prediction.id, prediction.username)}
                      disabled={loading}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Completed Matches with Winners */}
      {completedMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Completed Bets & Winners</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {completedMatches.map((match) => {
                const matchPredictions = completedPredictions[match.id] || [];
                const winner = matchPredictions.find(p => p.penalty_applied === -0.25);
                
                return (
                  <div key={match.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-card-foreground">
                        {match.home_team} vs {match.away_team}
                      </h4>
                      <Badge variant="outline" className="text-card-foreground">
                        {new Date(match.match_date).toLocaleDateString()}
                      </Badge>
                    </div>
                    
                    {winner && (
                      <div className="mb-3 p-2 bg-primary/10 rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="default">Winner</Badge>
                           <span className="font-medium text-card-foreground">{winner.username}</span>
                           <span className="text-card-foreground">
                             Prediction: {winner.predicted_home_score}-{winner.predicted_away_score}
                           </span>
                          <Badge variant="default" className="ml-2">
                            -0.25 pts
                          </Badge>
                        </div>
                      </div>
                    )}
                    
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-card-foreground">All Predictions:</p>
                      {matchPredictions.map((prediction) => (
                        <div key={prediction.id} className="flex justify-between items-center text-sm p-1">
                          <div className="flex items-center gap-2">
                             <span className={`${prediction.penalty_applied === -0.25 ? 'font-bold' : ''} text-card-foreground`}>
                               {prediction.username}
                             </span>
                             <span className="text-card-foreground">
                               {prediction.predicted_home_score}-{prediction.predicted_away_score}
                             </span>
                          </div>
                          {prediction.penalty_applied === -0.25 && (
                            <Badge variant="default">
                              Winner
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leaderboard - Always visible when there are profiles */}
      {userProfiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Leaderboard (Lower is Better)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
               <div className="grid grid-cols-4 gap-2 p-2 border-b font-semibold text-card-foreground">
                 <span>Rank</span>
                 <span>Player</span>
                 <span>Event Score</span>
                 <span>Total Score</span>
               </div>
              {userProfiles
                .map((profile) => {
                  const baseTableScore = tableScores[profile.username.toLowerCase()] || 0;
                  const totalScore = baseTableScore + profile.total_penalties; // penalties are negative for winners
                  return { ...profile, totalScore };
                })
                .sort((a, b) => a.totalScore - b.totalScore) // Lower is better
                .map((profile, index) => (
                   <div key={profile.id} className="grid grid-cols-4 gap-2 p-2 border rounded items-center">
                     <span className="font-bold text-card-foreground">#{index + 1}</span>
                     <span className="text-card-foreground">{profile.username}</span>
                     <span className="font-mono text-card-foreground">{profile.total_penalties.toFixed(2)}</span>
                     <span className="font-mono text-card-foreground font-semibold">
                       {profile.totalScore.toFixed(2)}
                     </span>
                   </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
