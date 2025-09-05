import { useState } from 'react';
import { Button } from './ui/button';
import { toast } from 'sonner';

export const AdminMatchControls = () => {
  const [loading, setLoading] = useState(false);

  const refreshAllFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fixtures/refresh?season=2025');
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} fixtures`);
      } else {
        toast.error('Failed to refresh fixtures');
      }
    } catch (error) {
      console.error('Error refreshing fixtures:', error);
      toast.error('Error refreshing fixtures');
    } finally {
      setLoading(false);
    }
  };

  const refreshUpcomingFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fixtures/upcoming?season=2025');
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} upcoming fixtures`);
      } else {
        toast.error('Failed to refresh upcoming fixtures');
      }
    } catch (error) {
      console.error('Error refreshing upcoming fixtures:', error);
      toast.error('Error refreshing upcoming fixtures');
    } finally {
      setLoading(false);
    }
  };

  const refreshResults = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fixtures/results?season=2025');
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} results`);
      } else {
        toast.error('Failed to refresh results');
      }
    } catch (error) {
      console.error('Error refreshing results:', error);
      toast.error('Error refreshing results');
    } finally {
      setLoading(false);
    }
  };

  const refreshLiveFixtures = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/fixtures/live?season=2025');
      const data = await response.json();
      
      if (data.success) {
        toast.success(`Refreshed ${data.stored_count} live fixtures`);
      } else {
        toast.error('Failed to refresh live fixtures');
      }
    } catch (error) {
      console.error('Error refreshing live fixtures:', error);
      toast.error('Error refreshing live fixtures');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="prediction-section">
      <div className="prediction-header">
        <h2 className="prediction-title">Admin Controls</h2>
        <p className="prediction-description">
          Manage fixtures and data from football-data.org API
        </p>
      </div>

      <div className="prediction-card">
        <div className="prediction-actions">
          <div className="grid grid-cols-2 gap-4">
            <Button 
              onClick={refreshUpcomingFixtures} 
              disabled={loading}
              className="btn btn-outline"
            >
              {loading ? 'Refreshing...' : 'Refresh Upcoming Fixtures'}
            </Button>
            <Button 
              onClick={refreshResults} 
              disabled={loading}
              className="btn btn-outline"
            >
              {loading ? 'Refreshing...' : 'Refresh Results'}
            </Button>
            <Button 
              onClick={refreshLiveFixtures} 
              disabled={loading}
              className="btn btn-outline"
            >
              {loading ? 'Refreshing...' : 'Refresh Live Fixtures'}
            </Button>
            <Button 
              onClick={refreshAllFixtures} 
              disabled={loading}
              className="btn btn-primary"
            >
              {loading ? 'Refreshing...' : 'Refresh All Fixtures'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};