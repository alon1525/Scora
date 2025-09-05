import { useEffect, useState, useRef } from "react";
import { TEAMS } from "../data/teams";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { UserTablePredictions } from "../components/UserTablePredictions";
import { LeaguesSection } from "../components/LeaguesSection";
import { MatchPredictions } from "../components/MatchPredictions";
import { Leaderboard } from "../components/Leaderboard";
import { AdminMatchControls } from "../components/AdminMatchControls";
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [standingsData, setStandingsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const standingsLoaded = useRef(false);

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
      if (standingsLoaded.current) return; // Prevent multiple calls
      
      try {
        standingsLoaded.current = true;
        console.log('Loading live standings...');
        const response = await fetch('http://localhost:3001/api/standings');
        
        if (!response.ok) {
          console.error('Standings API error:', response.status, response.statusText);
          throw new Error(`Failed to fetch standings: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Standings response:', data);
        
        const standings = data?.standingsData;
        const updated = data?.lastUpdated;
        
        if (standings && standings.length > 0) {
          setStandingsData(standings);
          console.log(`✅ Loaded ${standings.length} teams`);
        } else {
          console.warn('No standings data received');
        }
        
        if (updated) {
          setLastUpdated(updated);
        }
      } catch (e) {
        console.error('❌ Error loading standings:', e?.message || e);
        // Set some fallback data for testing
        setStandingsData([]);
        standingsLoaded.current = false; // Reset on error so it can retry
      }
    };

    if (user) {
      loadStandings();
    }
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="loading-container">
        <div className="loading-content">
          <h1 className="loading-title">Loading...</h1>
        </div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  return (
    <main className="dashboard-page">
      <section className="container">
        {/* Header with user info and sign out */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div>
              <h1 className="dashboard-title">Premier League Predictions</h1>
              <p className="dashboard-subtitle">
                Welcome back! Create your predictions and compete with friends.
              </p>
            </div>
            <div className="dashboard-actions">
              <span className="user-email">
                {user.email}
              </span>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                Sign Out
              </Button>
            </div>
          </div>
        </header>

        <Tabs defaultValue="predictions" className="dashboard-tabs">
          <TabsList className="dashboard-tabs-list">
            <TabsTrigger value="predictions">My Predictions</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="matches">Match Predictions</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="standings">Live Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="dashboard-tabs-content">
            <UserTablePredictions />
          </TabsContent>

          <TabsContent value="leagues" className="dashboard-tabs-content">
            <LeaguesSection />
          </TabsContent>

          <TabsContent value="matches" className="dashboard-tabs-content">
            <div className="dashboard-tabs-content">
              <AdminMatchControls />
              <MatchPredictions />
            </div>
          </TabsContent>

          <TabsContent value="leaderboard" className="dashboard-tabs-content">
            <Leaderboard />
          </TabsContent>

          <TabsContent value="standings" className="dashboard-tabs-content">
            <div className="standings-card">
              <div className="standings-header">
                <h3 className="standings-title">Live Premier League Standings</h3>
                {lastUpdated && (
                  <p className="standings-updated">
                    Last updated: {new Date(lastUpdated).toLocaleString()}
                  </p>
                )}
              </div>

              <div className="standings-table-container">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>GF</th>
                      <th>GA</th>
                      <th>GD</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standingsData.length > 0 ? (
                      standingsData
                        .sort((a, b) => a.position - b.position)
                        .map((team) => (
                          <tr key={team.id}>
                            <td className="standings-position">{team.position}</td>
                            <td>
                              <div className="standings-team">
                                <img
                                  src={TEAMS.find(t => t.id === team.id)?.logo}
                                  alt={`${team.name} badge`}
                                  loading="lazy"
                                  width={24}
                                  height={24}
                                  className="standings-team-logo"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <span className="standings-team-name">{team.name}</span>
                              </div>
                            </td>
                            <td className="standings-stats">{team.played}</td>
                            <td className="standings-stats">{team.wins}</td>
                            <td className="standings-stats">{team.draws}</td>
                            <td className="standings-stats">{team.losses}</td>
                            <td className="standings-stats">{team.goalsFor}</td>
                            <td className="standings-stats">{team.goalsAgainst}</td>
                            <td className="standings-stats">
                              <span className={`standings-goal-diff ${team.goalDifference >= 0 ? 'positive' : 'negative'}`}>
                                {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                              </span>
                            </td>
                            <td className="standings-points">{team.points}</td>
                          </tr>
                        ))
                    ) : (
                      <tr>
                        <td colSpan={10} className="standings-loading">
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

        <footer className="dashboard-footer">
          Your predictions are saved securely in the cloud. Compete with friends in leagues!
        </footer>
      </section>
    </main>
  );
};

export default Index;
