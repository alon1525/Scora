import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';
import { supabase } from '../integrations/supabase/client';

// Check if user can still update predictions
export const checkPredictionDeadline = async () => {
  try {
    // Get auth token
    const session = await supabase.auth.getSession();
    const token = session.data.session?.access_token;
    
    if (!token) {
      console.error('No auth token available');
      return {
        canUpdate: false,
        reason: 'Please log in to check deadline status',
        deadline: null
      };
    }

    console.log('Checking deadline status...');
    const response = await axios.get(`${API_ENDPOINTS.PREDICTIONS}/deadline-status`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Deadline status response:', response.data);

    if (response.data.success) {
      return {
        canUpdate: response.data.canUpdate,
        reason: response.data.reason,
        deadline: response.data.deadline ? new Date(response.data.deadline) : null
      };
    } else {
      console.error('API returned error:', response.data.error);
      return {
        canUpdate: false,
        reason: response.data.error || 'Error checking deadline status',
        deadline: null
      };
    }
  } catch (error) {
    console.error('Error checking prediction deadline:', error);
    console.error('Error details:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    return {
      canUpdate: false,
      reason: `Error: ${error.message}`,
      deadline: null
    };
  }
};

// Format deadline for display
export const formatDeadline = (deadline) => {
  if (!deadline) return null;
  
  const now = new Date();
  const diff = deadline - now;
  
  if (diff <= 0) {
    return 'Deadline has passed';
  }
  
  // Calculate days by comparing dates (not time differences)
  const deadlineDate = new Date(deadline);
  const nowDate = new Date(now);
  
  // Set both dates to start of day for accurate day comparison
  deadlineDate.setHours(0, 0, 0, 0);
  nowDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.ceil((deadlineDate - nowDate) / (1000 * 60 * 60 * 24));
  
  if (daysDiff > 1) {
    return `${daysDiff} days remaining`;
  } else if (daysDiff === 1) {
    // For same day or next day, show hours
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
  } else {
    // Same day - show hours/minutes
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours} hour${hours > 1 ? 's' : ''} remaining`;
    } else {
      return `${minutes} minute${minutes > 1 ? 's' : ''} remaining`;
    }
  }
};

// Get deadline status message for UI
export const getDeadlineMessage = (deadlineStatus) => {
  if (deadlineStatus.canUpdate) {
    return {
      type: 'info',
      message: deadlineStatus.reason,
      showCountdown: true
    };
  } else {
    return {
      type: 'error',
      message: deadlineStatus.reason,
      showCountdown: false
    };
  }
};