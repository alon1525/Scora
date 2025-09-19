import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import "./LeaguePage.css";

// Icons as simple components
const ArrowLeft = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const Trophy = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Medal = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Target = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

// Main Component
const LeaguePage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [league, setLeague] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadLeagueDetails();
    }
  }, [id]);

  const loadLeagueDetails = async () => {
    try {
      setLoading(true);
      
      // Get authentication token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to view league details');
        return;
      }
      
      const token = session.access_token;
      
      const response = await axios.get(`${API_ENDPOINTS.LEAGUES_DETAILS}/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        const { league, standings, members } = response.data.data;
        
        // Set league data with all database fields
        setLeague({
          id: league.id,
          name: league.name,
          code: league.code,
          created_by: league.created_by,
          max_members: league.max_members,
          created_at: league.created_at,
          member_count: members?.length || 0
        });
        
        // Set standings data with all database fields
        setPlayers(standings || []);
      } else {
        toast.error(response.data.error || 'Failed to load league details');
        setLeague(createMockLeagueData());
        setPlayers(createMockPlayersData());
      }
    } catch (error) {
      console.error('Error loading league details:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please sign in again.');
      } else if (error.response?.status === 403) {
        toast.error('You are not a member of this league');
      } else {
        toast.error('Failed to load league details');
      }
      setLeague(createMockLeagueData());
      setPlayers(createMockPlayersData());
    } finally {
      setLoading(false);
    }
  };

  const createMockLeagueData = () => ({
    id: id,
    name: "Sample League",
    code: "ABC123",
    created_by: "mock-user-id",
    max_members: 50,
    created_at: new Date().toISOString(),
    member_count: 8
  });

  const createMockPlayersData = () => [
    { user_id: "1", display_name: "Alex Johnson", total_points: 87, exact_predictions: 15, result_predictions: 8, total_predictions: 25, fixture_points: 53, table_points: 34, rank: 1 },
    { user_id: "2", display_name: "Sarah Chen", total_points: 82, exact_predictions: 12, result_predictions: 10, total_predictions: 24, fixture_points: 46, table_points: 36, rank: 2 },
    { user_id: "3", display_name: "Mike Rodriguez", total_points: 79, exact_predictions: 10, result_predictions: 12, total_predictions: 26, fixture_points: 42, table_points: 37, rank: 3 },
    { user_id: "4", display_name: "Emma Wilson", total_points: 76, exact_predictions: 8, result_predictions: 9, total_predictions: 20, fixture_points: 33, table_points: 43, rank: 4 },
    { user_id: "5", display_name: "David Thompson", total_points: 73, exact_predictions: 7, result_predictions: 11, total_predictions: 22, fixture_points: 32, table_points: 41, rank: 5 },
    { user_id: "6", display_name: "Lisa Anderson", total_points: 68, exact_predictions: 6, result_predictions: 8, total_predictions: 18, fixture_points: 26, table_points: 42, rank: 6 },
    { user_id: "7", display_name: "James Brown", total_points: 65, exact_predictions: 5, result_predictions: 9, total_predictions: 19, fixture_points: 24, table_points: 41, rank: 7 },
    { user_id: "8", display_name: "Anna Davis", total_points: 62, exact_predictions: 4, result_predictions: 7, total_predictions: 16, fixture_points: 19, table_points: 43, rank: 8 },
  ];

  const goBack = () => {
    navigate('/dashboard');
  };

  const openPlayerProfile = (playerId) => {
    navigate(`/user/${playerId}`);
  };

  const getRankIcon = (position) => {
    if (position === 1) return <Trophy className="rank-icon gold" />;
    if (position === 2) return <Medal className="rank-icon silver" />;
    if (position === 3) return <Medal className="rank-icon bronze" />;
    return <span className="rank-number">#{position}</span>;
  };

  const calculateAccuracy = (player) => {
    const exactPredictions = player.exact_predictions || 0;
    const resultPredictions = player.result_predictions || 0;
    const totalPredictions = player.total_predictions || (exactPredictions + resultPredictions);
    
    if (totalPredictions === 0) return 0;
    return Math.round(((exactPredictions + resultPredictions) / totalPredictions) * 100);
  };

  if (loading) {
    return (
      <div className="league-page">
        <div className="league-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading league details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!league) {
    return (
      <div className="league-page">
        <div className="league-content">
          <div className="error-state">
            <h1 className="error-title">League not found</h1>
            <button onClick={goBack} className="back-button">
              Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="league-page">
      <div className="league-content">
        {/* Header */}
        <div className="league-header">
          <button 
            onClick={goBack}
            className="back-button"
          >
            <ArrowLeft />
            <span>Back</span>
          </button>
          <div className="league-info">
            <h1 className="league-title">
              {league.name}
            </h1>
            <p className="league-subtitle">
              {league.member_count || 0} members • Join code: <span className="join-code">{league.code}</span>
              {league.max_members && (
                <span> • Max: {league.max_members}</span>
              )}
              {league.created_at && (
                <span> • Created: {new Date(league.created_at).toLocaleDateString()}</span>
              )}
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="leaderboard-card">
          <div className="leaderboard-header">
            <div className="leaderboard-title">
              <div className="title-icon">
                <Trophy />
              </div>
              Leaderboard
            </div>
          </div>
          <div className="leaderboard-content">
            <div className="players-list">
              {players.map((player, index) => {
                const position = player.rank || (index + 1);
                const accuracy = calculateAccuracy(player);
                const totalPredictions = player.total_predictions || 0;
                const exactPredictions = player.exact_predictions || 0;
                const resultPredictions = player.result_predictions || 0;
                const fixturePoints = player.fixture_points || 0;
                const tablePoints = player.table_points || 0;
                const totalPoints = player.total_points || 0;
                
                return (
                  <div
                    key={player.user_id}
                    onClick={() => openPlayerProfile(player.user_id)}
                    className="player-card"
                    style={{ animationDelay: `${index * 0.05}s` }}
                  >
                    {/* Rank */}
                    <div className="player-rank">
                      {getRankIcon(position)}
                    </div>
                    
                    {/* Player Info */}
                    <div className="player-info">
                      <h3 className="player-name">
                        {player.display_name || 'Unknown User'}
                      </h3>
                      <div className="player-stats">
                        <span className="stat-item">
                          <Target />
                          {accuracy}% accuracy
                        </span>
                        <span className="stat-separator">•</span>
                        <span>{totalPredictions} predictions</span>
                        <span className="stat-separator">•</span>
                        <span>{resultPredictions} results</span>
                        <span className="stat-separator">•</span>
                        <span>{exactPredictions} exacts</span>
                      </div>
                    </div>
                    
                    {/* Scores */}
                    <div className="player-scores">
                      <div className="score-item">
                        <div className="score-value">{fixturePoints}</div>
                        <div className="score-label">Fixture</div>
                      </div>
                      <div className="score-item">
                        <div className="score-value">{tablePoints}</div>
                        <div className="score-label">Table</div>
                      </div>
                      <div className="score-item total-score">
                        <div className="score-value">{totalPoints}</div>
                        <div className="score-label">Total</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* League Stats */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Trophy />
              </div>
              <div className="stat-info">
                <div className="stat-value">{players[0]?.total_points || 0}</div>
                <div className="stat-label">Top Score</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Target />
              </div>
              <div className="stat-info">
                <div className="stat-value">
                  {players.length > 0 ? Math.round(players.reduce((acc, p) => acc + calculateAccuracy(p), 0) / players.length) : 0}%
                </div>
                <div className="stat-label">Avg Accuracy</div>
              </div>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-content">
              <div className="stat-icon">
                <Medal />
              </div>
              <div className="stat-info">
                <div className="stat-value">{league.member_count || 0}</div>
                <div className="stat-label">Total Members</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaguePage;