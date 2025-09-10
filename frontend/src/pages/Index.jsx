import { useEffect, useState, useRef } from "react";
import { TEAMS } from "../data/teams";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import { UserTablePredictions } from "../components/UserTablePredictions";
import { LeaguesSection } from "../components/LeaguesSection";
import { MatchPredictions } from "../components/MatchPredictions";
import { Leaderboard } from "../components/Leaderboard";
import { UserScore } from "../components/UserScore";
import UserStats from "../components/UserStats";
import UserStatsCompact from "../components/UserStatsCompact";
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [standingsData, setStandingsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [scoreRefreshTrigger, setScoreRefreshTrigger] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const standingsLoaded = useRef(false);
  
  // Preloaded data for all tabs
  const [preloadedData, setPreloadedData] = useState({
    standings: null,
    leaderboard: null,
    userStats: null,
    leagues: null,
    fixtures: {},
    predictions: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    document.title = "Scora";
  }, []);

  // Comprehensive data loading function
  const loadAllData = async () => {
    if (!user) return;
    
    setPreloadedData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      console.log('🚀 Starting comprehensive data load...');

      // Load leaderboard first (priority)
      console.log('🏃‍♂️ Loading leaderboard first (priority)...');
      const leaderboardResponse = await axios.get(`${API_ENDPOINTS.LEADERBOARD}?limit=50`);
      console.log('✅ Leaderboard loaded first');

      // Load standings to get current matchweek
      console.log('🏃‍♂️ Loading standings to get current matchweek...');
      const standingsResponse = await axios.get(API_ENDPOINTS.STANDINGS);
      
      let currentMatchday = 1;
      if (standingsResponse.data?.success) {
        currentMatchday = standingsResponse.data.currentMatchday || 1;
        console.log(`🎯 Found current matchday: ${currentMatchday}`);
      }

      // Load fixtures for current matchweek and surrounding ones
      console.log(`🏃‍♂️ Loading fixtures for matchweek ${currentMatchday} and surrounding ones...`);
      const fixturesPromises = [];
      const startMatchday = Math.max(1, currentMatchday - 1);
      const endMatchday = Math.min(38, currentMatchday + 3);
      
      for (let matchday = startMatchday; matchday <= endMatchday; matchday++) {
        fixturesPromises.push(
          axios.get(`${API_ENDPOINTS.FIXTURES_MATCHDAY}/${matchday}`)
            .then(response => ({ matchday, data: response.data }))
            .catch(error => ({ matchday, error }))
        );
      }
      
      const fixturesResults = await Promise.allSettled(fixturesPromises);
      const fixtures = {};
      fixturesResults.forEach(result => {
        if (result.status === 'fulfilled' && result.value.data?.success) {
          fixtures[result.value.matchday] = result.value.data.fixtures;
        }
      });
      console.log(`✅ Loaded fixtures for ${Object.keys(fixtures).length} matchdays`);

      // Load other data in parallel
      const [
        userStatsResponse,
        leaguesResponse
      ] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.USER_SCORES, { headers }),
        axios.get(API_ENDPOINTS.LEAGUES_MY_LEAGUES, { headers })
      ]);

      // Process standings (already loaded above)
      let standings = null;
      if (standingsResponse.data?.success) {
        standings = standingsResponse.data.standingsData;
        setStandingsData(standings);
        setLastUpdated(standingsResponse.data?.lastUpdated || "");
        console.log(`✅ Standings loaded - Current matchday: ${currentMatchday}`);
      }

      // Process leaderboard (already loaded above)
      let leaderboard = null;
      if (leaderboardResponse.data?.success) {
        leaderboard = leaderboardResponse.data.leaderboard;
        console.log('✅ Leaderboard processed');
      }

      // Process user stats
      let userStats = null;
      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value.data?.success) {
        userStats = userStatsResponse.value.data;
        console.log('✅ User stats loaded');
      }

      // Process leagues
      let leagues = null;
      if (leaguesResponse.status === 'fulfilled' && leaguesResponse.value.data?.success) {
        leagues = leaguesResponse.value.data.leagues;
        console.log('✅ Leagues loaded');
      }

      setPreloadedData({
        standings,
        leaderboard,
        userStats,
        leagues,
        fixtures,
        currentMatchday,
        predictions: {},
        loading: false,
        error: null
      });

      console.log('🎉 All data loaded successfully!');
    } catch (error) {
      console.error('❌ Error loading data:', error);
      setPreloadedData(prev => ({
        ...prev,
        loading: false,
        error: error.message
      }));
    }
  };

  // Handle scroll to hide/show sign out button
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      setIsScrolled(scrollTop > 50); // Hide after scrolling 50px
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);


  // Redirect to auth if not authenticated (but wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Load all data when user is authenticated
  useEffect(() => {
    if (!authLoading && user && preloadedData.loading) {
      loadAllData();
    }
  }, [authLoading, user, preloadedData.loading]);

  // Legacy standings loading removed - now handled in comprehensive loadAllData()

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };


  const triggerScoreRefresh = () => {
    setScoreRefreshTrigger(prev => prev + 1);
  };



  // Auto-refresh when standings change (games end)
  useEffect(() => {
    if (standingsData.length > 0) {
      console.log('🔄 Standings updated, refreshing scores...');
      triggerScoreRefresh();
    }
  }, [standingsData]);

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

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-green mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
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
      {/* Sign Out Button - Top Right Corner */}
      <div className={`top-right-signout ${isScrolled ? 'hidden' : ''}`}>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          Sign Out
        </Button>
      </div>

      <section className="container">
        {/* Header with user info */}
        <header className="dashboard-header">
          <div className="dashboard-header-content">
            <div className="dashboard-title-section">
              <h1 className="dashboard-title">
                Scora
              </h1>
              <p className="dashboard-subtitle">
                Welcome back! Create your predictions and compete with friends.
              </p>
            </div>
            <div className="dashboard-user-section">
              <UserStatsCompact refreshTrigger={scoreRefreshTrigger} />
            </div>
          </div>
        </header>


        <Tabs defaultValue="leaderboard" className="dashboard-tabs">
          <TabsList className="dashboard-tabs-list">
            <TabsTrigger value="predictions">My Predictions</TabsTrigger>
            <TabsTrigger value="leagues">Leagues</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
            <TabsTrigger value="matches">Match Predictions</TabsTrigger>
            <TabsTrigger value="standings">Live Standings</TabsTrigger>
          </TabsList>

          <TabsContent value="predictions" className="dashboard-tabs-content">
            <UserTablePredictions onPredictionSaved={triggerScoreRefresh} />
          </TabsContent>

          <TabsContent value="leagues" className="dashboard-tabs-content">
            <LeaguesSection preloadedData={preloadedData} />
          </TabsContent>

          <TabsContent value="leaderboard" className="dashboard-tabs-content">
            <Leaderboard preloadedData={preloadedData} />
          </TabsContent>

          <TabsContent value="matches" className="dashboard-tabs-content">
            <div className="dashboard-tabs-content">
              <MatchPredictions onPredictionSaved={triggerScoreRefresh} preloadedData={preloadedData} />
            </div>
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
                                  src={TEAMS.find(t => t.id === team.team_id)?.logo}
                                  alt={`${team.team_name || team.name} badge`}
                                  loading="lazy"
                                  width={24}
                                  height={24}
                                  className="standings-team-logo"
                                  onError={(e) => {
                                    e.currentTarget.style.display = "none";
                                  }}
                                />
                                <span className="standings-team-name">{team.team_name || team.name}</span>
                              </div>
                            </td>
                            <td className="standings-stats">{team.played || 0}</td>
                            <td className="standings-stats">{team.wins || 0}</td>
                            <td className="standings-stats">{team.draws || 0}</td>
                            <td className="standings-stats">{team.losses || 0}</td>
                            <td className="standings-stats">{team.goals_for || team.goalsFor || 0}</td>
                            <td className="standings-stats">{team.goals_against || team.goalsAgainst || 0}</td>
                            <td className="standings-stats">
                              <span className={`standings-goal-diff ${(team.goal_difference || team.goalDifference) > 0 ? 'positive' : (team.goal_difference || team.goalDifference) < 0 ? 'negative' : 'neutral'}`}>
                                {(team.goal_difference || team.goalDifference) > 0 ? '+' : ''}{(team.goal_difference || team.goalDifference) || 0}
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
