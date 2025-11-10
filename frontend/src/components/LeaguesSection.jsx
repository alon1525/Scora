import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { toast } from 'sonner';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { sanitizeLeagueName, checkFormSubmissionLimit, checkApiRateLimit } from '../utils/validation';
import './LeaguesSection.css';

export const LeaguesSection = ({ preloadedData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myLeagues, setMyLeagues] = useState([]);
  const [newLeague, setNewLeague] = useState({ name: '' });
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPositions, setUserPositions] = useState({});
  const [leagueValidationError, setLeagueValidationError] = useState('');

  const getOrdinalSuffix = (num) => {
    const j = num % 10;
    const k = num % 100;
    if (j === 1 && k !== 11) {
      return "st";
    }
    if (j === 2 && k !== 12) {
      return "nd";
    }
    if (j === 3 && k !== 13) {
      return "rd";
    }
    return "th";
  };

  useEffect(() => {
    if (user) {
      // Use preloaded data if available
      if (preloadedData?.leagues) {
        console.log('✅ Using preloaded leagues data');
        setMyLeagues(preloadedData.leagues);
        // Also load positions for each league (this is lightweight)
        loadUserPositions(preloadedData.leagues);
      } else if (preloadedData?.loading === false) {
        // Only load if preloaded data has finished loading and leagues weren't included
        // This prevents duplicate loading while Index.jsx is still loading
        loadMyLeagues();
      }
      // If preloadedData.loading is true, wait for it to finish
    }
  }, [user, preloadedData]);

  // Load user positions for leagues (extracted for reuse)
  const loadUserPositions = async (leaguesData) => {
    if (!user || !leaguesData || leaguesData.length === 0) return;

    try {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        console.error('Session error:', sessionError);
        return;
      }
      
      const token = session.access_token;
      const positions = {};
      
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
          positions[membership.league.id] = userPosition || 1;
        } catch (error) {
          console.error(`Error loading position for league ${membership.league.id}:`, error);
          positions[membership.league.id] = 1;
        }
      }
      setUserPositions(positions);
    } catch (error) {
      console.error('Error loading user positions:', error);
    }
  };

  const loadMyLeagues = async () => {
    if (!user) return;

    try {
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
      console.log('Token for loadMyLeagues:', token ? 'Yes' : 'No');
      
      const response = await axios.get(API_ENDPOINTS.LEAGUES_MY_LEAGUES, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Load my leagues response:', response.data);
      if (response.data.success) {
        setMyLeagues(response.data.data);
        // Load positions for each league
        loadUserPositions(response.data.data);
      }
    } catch (error) {
      console.error('Error loading my leagues:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 401) {
          toast.error('Authentication expired. Please sign in again.');
        } else {
          toast.error(error.response.data.error || 'Failed to load leagues');
        }
      } else {
        toast.error('Failed to load leagues');
      }
    }
  };

  const createLeague = async () => {
    if (!user || !newLeague.name) return;

    // Check rate limiting
    if (!checkFormSubmissionLimit('create-league', user.id)) {
      toast.error('Too many league creation attempts. Please wait a moment.');
      return;
    }

    // Validate league name
    const validation = sanitizeLeagueName(newLeague.name);
    if (!validation.isValid) {
      if (validation.hasProfanity) {
        setLeagueValidationError('League name contains inappropriate content');
      } else if (validation.sanitized.length === 0) {
        setLeagueValidationError('League name is required');
      } else if (validation.sanitized.length > 12) {
        setLeagueValidationError('League name must be 12 characters or less');
      } else {
        setLeagueValidationError('League name can only contain letters, numbers, and spaces');
      }
      return;
    }
    
    if (myLeagues.length >= 5) {
      toast.error('You can only be in 5 leagues maximum');
      return;
    }

    setLoading(true);
    try {
      console.log('Creating league with name:', newLeague.name);
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        toast.error('Authentication error. Please sign in again.');
        return;
      }
      
      if (!session) {
        console.error('No session found');
        toast.error('Please sign in to create leagues');
        return;
      }
      
      const token = session.access_token;
      console.log('Token obtained:', token ? 'Yes' : 'No');
      
      const response = await axios.post(API_ENDPOINTS.LEAGUES_CREATE, {
        name: newLeague.name
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('Create league response:', response.data);
      if (response.data.success) {
        toast.success(`League created successfully! Code: ${response.data.data.league.code}`);
        setNewLeague({ name: '' });
        loadMyLeagues();
      } else {
        toast.error(response.data.error || 'Failed to create league');
      }
    } catch (error) {
      console.error('Error creating league:', error);
      if (error.response) {
        console.error('Error response:', error.response.data);
        if (error.response.status === 401) {
          toast.error('Authentication expired. Please sign in again.');
        } else {
          toast.error(error.response.data.error || 'Failed to create league');
        }
      } else {
        toast.error('Failed to create league');
      }
    } finally {
      setLoading(false);
    }
  };

  const joinLeague = async () => {
    if (!user || !joinCode) return;

    // Check rate limiting
    if (!checkFormSubmissionLimit('join-league', user.id)) {
      toast.error('Too many join attempts. Please wait a moment.');
      return;
    }

    if (myLeagues.length >= 5) {
      toast.error('You can only be in 5 leagues maximum');
      return;
    }

    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.post(API_ENDPOINTS.LEAGUES_JOIN, {
        code: joinCode.trim().toUpperCase()
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        toast.success(`Joined ${response.data.data.league.name} successfully!`);
        setJoinCode('');
        loadMyLeagues();
      }
    } catch (error) {
      if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error('Failed to join league');
      }
      console.error('Error joining league:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewLeagueDetails = (leagueId) => {
    navigate(`/league/${leagueId}`);
  };

  return (
    <div className="leagues-section space-y-6">
      {/* Action Buttons */}
      <div className="leagues-action-container" style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '12px', 
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div className="league-action-card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          padding: '12px', 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)', 
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px var(--shadow-light)',
          flex: '1',
          minWidth: '200px',
          maxWidth: '300px'
        }}>
          <label className="league-action-label" style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '500', 
            color: 'var(--text-primary)', 
            marginBottom: '3px' 
          }}>
            Join League
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="8-char code"
            maxLength={8}
            className="form-input league-action-input"
            style={{ fontFamily: 'monospace', textAlign: 'center', padding: '6px 8px', fontSize: '13px' }}
          />
          <button 
            onClick={joinLeague}
            disabled={loading || !joinCode || joinCode.length !== 8 || myLeagues.length >= 5}
            className="btn btn-outline league-action-button"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            {loading ? 'Joining...' : myLeagues.length >= 5 ? 'Max 5 leagues' : 'Join'}
          </button>
        </div>
        
        <div className="league-action-card" style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '6px', 
          padding: '12px', 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)', 
          borderRadius: 'var(--radius-md)',
          boxShadow: '0 2px 8px var(--shadow-light)',
          flex: '1',
          minWidth: '200px',
          maxWidth: '300px'
        }}>
          <label className="league-action-label" style={{ 
            display: 'block', 
            fontSize: '13px', 
            fontWeight: '500', 
            color: 'var(--text-primary)', 
            marginBottom: '3px' 
          }}>
            Create League
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <input
              type="text"
              value={newLeague.name}
              onChange={(e) => {
                const newName = e.target.value;
                setNewLeague({ name: newName });
                const validation = sanitizeLeagueName(newName);
                if (!validation.isValid && newName.length > 0) {
                  if (validation.hasProfanity) {
                    setLeagueValidationError('Inappropriate content');
                  } else {
                    setLeagueValidationError('Invalid characters');
                  }
                } else {
                  setLeagueValidationError('');
                }
              }}
              placeholder="League name (max 12 chars)"
              maxLength={12}
              className={`form-input league-action-input ${leagueValidationError ? 'error' : ''}`}
              style={{ 
                padding: '6px 8px', 
                fontSize: '13px',
                border: leagueValidationError ? '1px solid #ef4444' : undefined
              }}
            />
            {leagueValidationError && (
              <div style={{ color: '#ef4444', fontSize: '11px' }}>
                {leagueValidationError}
              </div>
            )}
          </div>
          <button 
            onClick={createLeague}
            disabled={loading || !newLeague.name.trim() || myLeagues.length >= 5 || leagueValidationError}
            className="btn btn-primary league-action-button"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            {loading ? 'Creating...' : myLeagues.length >= 5 ? 'Max 5 leagues' : 'Create'}
          </button>
        </div>
      </div>

      {/* My Leagues Cards */}
      <div className="my-leagues-section">
        <div className="leagues-section-header">
          <div className="section-icon">
            <span className="material-symbols-outlined text-2xl">emoji_events</span>
          </div>
          <h2 className="section-title">My Leagues ({myLeagues.length}/5)</h2>
        </div>
        
        <div className="leagues-grid">
          {myLeagues.length === 0 ? (
            <div className="no-leagues">
              <div className="no-leagues-icon">
                <span className="material-symbols-outlined text-6xl text-gray-300">groups</span>
              </div>
              <div className="no-leagues-text">
                <p className="no-leagues-title">No leagues yet</p>
                <p className="no-leagues-subtitle">Create one or join a league with a code!</p>
              </div>
            </div>
          ) : (
            myLeagues.map((membership, index) => {
              const league = membership.league;
              const position = userPositions[league.id] || 1;
              const memberCount = league.member_count || 0;
              
              return (
                <div 
                  key={league.id}
                  className="league-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                  onClick={() => viewLeagueDetails(league.id)}
                >
                  <div className="league-card-header">
                    <div className="league-name">{league.name.length > 12 ? league.name.substring(0, 12) + '...' : league.name}</div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigator.clipboard.writeText(league.code);
                        toast.success("Join code copied!");
                      }}
                      className="join-code-button"
                    >
                      <svg className="icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      {league.code}
                    </button>
                  </div>
                  <div className="league-badge">
                    {memberCount} members
                  </div>
                  <div className="league-stats">
                    <div className="stat-item">
                      <span className="stat-label">Your Position</span>
                      <span className="stat-value position">#{position}{getOrdinalSuffix(position)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Role</span>
                      <span className="stat-value role">{membership.role === 'owner' ? 'Owner' : 'Member'}</span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

    </div>
  );
};
