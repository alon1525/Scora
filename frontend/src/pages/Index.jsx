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
import backgroundImage from "../assets/background-picture.webp";
import signOutIcon from "../assets/sign-out.png";

// Function to clean team names to short names (same as UserProfile)
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

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [standingsData, setStandingsData] = useState([]);
  const [lastUpdated, setLastUpdated] = useState("");
  const [scoreRefreshTrigger, setScoreRefreshTrigger] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [activeTab, setActiveTab] = useState("leaderboard");
  const standingsLoaded = useRef(false);
  const tabsListRef = useRef(null);
  
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

  // Function to center the active tab
  const centerActiveTab = (tabValue) => {
    if (!tabsListRef.current) return;
    
    const tabsList = tabsListRef.current;
    const tabButtons = tabsList.querySelectorAll('.tab-button');
    
    // Create a mapping of tab values to their text content
    const tabTextMap = {
      'predictions': 'My Predictions',
      'leagues': 'Leagues', 
      'leaderboard': 'Leaderboard',
      'matches': 'Fixtures',
      'standings': 'Live Standings'
    };
    
    // Find the active tab button by looking for the active class
    let activeTabElement = null;
    tabButtons.forEach(button => {
      if (button.classList.contains('active-tab')) {
        activeTabElement = button;
      }
    });
    
    if (activeTabElement) {
      const tabsListRect = tabsList.getBoundingClientRect();
      const activeTabRect = activeTabElement.getBoundingClientRect();
      
      // Calculate scroll position to center the tab
      const scrollLeft = activeTabElement.offsetLeft - (tabsListRect.width / 2) + (activeTabRect.width / 2);
      
      tabsList.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth'
      });
    }
  };

  // Handle tab change
  const handleTabChange = (value) => {
    setActiveTab(value);
    // Center the tab after a short delay to ensure DOM is updated
    setTimeout(() => centerActiveTab(value), 100);
  };

  // Center the initial tab on load
  useEffect(() => {
    if (tabsListRef.current) {
      setTimeout(() => centerActiveTab(activeTab), 200);
    }
  }, []);

  // Re-center tab on window resize
  useEffect(() => {
    const handleResize = () => {
      setTimeout(() => centerActiveTab(activeTab), 100);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [activeTab]);


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
      {/* Navigation Bar */}
      <nav className="nav-bar">
        <div className="nav-container">
            <div className="nav-left">
              <div className="nav-logo">
                <span className="material-symbols-outlined nav-icon">emoji_events</span>
                <span className="nav-title">SCORA</span>
              </div>
            </div>
          <div className="nav-right">
            <div className="nav-user">
              <div className="nav-avatar">
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <span className="nav-username">
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'}
              </span>
            </div>
            <button className="nav-signout" onClick={handleSignOut} title="Sign Out">
              <img src={signOutIcon} alt="Sign Out" width="16" height="16" />
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <header className="dashboard-header-section">
        <div className="header-container">
          <div className="header-content">
            <div className="header-text">
              <h1 className="header-title">
                Welcome back, {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'}!
              </h1>
              <p className="header-subtitle">
                Make your predictions and climb the leaderboard
              </p>
            </div>
            <div className="header-stats">
              <UserStatsCompact refreshTrigger={scoreRefreshTrigger} />
            </div>
          </div>
        </div>
      </header>

      <section className="container">


        {/* Tab Navigation */}
        <div className="tab-navigation">
          <nav className="tab-nav" ref={tabsListRef}>
            <button 
              onClick={() => handleTabChange('predictions')} 
              className={`tab-button ${activeTab === 'predictions' ? 'active-tab' : ''}`}
            >
              <span className="material-symbols-outlined tab-icon">assignment</span> My Predictions
            </button>
            <button 
              onClick={() => handleTabChange('leagues')} 
              className={`tab-button ${activeTab === 'leagues' ? 'active-tab' : ''}`}
            >
              <span className="material-symbols-outlined tab-icon">groups</span> Leagues
            </button>
            <button 
              onClick={() => handleTabChange('leaderboard')} 
              className={`tab-button ${activeTab === 'leaderboard' ? 'active-tab' : ''}`}
            >
              <span className="material-symbols-outlined tab-icon">emoji_events</span> Leaderboard
            </button>
            <button 
              onClick={() => handleTabChange('matches')} 
              className={`tab-button ${activeTab === 'matches' ? 'active-tab' : ''}`}
            >
              <span className="material-symbols-outlined tab-icon">event</span> Fixtures
            </button>
            <button 
              onClick={() => handleTabChange('standings')} 
              className={`tab-button ${activeTab === 'standings' ? 'active-tab' : ''}`}
            >
              <span className="material-symbols-outlined tab-icon">bar_chart</span> Live Standings
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'predictions' && (
            <div className="dashboard-tabs-content">
              <UserTablePredictions onPredictionSaved={triggerScoreRefresh} />
            </div>
          )}
          
          {activeTab === 'leagues' && (
            <div className="dashboard-tabs-content">
              <LeaguesSection preloadedData={preloadedData} />
            </div>
          )}
          
          {activeTab === 'leaderboard' && (
            <div className="dashboard-tabs-content">
              <Leaderboard preloadedData={preloadedData} />
            </div>
          )}
          
          {activeTab === 'matches' && (
            <div className="dashboard-tabs-content">
              <MatchPredictions onPredictionSaved={triggerScoreRefresh} preloadedData={preloadedData} />
            </div>
          )}
          
          {activeTab === 'standings' && (
            <div className="dashboard-tabs-content">
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
                                <span className="standings-team-name">{getCleanTeamName(team.team_name || team.name)}</span>
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
            </div>
          )}
        </div>

        <footer className="dashboard-footer">
          Your predictions are saved securely in the cloud. Compete with friends in leagues!
        </footer>
      </section>
    </main>
  );
};

export default Index;
