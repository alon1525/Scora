import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

const UserScore = ({ refreshTrigger }) => {
  const { user } = useAuth();
  const [userScores, setUserScores] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserScores();
    }
  }, [user, refreshTrigger]);

  const fetchUserScores = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await fetch(`http://localhost:3001/api/predictions/scores`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      console.log('User scores response:', data);
      
      if (data.success) {
        setUserScores(data.scores);
      } else {
        console.error('Failed to fetch scores:', data.error);
      }
    } catch (error) {
      console.error('Error fetching user scores:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return null;
  }

  if (loading) {
    return (
      <div className="user-score-section">
        <Card className="user-score-card">
          <CardContent className="text-center py-8">
            <p>Loading your score...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!userScores) {
    return (
      <div className="user-score-section">
        <Card className="user-score-card">
          <CardHeader>
            <CardTitle className="text-center">Your Score</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8">
            <p>No scores yet. Make some predictions to get started!</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="user-score-section">
      <Card className="user-score-card">
        <CardHeader>
          <CardTitle className="text-center">Your Score</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-blue-500">{userScores.fixture_points}</div>
              <div className="text-sm text-gray-600">Fixture Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-500">{userScores.table_points}</div>
              <div className="text-sm text-gray-600">Table Points</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-500">{userScores.total_points}</div>
              <div className="text-sm text-gray-600">Total Points</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export { UserScore };
