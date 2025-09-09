import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

export const LeaguesSection = ({ preloadedData }) => {
  const { user } = useAuth();
  const [myLeagues, setMyLeagues] = useState([]);
  const [newLeague, setNewLeague] = useState({ name: '' });
  const [joinCode, setJoinCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedLeague, setSelectedLeague] = useState(null);
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

  const viewLeagueDetails = async (leagueId) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.get(`${API_ENDPOINTS.LEAGUES_DETAILS}/${leagueId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setSelectedLeague(response.data.data);
      }
    } catch (error) {
      console.error('Error loading league details:', error);
      toast.error('Failed to load league details');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Leagues</h2>
        <p className="text-muted-foreground">
          Create or join leagues to compete with friends
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ 
        display: 'flex', 
        flexDirection: 'row', 
        gap: '16px', 
        alignItems: 'flex-start',
        justifyContent: 'center',
        flexWrap: 'wrap'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)', 
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 12px var(--shadow-light)',
          minWidth: '280px'
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-primary)', 
            marginBottom: '4px' 
          }}>
            Join League
          </label>
          <input
            type="text"
            value={joinCode}
            onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
            placeholder="Enter 8-character code"
            maxLength={8}
            className="form-input"
            style={{ fontFamily: 'monospace', textAlign: 'center', padding: '8px 12px' }}
          />
          <button 
            onClick={joinLeague}
            disabled={loading || !joinCode || joinCode.length !== 8}
            className="btn btn-outline"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {loading ? 'Joining...' : 'Join League'}
          </button>
        </div>
        
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '8px', 
          padding: '16px', 
          backgroundColor: 'var(--bg-card)', 
          border: '1px solid var(--border-light)', 
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 4px 12px var(--shadow-light)',
          minWidth: '280px'
        }}>
          <label style={{ 
            display: 'block', 
            fontSize: '14px', 
            fontWeight: '500', 
            color: 'var(--text-primary)', 
            marginBottom: '4px' 
          }}>
            Create League
          </label>
          <input
            type="text"
            value={newLeague.name}
            onChange={(e) => setNewLeague({ name: e.target.value })}
            placeholder="Enter league name"
            className="form-input"
            style={{ padding: '8px 12px' }}
          />
          <button 
            onClick={createLeague}
            disabled={loading || !newLeague.name.trim()}
            className="btn btn-primary"
            style={{ padding: '8px 16px', fontSize: '14px' }}
          >
            {loading ? 'Creating...' : 'Create League'}
          </button>
        </div>
      </div>

      {/* Leagues Table */}
      <Card>
        <CardHeader>
          <CardTitle>My Leagues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="standings-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>League Code</th>
                  <th>League Name</th>
                  <th>Members</th>
                  <th>Your Position</th>
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {myLeagues.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center text-muted-foreground py-8">
                      You haven't joined any leagues yet. Create one or join a league with a code!
                    </td>
                  </tr>
                ) : (
                  myLeagues.map((membership, index) => (
                    <tr 
                      key={membership.league.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => viewLeagueDetails(membership.league.id)}
                    >
                      <td>{index + 1}</td>
                      <td className="font-mono text-sm">{membership.league.code}</td>
                      <td className="font-medium">{membership.league.name}</td>
                      <td>{membership.league.member_count}</td>
                      <td>
                        <Badge variant="outline">
                          {userPositions[membership.league.id] ? `${userPositions[membership.league.id]}${getOrdinalSuffix(userPositions[membership.league.id])}` : 'Loading...'}
                        </Badge>
                      </td>
                      <td>
                        <Badge variant={membership.role === 'owner' ? 'default' : 'secondary'}>
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

      {/* League Details Modal */}
      {selectedLeague && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">{selectedLeague.league.name}</CardTitle>
                  <CardDescription>Code: {selectedLeague.league.code}</CardDescription>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setSelectedLeague(null)}
                >
                  Close
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* League Info */}
              <div>
                <h3 className="font-semibold mb-2">League Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Members:</span>
                    <span className="ml-2 font-medium">{selectedLeague.members.length}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Max Members:</span>
                    <span className="ml-2 font-medium">{selectedLeague.league.max_members}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <span className="ml-2 font-medium">
                      {new Date(selectedLeague.league.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Your Role:</span>
                    <span className="ml-2 font-medium capitalize">{selectedLeague.membership.role}</span>
                  </div>
                </div>
              </div>

              {/* Standings */}
              <div>
                <h3 className="font-semibold mb-3">League Standings</h3>
                <div className="space-y-2">
                  {selectedLeague.standings.map((member, index) => (
                    <div 
                      key={member.user_id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        member.user_id === user?.id ? 'bg-blue-50 border-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold">
                          {member.rank}
                        </div>
                        <div>
                          <div className="font-medium">
                            {member.user?.display_name || member.user?.email?.split('@')[0] || 'Unknown User'}
                            {member.user_id === user?.id && ' (You)'}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="text-center">
                          <div className="font-bold text-lg">{member.total_points || 0}</div>
                          <div className="text-muted-foreground">Points</div>
                        </div>
                        <div className="text-center">
                          <div className="font-bold text-lg">{member.exact_predictions || 0}</div>
                          <div className="text-muted-foreground">Exact</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};
