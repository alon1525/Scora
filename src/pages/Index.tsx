import { useEffect, useState } from "react";
import { TEAMS } from "@/data/teams";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { UserTablePredictions } from "@/components/UserTablePredictions";
import { LeaguesSection } from "@/components/LeaguesSection";
import { MatchPredictions } from "@/components/MatchPredictions";
import { AdminMatchControls } from "@/components/AdminMatchControls";
import { Button } from "@/components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type StandingData = {
  id: string;
  position: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [standingsData, setStandingsData] = useState<StandingData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");

  useEffect(() => {
    document.title = "Premier League Predictions";
  }, []);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load live standings
  useEffect(() => {
    const loadStandings = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-pl-standings');
        if (error) throw error;
        
        const standings = (data as any)?.standingsData as StandingData[] | undefined;
        const updated = (data as any)?.lastUpdated as string | undefined;
        
        if (standings) setStandingsData(standings);
        if (updated) setLastUpdated(updated);
      } catch (e: any) {
        console.warn('fetch-pl-standings error:', e?.message || e);
      }
    };

    if (user) {
      loadStandings();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Loading...</h1>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen py-6">
      <section className="container space-y-8">
        {/* Header with user info and sign out */}
        <header className="flex justify-between items-center">
          <div className="text-center flex-1">
            <h1 className="text-3xl md:text-4xl font-bold">Premier League Predictions</h1>
            <p className="text-muted-foreground">
              Welcome back! Create your predictions and compete with friends.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">
              {user.email}
            </span>
            <Button variant="outline" size="sm" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </header>

        <Tabs defaultValue="predictions" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="predictions">My Predictions</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="matches">Match Predictions</TabsTrigger>
            <TabsTrigger value="standings">Live Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="space-y-6">
            <UserTablePredictions />
          </TabsContent>

          <TabsContent value="leagues" className="space-y-6">
            <LeaguesSection />
          </TabsContent>

          <TabsContent value="matches" className="space-y-6">
            <div className="space-y-6">
              <AdminMatchControls />
              <MatchPredictions />
            </div>
          </TabsContent>

          <TabsContent value="standings" className="space-y-6">
            <div className="bg-card text-card-foreground rounded-lg shadow-md/50 shadow-black/20 border border-border">
              <div className="px-4 py-3 border-b border-border flex justify-between items-center">
                <h3 className="text-lg font-semibold">Live Premier League Standings</h3>
                {lastUpdated && (
                  <p className="text-xs text-muted-foreground">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border text-sm font-medium">
                      <th className="text-left p-3">#</th>
                      <th className="text-left p-3">Team</th>
                      <th className="text-center p-3">P</th>
                      <th className="text-center p-3">W</th>
                      <th className="text-center p-3">D</th>
                      <th className="text-center p-3">L</th>
                      <th className="text-center p-3">GF</th>
                      <th className="text-center p-3">GA</th>
                      <th className="text-center p-3">GD</th>
                      <th className="text-center p-3">Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standingsData.length > 0 ? (
                      standingsData
                        .sort((a, b) => a.position - b.position)
                        .map((team) => (
                          <tr key={team.id} className="border-b border-border hover:bg-muted/50">
                            <td className="p-3 text-sm font-medium">{team.position}</td>
                            <td className="p-3">
                              <div className="flex items-center gap-3">
                                <img
                                  src={TEAMS.find(t => t.id === team.id)?.logo}
                                  alt={`${team.name} badge`}
                                  loading="lazy"
                                  width={24}
                                  height={24}
                                  className="h-6 w-6 object-contain"
                                  onError={(e) => {
                                    (e.currentTarget as HTMLImageElement).style.display = "none";
                                  }}
                                />
                                <span className="font-medium text-sm">{team.name}</span>
                              </div>
                            </td>
                            <td className="p-3 text-center text-sm">{team.played}</td>
                            <td className="p-3 text-center text-sm">{team.wins}</td>
                            <td className="p-3 text-center text-sm">{team.draws}</td>
                            <td className="p-3 text-center text-sm">{team.losses}</td>
                            <td className="p-3 text-center text-sm">{team.goalsFor}</td>
                            <td className="p-3 text-center text-sm">{team.goalsAgainst}</td>
                            <td className="p-3 text-center text-sm font-medium">
                              <span className={team.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                              </span>
                            </td>
                            <td className="p-3 text-center text-sm font-bold">{team.points}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="p-6 text-center text-muted-foreground">
                          Loading live standings...
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <footer className="text-center text-xs text-muted-foreground">
          Your predictions are saved securely in the cloud. Compete with friends in leagues!
        </footer>
      </section>
    </main>
  );
};

export default Index;