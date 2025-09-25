import { useEffect, useState } from "react";
import { TEAMS } from "../data/teams";
import { toast } from "sonner";
import { supabase } from "../integrations/supabase/client";
import { useAuth } from "../contexts/AuthContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
} from "@hello-pangea/dnd";
import axios from "axios";
import { API_ENDPOINTS } from "../config/api";
import { checkPredictionDeadline, formatDeadline, getDeadlineMessage } from "../utils/predictionDeadline";

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const UserTablePredictions = ({ onPredictionSaved, preloadedData }) => {
  const { user } = useAuth();
  const defaultOrder = TEAMS.map((t) => t.id);
  const [userOrder, setUserOrder] = useState(defaultOrder);
  const [loading, setLoading] = useState(false);
  const [deadlineStatus, setDeadlineStatus] = useState({ canUpdate: true, reason: '', deadline: null });
  const [deadlineCountdown, setDeadlineCountdown] = useState(null);

  // Load user's predictions
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (!user) return;

      // Use preloaded data if available
      if (preloadedData?.tablePredictions) {
        console.log('✅ Using preloaded table predictions data');
        const savedOrder = preloadedData.tablePredictions;
        // Filter to only include teams that exist in current TEAMS array
        const validOrder = savedOrder.filter(id => TEAMS.some(t => t.id === id));
        if (validOrder.length === 20) {
          setUserOrder(validOrder);
        }
        return;
      }

      // Fallback to API call if no preloaded data
      try {
        const token = (await supabase.auth.getSession()).data.session?.access_token;
        const response = await axios.get(API_ENDPOINTS.TABLE_PREDICTIONS, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        const data = response.data;
        
        if (data.success && data.prediction) {
          const savedOrder = data.prediction;
          // Filter to only include teams that exist in current TEAMS array
          const validOrder = savedOrder.filter(id => TEAMS.some(t => t.id === id));
          if (validOrder.length === 20) {
            setUserOrder(validOrder);
          }
        }
      } catch (error) {
        console.error('Error loading user predictions:', error);
      }
    };

    loadUserPredictions();
  }, [user, preloadedData]);

  // Check prediction deadline status
  useEffect(() => {
    if (user) {
      // Use preloaded deadline status if available
      if (preloadedData?.deadlineStatus) {
        console.log('✅ Using preloaded deadline status data');
        setDeadlineStatus(preloadedData.deadlineStatus);
        if (preloadedData.deadlineStatus.deadline) {
          setDeadlineCountdown(formatDeadline(preloadedData.deadlineStatus.deadline));
        }
        return;
      }

      // Fallback to API call if no preloaded data
      checkPredictionDeadline().then(status => {
        setDeadlineStatus(status);
        if (status.deadline) {
          setDeadlineCountdown(formatDeadline(status.deadline));
        }
      });
    }
  }, [user, preloadedData]);

  // Update countdown every minute
  useEffect(() => {
    if (deadlineStatus.deadline) {
      const interval = setInterval(() => {
        setDeadlineCountdown(formatDeadline(deadlineStatus.deadline));
      }, 60000); // Update every minute

      return () => clearInterval(interval);
    }
  }, [deadlineStatus.deadline]);

  const savePredictions = async () => {
    if (!user) return;

    // Check if user can still update predictions
    if (!deadlineStatus.canUpdate) {
      toast.error(deadlineStatus.reason);
      return;
    }

    setLoading(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const response = await axios.post(API_ENDPOINTS.TABLE_PREDICTIONS, {
        table_order: userOrder
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = response.data;
      
      if (data.success) {
        toast.success("Your predictions have been saved!");
        
        // Recalculate scores after saving prediction
        try {
          const scoreResponse = await axios.post(`${API_ENDPOINTS.RECALCULATE_USER}/${user.id}`, {}, {
            headers: {
              'Content-Type': 'application/json'
            }
          });
          
          console.log('✅ Scores recalculated after prediction save');
        } catch (scoreError) {
          console.error('❌ Error recalculating scores:', scoreError);
        }
        
        // Trigger score refresh in parent component
        if (onPredictionSaved) {
          onPredictionSaved();
        }
      } else {
        toast.error(data.error || "Failed to save predictions. Please try again.");
      }
    } catch (error) {
      console.error('Error saving predictions:', error);
      toast.error("Failed to save predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    setUserOrder((prev) => reorder(prev, source.index, destination.index));
  };

  const moveTeam = (teamId, direction) => {
    setUserOrder((prev) => {
      const currentIndex = prev.indexOf(teamId);
      const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
      
      if (newIndex < 0 || newIndex >= prev.length) return prev;
      
      const newOrder = [...prev];
      [newOrder[currentIndex], newOrder[newIndex]] = [newOrder[newIndex], newOrder[currentIndex]];
      return newOrder;
    });
  };

  const renderItem = (teamId, index) => {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return null;

    // Check if we're on mobile (you can adjust this breakpoint)
    const isMobile = window.innerWidth <= 768;

    if (isMobile) {
      // Mobile: No drag, just buttons
      return (
        <tr key={teamId} className="draggable-row">
          <td className="prediction-position">{index + 1}</td>
          <td>
            <div className="prediction-team">
              <img
                src={team.logo}
                alt={`${team.name} official badge`}
                loading="lazy"
                className="prediction-team-logo"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                }}
              />
              <span className="prediction-team-name">{team.name}</span>
            </div>
          </td>
          <td>
            <div className="drag-handle">
              <div className="mobile-controls">
                <button 
                  className="move-btn up-btn"
                  onClick={() => moveTeam(teamId, 'up')}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button 
                  className="move-btn down-btn"
                  onClick={() => moveTeam(teamId, 'down')}
                  disabled={index === userOrder.length - 1}
                >
                  ↓
                </button>
              </div>
            </div>
          </td>
        </tr>
      );
    }

    // Desktop: Full drag functionality
    return (
      <Draggable key={teamId} draggableId={teamId} index={index}>
        {(provided, snapshot) => (
          <tr
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`draggable-row ${snapshot.isDragging ? "dragging" : ""}`}
          >
            <td className="prediction-position">{index + 1}</td>
            <td>
              <div className="prediction-team">
                <img
                  src={team.logo}
                  alt={`${team.name} official badge`}
                  loading="lazy"
                  className="prediction-team-logo"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
                <span className="prediction-team-name">{team.name}</span>
              </div>
            </td>
            <td>
              <div className="drag-handle">
                <div className="desktop-drag-handle">
                  ⋮⋮
                </div>
              </div>
            </td>
          </tr>
        )}
      </Draggable>
    );
  };

  return (
    <div className="prediction-section">
      <div className="prediction-header">
        <p className="prediction-description">
          Drag and drop teams to predict the final league table
        </p>
      </div>

      {/* Deadline Status */}
      {deadlineStatus && (
        <div className={`deadline-status ${deadlineStatus.canUpdate ? 'can-update' : 'cannot-update'}`}>
          <div className="deadline-message">
            <span className="material-symbols-outlined">
              {deadlineStatus.canUpdate ? 'schedule' : 'lock'}
            </span>
            <span className="deadline-text">
              {deadlineStatus.reason}
              {deadlineCountdown && deadlineStatus.canUpdate && (
                <span className="deadline-countdown"> ({deadlineCountdown})</span>
              )}
            </span>
          </div>
        </div>
      )}

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="prediction-card">
          <table className="prediction-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Position</th>
                <th>Team</th>
                <th style={{ width: '80px' }}>Drag</th>
              </tr>
            </thead>
            <Droppable droppableId="user-predictions">
              {(provided, snapshot) => (
                <tbody ref={provided.innerRef} {...provided.droppableProps}>
                  {userOrder.map((id, idx) => renderItem(id, idx))}
                  {provided.placeholder}
                </tbody>
              )}
            </Droppable>
          </table>
          <div className="prediction-actions">
            <button
              onClick={savePredictions}
              disabled={loading}
              className="prediction-save-btn"
            >
              {loading ? 'Saving...' : 'Save Predictions'}
            </button>
          </div>
        </div>
      </DragDropContext>
    </div>
  );
};
