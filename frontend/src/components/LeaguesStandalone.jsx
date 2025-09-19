import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import "./LeaguesStandalone.css";

// Icons as simple components
const Plus = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
  </svg>
);

const Users = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
  </svg>
);

const Trophy = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
  </svg>
);

const Copy = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const Check = ({ className = "" }) => (
  <svg className={`icon ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

// Main Component
const LeaguesStandalone = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [newLeagueName, setNewLeagueName] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [copiedCode, setCopiedCode] = useState(null);
  const [leagues, setLeagues] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userPositions, setUserPositions] = useState({});
  const [userPoints, setUserPoints] = useState({});

  // Load user's leagues on component mount
  useEffect(() => {
    if (user) {
      loadMyLeagues();
    }
  }, [user]);

  const loadMyLeagues = async () => {
    if (!user) return;

    try {
      setLoading(true);
      console.log('Loading my leagues...');
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to view leagues');
        return;
      }
      
      const token = session.access_token;
      
      const response = await axios.get(API_ENDPOINTS.LEAGUES_MY_LEAGUES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Load my leagues response:', response.data);
      if (response.data.success) {
        const leaguesData = response.data.data;
        setLeagues(leaguesData);
        
        // Load positions and points for each league
        const positions = {};
        const points = {};
        
        for (const membership of leaguesData) {
          try {
            const leagueResponse = await axios.get(`${API_ENDPOINTS.LEAGUES_DETAILS}/${membership.league.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            const standings = leagueResponse.data.standings || [];
            const userPosition = standings.findIndex(member => member.user_id === user.id) + 1;
            const userMember = standings.find(member => member.user_id === user.id);
            
            positions[membership.league.id] = userPosition || 1;
            points[membership.league.id] = userMember?.total_points || 0;
          } catch (error) {
            console.error(`Error loading position for league ${membership.league.id}:`, error);
            positions[membership.league.id] = 1;
            points[membership.league.id] = 0;
          }
        }
        
        setUserPositions(positions);
        setUserPoints(points);
      } else {
        toast.error(response.data.error || 'Failed to load leagues');
      }
    } catch (error) {
      console.error('Error loading leagues:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please sign in again.');
      } else {
        toast.error('Failed to load leagues');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateLeague = async () => {
    if (!newLeagueName.trim()) {
      toast.error("Please enter a name for your league");
      return;
    }
    
    if (!user) {
      toast.error("Please sign in to create a league");
      return;
    }

    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      const token = session.access_token;
      
      const response = await axios.post(API_ENDPOINTS.LEAGUES_CREATE, {
        name: newLeagueName.trim()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(`League created! Join code: ${response.data.data.join_code}`);
        setNewLeagueName("");
        // Reload leagues to show the new one
        loadMyLeagues();
      } else {
        toast.error(response.data.error || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please sign in again.');
      } else {
        toast.error('Failed to create league');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoinLeague = async () => {
    if (!joinCode.trim()) {
      toast.error("Please enter a join code");
      return;
    }
    
    if (!user) {
      toast.error("Please sign in to join a league");
      return;
    }

    try {
      setLoading(true);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      const token = session.access_token;
      
      const response = await axios.post(API_ENDPOINTS.LEAGUES_JOIN, {
        join_code: joinCode.trim().toUpperCase()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success("Successfully joined the league!");
        setJoinCode("");
        // Reload leagues to show the new one
        loadMyLeagues();
      } else {
        toast.error(response.data.error || 'Failed to join league');
      }
    } catch (error) {
      console.error('Error joining league:', error);
      if (error.response?.status === 401) {
        toast.error('Authentication expired. Please sign in again.');
      } else if (error.response?.status === 404) {
        toast.error('League not found. Please check the join code.');
      } else {
        toast.error('Failed to join league');
      }
    } finally {
      setLoading(false);
    }
  };

  const copyJoinCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success("Join code copied!");
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const openLeaderboard = (leagueId) => {
    navigate(`/league/${leagueId}`);
  };

  // Show loading state
  if (loading && leagues.length === 0) {
    return (
      <div className="leagues-container">
        <div className="leagues-content">
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading your leagues...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="leagues-container">
      <div className="leagues-content">
        {/* Header */}
        <div className="leagues-header">
          <h1 className="leagues-title">
            Premier League Predictions
          </h1>
          <p className="leagues-subtitle">
            Create leagues, make predictions, and compete with friends
          </p>
        </div>

        {/* Create & Join Section */}
        <div className="leagues-actions">
          {/* Create League */}
          <div className="action-card create-card">
            <div className="card-header">
              <div className="card-title">
                <div className="title-icon create-icon">
                  <Plus />
                </div>
                Create New League
              </div>
            </div>
            <div className="card-content">
              <input
                placeholder="Enter league name"
                value={newLeagueName}
                onChange={(e) => setNewLeagueName(e.target.value)}
                className="league-input"
              />
              <button 
                onClick={handleCreateLeague}
                className="action-button create-button"
                disabled={loading}
              >
                {loading ? "Creating..." : "Create League"}
              </button>
            </div>
          </div>

          {/* Join League */}
          <div className="action-card join-card">
            <div className="card-header">
              <div className="card-title">
                <div className="title-icon join-icon">
                  <Users />
                </div>
                Join League
              </div>
            </div>
            <div className="card-content">
              <input
                placeholder="Enter join code"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="league-input"
                maxLength={6}
              />
              <button 
                onClick={handleJoinLeague}
                className="action-button join-button"
                disabled={loading}
              >
                {loading ? "Joining..." : "Join League"}
              </button>
            </div>
          </div>
        </div>

        {/* My Leagues */}
        <div className="my-leagues">
          <div className="leagues-section-header">
            <div className="section-icon">
              <Trophy />
            </div>
            <h2 className="section-title">My Leagues</h2>
          </div>
          
          <div className="leagues-grid">
            {leagues.length === 0 ? (
              <div className="no-leagues">
                <p>You're not in any leagues yet. Create one or join an existing league!</p>
              </div>
            ) : (
              leagues.map((membership, index) => {
                const league = membership.league;
                const position = userPositions[league.id] || 1;
                const points = userPoints[league.id] || 0;
                const memberCount = league.member_count || 0;
                
                return (
                  <div 
                    key={league.id}
                    className="league-card"
                    style={{ animationDelay: `${index * 0.1}s` }}
                    onClick={() => openLeaderboard(league.id)}
                  >
                    <div className="league-card-header">
                      <div className="league-name">{league.name}</div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          copyJoinCode(league.join_code);
                        }}
                        className="join-code-button"
                      >
                        {copiedCode === league.join_code ? (
                          <Check />
                        ) : (
                          <Copy />
                        )}
                        {league.join_code}
                      </button>
                    </div>
                    <div className="league-badge">
                      {memberCount} members
                    </div>
                    <div className="league-stats">
                      <div className="stat-item">
                        <span className="stat-label">Your Position</span>
                        <span className="stat-value position">#{position}</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Your Points</span>
                        <span className="stat-value points">{points}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaguesStandalone;
