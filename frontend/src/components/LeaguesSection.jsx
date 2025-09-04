import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

export const LeaguesSection = () => {
  const { user } = useAuth();
  const [leagues, setLeagues] = useState([]);
  const [myLeagues, setMyLeagues] = useState([]);
  const [newLeague, setNewLeague] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      loadLeagues();
      loadMyLeagues();
    }
  }, [user]);

  const loadLeagues = async () => {
    try {
      const { data, error } = await supabase
        .from('user_leagues')
        .select(`
          id,
          name,
          description,
          created_by,
          league_memberships(count)
        `)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const leaguesWithCount = data?.map(league => ({
        ...league,
        member_count: league.league_memberships?.[0]?.count || 0
      })) || [];

      setLeagues(leaguesWithCount);
    } catch (error) {
      console.error('Error loading leagues:', error);
    }
  };

  const loadMyLeagues = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('league_memberships')
        .select(`
          league_id,
          user_leagues(
            id,
            name,
            description,
            created_by
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;
      
      const myLeaguesList = data?.map(membership => membership.user_leagues).filter(Boolean) || [];
      setMyLeagues(myLeaguesList);
    } catch (error) {
      console.error('Error loading my leagues:', error);
    }
  };

  const createLeague = async (e) => {
    e.preventDefault();
    if (!user || !newLeague.name) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_leagues')
        .insert({
          name: newLeague.name,
          description: newLeague.description || null,
          created_by: user.id,
          is_public: true
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join the creator to the league
      await supabase
        .from('league_memberships')
        .insert({
          league_id: data.id,
          user_id: user.id,
        });

      toast.success('League created successfully!');
      setNewLeague({ name: '', description: '' });
      loadLeagues();
      loadMyLeagues();
    } catch (error) {
      toast.error('Failed to create league');
      console.error('Error creating league:', error);
    } finally {
      setLoading(false);
    }
  };

  const joinLeague = async (leagueId) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('league_memberships')
        .insert({
          league_id: leagueId,
          user_id: user.id,
        });

      if (error) throw error;

      toast.success('Joined league successfully!');
      loadLeagues();
      loadMyLeagues();
    } catch (error) {
      if (error.code === '23505') {
        toast.error('You are already a member of this league');
      } else {
        toast.error('Failed to join league');
      }
      console.error('Error joining league:', error);
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

      <Tabs defaultValue="my-leagues" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-leagues">My Leagues</TabsTrigger>
          <TabsTrigger value="public-leagues">Public Leagues</TabsTrigger>
          <TabsTrigger value="create">Create League</TabsTrigger>
        </TabsList>

        <TabsContent value="my-leagues" className="space-y-4">
          {myLeagues.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center text-muted-foreground">
                  You haven't joined any leagues yet. Create one or join a public league!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {myLeagues.map((league) => (
                <Card key={league.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{league.name}</CardTitle>
                      <Badge variant="secondary">Member</Badge>
                    </div>
                    {league.description && (
                      <CardDescription>{league.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public-leagues" className="space-y-4">
          <div className="grid gap-4">
            {leagues.map((league) => {
              const isMember = myLeagues.some(ml => ml.id === league.id);
              return (
                <Card key={league.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{league.name}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{league.member_count} members</Badge>
                        {isMember ? (
                          <Badge variant="secondary">Joined</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            onClick={() => joinLeague(league.id)}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                    {league.description && (
                      <CardDescription>{league.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New League</CardTitle>
              <CardDescription>
                Create a public league that others can join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={createLeague} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="league-name" className="text-sm font-medium">
                    League Name
                  </label>
                  <Input
                    id="league-name"
                    value={newLeague.name}
                    onChange={(e) => setNewLeague({ ...newLeague, name: e.target.value })}
                    placeholder="Enter league name"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="league-description" className="text-sm font-medium">
                    Description (Optional)
                  </label>
                  <Input
                    id="league-description"
                    value={newLeague.description}
                    onChange={(e) => setNewLeague({ ...newLeague, description: e.target.value })}
                    placeholder="Describe your league"
                  />
                </div>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Creating...' : 'Create League'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
