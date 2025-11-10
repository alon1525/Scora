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
import { Button } from "../components/ui/button";
import { useNavigate, Link } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import backgroundImage from "../assets/background-picture.webp";
import signOutIcon from "../assets/sign-out.png";
import scoraLogo from "../assets/Scora_Logo.png";

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
  const hasLoadedAllData = useRef(false); // Track if we've already loaded all data
  
  // Preloaded data for all tabs
  const [preloadedData, setPreloadedData] = useState({
    standings: null,
    leaderboard: null,
    userStats: null,
    userScores: null,
    leagues: null,
    fixtures: {},
    tablePredictions: null,
    deadlineStatus: null,
    predictions: {},
    loading: true,
    error: null
  });

  useEffect(() => {
    document.title = "Scora";
  }, []);

  // Comprehensive data loading function
  const loadAllData = async () => {
    if (!user || hasLoadedAllData.current) return; // Don't load if already loaded
    
    hasLoadedAllData.current = true; // Mark as loading
    setPreloadedData(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      };

      // Load leaderboard first (priority)
      const leaderboardResponse = await axios.get(`${API_ENDPOINTS.LEADERBOARD}?limit=50`);

      // Load standings to get current matchweek
      const standingsResponse = await axios.get(API_ENDPOINTS.STANDINGS);
      
      let currentMatchday = 1;
      if (standingsResponse.data?.success) {
        currentMatchday = standingsResponse.data.currentMatchday || 1;
      }
      const fixturesPromises = [];
      const startMatchday = Math.max(1, currentMatchday - 1);
      const endMatchday = Math.min(38, currentMatchday + 1);
      
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

      // Load other data in parallel
      const [
        userScoresResponse,
        userStatsResponse,
        leaguesResponse,
        tablePredictionsResponse,
        deadlineStatusResponse
      ] = await Promise.allSettled([
        axios.get(API_ENDPOINTS.USER_SCORES, { headers }),
        axios.get(`${API_ENDPOINTS.USER_STATS}/${user.id}`, { headers }),
        axios.get(API_ENDPOINTS.LEAGUES_MY_LEAGUES, { headers }),
        axios.get(API_ENDPOINTS.TABLE_PREDICTIONS, { headers }),
        axios.get(`${API_ENDPOINTS.PREDICTIONS}/deadline-status`, { headers })
      ]);

      // Process standings (already loaded above)
      let standings = null;
      if (standingsResponse.data?.success) {
        standings = standingsResponse.data.standingsData;
        setStandingsData(standings);
        setLastUpdated(standingsResponse.data?.lastUpdated || "");
      }

      // Process leaderboard (already loaded above)
      let leaderboard = null;
      if (leaderboardResponse.data?.success) {
        leaderboard = leaderboardResponse.data.leaderboard;
      }

      // Process user scores
      let userScores = null;
      if (userScoresResponse.status === 'fulfilled' && userScoresResponse.value.data?.success) {
        userScores = userScoresResponse.value.data.scores;
      }

      // Process user stats
      let userStats = null;
      if (userStatsResponse.status === 'fulfilled' && userStatsResponse.value.data?.success) {
        userStats = userStatsResponse.value.data.data;
      }

      // Process leagues
      let leagues = null;
      if (leaguesResponse.status === 'fulfilled' && leaguesResponse.value.data?.success) {
        leagues = leaguesResponse.value.data.leagues;
      }

      // Process table predictions
      let tablePredictions = null;
      if (tablePredictionsResponse.status === 'fulfilled' && tablePredictionsResponse.value.data?.success) {
        tablePredictions = tablePredictionsResponse.value.data.prediction;
      }

      // Process deadline status
      let deadlineStatus = null;
      if (deadlineStatusResponse.status === 'fulfilled' && deadlineStatusResponse.value.data?.success) {
        deadlineStatus = {
          canUpdate: deadlineStatusResponse.value.data.canUpdate,
          reason: deadlineStatusResponse.value.data.reason,
          deadline: deadlineStatusResponse.value.data.deadline ? new Date(deadlineStatusResponse.value.data.deadline) : null
        };
      }

      setPreloadedData({
        standings,
        leaderboard,
        userStats,
        userScores,
        leagues,
        fixtures,
        currentMatchday,
        tablePredictions,
        deadlineStatus,
        predictions: {},
        loading: false,
        error: null
      });

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

  // Load all data when user is authenticated (only once)
  useEffect(() => {
    if (!authLoading && user && !hasLoadedAllData.current) {
      loadAllData();
    }
  }, [authLoading, user]);

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
            <div className="nav-logo" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <img src={scoraLogo} alt="Scora" className="nav-logo-image" />
            </div>
          </div>
          <div className="nav-right">
            <div className="nav-user">
              <div 
                className="nav-avatar clickable-avatar"
                onClick={() => navigate(`/user/${user.id}`)}
                title="View Profile"
              >
                {user?.user_metadata?.full_name?.charAt(0) || user?.email?.charAt(0) || '?'}
              </div>
              <span 
                className="nav-username clickable-username"
                onClick={() => navigate(`/user/${user.id}`)}
                title="View Profile"
              >
                {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'}
              </span>
            </div>
            <button className="nav-signout" onClick={handleSignOut} title="Sign Out">
              <span className="material-symbols-outlined">logout</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Dashboard Header */}
      <header className="dashboard-header-section">
        <div className="dashboard-header-background"></div>
        <div className="dashboard-header-gradient"></div>
        <div className="header-container">
          <div className="header-content">
            <div className="header-greeting">
              <div className="header-greeting-icon">
                <span className="material-symbols-outlined">waving_hand</span>
              </div>
              <div className="header-greeting-text">
                <span className="header-greeting-label">Welcome back</span>
                <span className="header-greeting-name">
                  {user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Player'}
                </span>
              </div>
            </div>
            <div className="header-quick-stats">
              {preloadedData?.userStats && (
                <>
                  <div className="header-quick-stat-card">
                    <div className="header-quick-stat-icon">
                      <span className="material-symbols-outlined">emoji_events</span>
                    </div>
                    <div className="header-quick-stat-content">
                      <span className="header-quick-stat-value">#{preloadedData.userStats.globalRank || '-'}</span>
                      <span className="header-quick-stat-label">Global Rank</span>
                    </div>
                  </div>
                  <div className="header-quick-stat-card">
                    <div className="header-quick-stat-icon">
                      <span className="material-symbols-outlined">check_circle</span>
                    </div>
                    <div className="header-quick-stat-content">
                      <span className="header-quick-stat-value">{preloadedData.userStats.exact_predictions || 0}</span>
                      <span className="header-quick-stat-label">Exact Predictions</span>
                    </div>
                  </div>
                  <div className="header-quick-stat-card">
                    <div className="header-quick-stat-icon">
                      <span className="material-symbols-outlined">star</span>
                    </div>
                    <div className="header-quick-stat-content">
                      <span className="header-quick-stat-value">{preloadedData.userStats.total_points || 0}</span>
                      <span className="header-quick-stat-label">Total Points</span>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className="header-achievements-section">
              {preloadedData?.userStats?.achievements && preloadedData.userStats.achievements.length > 0 ? (
                <div className="header-achievements-container">
                  <div className="header-achievements-header">
                    <span className="material-symbols-outlined header-achievements-icon">emoji_events</span>
                    <div className="header-achievements-title">
                      <span className="header-achievements-label">Achievements</span>
                      <span className="header-achievements-count">
                        {preloadedData.userStats.achievements.length}
                      </span>
                    </div>
                  </div>
                  <div className="header-achievements-badges">
                    {preloadedData.userStats.achievements.slice(0, 5).map((achievement, index) => (
                      <div 
                        key={index} 
                        className="header-achievement-badge"
                        title={achievement.name}
                      >
                        <span className="material-symbols-outlined">{achievement.icon || 'emoji_events'}</span>
                      </div>
                    ))}
                    {preloadedData.userStats.achievements.length > 5 && (
                      <div className="header-achievement-badge header-achievement-more" title={`${preloadedData.userStats.achievements.length - 5} more achievements`}>
                        +{preloadedData.userStats.achievements.length - 5}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="header-achievements-container header-achievements-loading">
                  <div className="header-achievements-header">
                    <span className="material-symbols-outlined header-achievements-icon">emoji_events</span>
                    <div className="header-achievements-title">
                      <span className="header-achievements-label">Achievements</span>
                      <span className="header-achievements-count">-</span>
                    </div>
                  </div>
                  <div className="header-achievements-badges">
                    <div className="header-achievement-badge header-achievement-placeholder"></div>
                    <div className="header-achievement-badge header-achievement-placeholder"></div>
                    <div className="header-achievement-badge header-achievement-placeholder"></div>
                  </div>
                </div>
              )}
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
              <UserTablePredictions onPredictionSaved={triggerScoreRefresh} preloadedData={preloadedData} />
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
                <h3 className="standings-title">Premier League</h3>
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
                      <th className="standings-mobile-show">P</th>
                      <th className="standings-mobile-hide">W</th>
                      <th className="standings-mobile-hide">D</th>
                      <th className="standings-mobile-hide">L</th>
                      <th>Goal</th>
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
                            <td className="standings-stats standings-mobile-show">{team.played || 0}</td>
                            <td className="standings-stats standings-mobile-hide">{team.wins || 0}</td>
                            <td className="standings-stats standings-mobile-hide">{team.draws || 0}</td>
                            <td className="standings-stats standings-mobile-hide">{team.losses || 0}</td>
                            <td className="standings-stats standings-goal">
                              {team.goals_for || team.goalsFor || 0}:{team.goals_against || team.goalsAgainst || 0}
                            </td>
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
