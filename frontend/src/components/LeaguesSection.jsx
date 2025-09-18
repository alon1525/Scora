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

export const LeaguesSection = ({ preloadedData }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myLeagues, setMyLeagues] = useState([]);
  const [newLeague, setNewLeague] = useState({ name: '' });
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [userPositions, setUserPositions] = useState({});

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
      } else {
        loadMyLeagues();
      }
    }
  }, [user, preloadedData]);

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
        const positions = {};
        for (const membership of response.data.data) {
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
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900">Leagues</h2>
        <p className="text-muted-foreground">
          Create or join leagues to compete with friends
        </p>
        <div className="text-sm text-blue-600 bg-blue-50 px-3 py-2 rounded-lg inline-block">
          <span className="font-semibold">Limit:</span> Maximum 5 leagues per user
        </div>
      </div>

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
            disabled={loading || !joinCode || joinCode.length !== 8}
            className="btn btn-outline league-action-button"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            {loading ? 'Joining...' : 'Join'}
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
          <input
            type="text"
            value={newLeague.name}
            onChange={(e) => setNewLeague({ name: e.target.value })}
            placeholder="League name"
            className="form-input league-action-input"
            style={{ padding: '6px 8px', fontSize: '13px' }}
          />
          <button 
            onClick={createLeague}
            disabled={loading || !newLeague.name.trim()}
            className="btn btn-primary league-action-button"
            style={{ padding: '6px 12px', fontSize: '13px' }}
          >
            {loading ? 'Creating...' : 'Create'}
          </button>
        </div>
      </div>

      {/* Leagues Table */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50">
          <CardTitle className="text-xl font-bold text-gray-900 flex items-center">
            <span className="material-symbols-outlined text-blue-600 mr-2 text-lg">groups</span>
            My Leagues ({myLeagues.length}/5)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full standings-table">
              <thead>
                <tr className="border-b-2 border-gray-200 bg-gray-50">
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">#</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">League Code</th>
                  <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">League Name</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Members</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Your Position</th>
                  <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm uppercase tracking-wider">Role</th>
                </tr>
              </thead>
              <tbody>
                {myLeagues.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-gray-500 py-12">
                      <div className="flex flex-col items-center space-y-3">
                        <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        <div>
                          <p className="text-lg font-medium text-gray-900">No leagues yet</p>
                          <p className="text-sm text-gray-500">Create one or join a league with a code!</p>
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  myLeagues.map((membership, index) => (
                    <tr 
                      key={membership.league.id} 
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200"
                      onClick={() => viewLeagueDetails(membership.league.id)}
                    >
                      <td className="py-4 px-4">
                        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 font-semibold text-sm">
                          {index + 1}
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-3 py-1 rounded-lg font-semibold text-gray-700">
                          {membership.league.code}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {membership.league.name?.charAt(0) || 'L'}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900">{membership.league.name}</div>
                            <div className="text-sm text-gray-500">Click to view details</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {membership.league.member_count || 0}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant="outline" className="text-sm font-semibold">
                          {userPositions[membership.league.id] ? `${userPositions[membership.league.id]}${getOrdinalSuffix(userPositions[membership.league.id])}` : 'Loading...'}
                        </Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'} className="text-sm font-semibold">
                          {membership.role === 'owner' ? 'Owner' : 'Member'}
                        </Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
};
