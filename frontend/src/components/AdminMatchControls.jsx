import { useState } from "react";
import { supabase } from "../integrations/supabase/client";
import { Card, CardHeader, CardTitle, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useToast } from "../hooks/use-toast";
import { TEAMS } from "../data/teams";

export const AdminMatchControls = () => {
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [matchDate, setMatchDate] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const addMatch = async () => {
    if (!homeTeam || !awayTeam || !matchDate) {
      toast({
        title: "Missing Information",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const matchDateTime = new Date(matchDate);
      const bettingOpensAt = new Date(matchDateTime.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days before
      const bettingClosesAt = new Date(matchDateTime.getTime() - 60 * 60 * 1000); // 1 hour before

      const { error } = await supabase
        .from('match_events')
        .insert({
          home_team: homeTeam,
          away_team: awayTeam,
          match_date: matchDateTime.toISOString(),
          betting_opens_at: bettingOpensAt.toISOString(),
          betting_closes_at: bettingClosesAt.toISOString(),
          status: 'upcoming'
        });

      if (error) throw error;

      toast({
        title: "Match Added",
        description: `${homeTeam} vs ${awayTeam} scheduled for ${matchDate}`,
      });

      setHomeTeam("");
      setAwayTeam("");
      setMatchDate("");
    } catch (error) {
      console.error('Error adding match:', error);
      toast({
        title: "Error",
        description: "Failed to add match",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addSampleMatches = async () => {
    setLoading(true);
    try {
      const now = new Date();
      const sampleMatches = [
        {
          home_team: "Liverpool",
          away_team: "Manchester City",
          match_date: new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000), // 8 days from now
        },
        {
          home_team: "Arsenal",
          away_team: "Chelsea",
          match_date: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        },
        {
          home_team: "Manchester United",
          away_team: "Tottenham",
          match_date: new Date(now.getTime() + 22 * 24 * 60 * 60 * 1000), // 22 days from now
        }
      ];

      for (const match of sampleMatches) {
        const bettingOpensAt = new Date(match.match_date.getTime() - 7 * 24 * 60 * 60 * 1000);
        const bettingClosesAt = new Date(match.match_date.getTime() - 60 * 60 * 1000);

        await supabase
          .from('match_events')
          .insert({
            home_team: match.home_team,
            away_team: match.away_team,
            match_date: match.match_date.toISOString(),
            betting_opens_at: bettingOpensAt.toISOString(),
            betting_closes_at: bettingClosesAt.toISOString(),
            status: 'upcoming'
          });
      }

      toast({
        title: "Sample Matches Added",
        description: "3 sample matches have been added to the system",
      });
    } catch (error) {
      console.error('Error adding sample matches:', error);
      toast({
        title: "Error",
        description: "Failed to add sample matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const closeBetting = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('match_events')
        .update({ status: 'betting_closed' })
        .eq('status', 'betting_open');

      if (error) throw error;

      toast({
        title: "Success",
        description: "Betting closed for open matches",
      });
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

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Admin - Add Match</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="home-team" className="text-foreground">Home Team</Label>
              <Select value={homeTeam} onValueChange={setHomeTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select home team" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="away-team" className="text-foreground">Away Team</Label>
              <Select value={awayTeam} onValueChange={setAwayTeam}>
                <SelectTrigger>
                  <SelectValue placeholder="Select away team" />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((team) => (
                    <SelectItem key={team.id} value={team.name}>
                      {team.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="match-date" className="text-foreground">Match Date & Time</Label>
          <Input
            id="match-date"
            type="datetime-local"
            value={matchDate}
            onChange={(e) => setMatchDate(e.target.value)}
            className="text-foreground"
          />
        </div>

        <div className="flex space-x-2">
          <Button onClick={addMatch} disabled={loading} className="flex-1">
            Add Match
          </Button>
          <Button onClick={addSampleMatches} disabled={loading} variant="outline">
            Add Sample Matches
          </Button>
        </div>
        
        <Button 
          onClick={closeBetting} 
          disabled={loading}
          variant="secondary"
          className="w-full"
        >
          Close Current Betting
        </Button>
        
        <p className="text-sm text-foreground">
          Betting will automatically open 7 days before the match and close 1 hour before.
        </p>
      </CardContent>
    </Card>
  );
};
