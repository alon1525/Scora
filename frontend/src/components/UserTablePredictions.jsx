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

function reorder(list, startIndex, endIndex) {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const UserTablePredictions = ({ onPredictionSaved }) => {
  const { user } = useAuth();
  const defaultOrder = TEAMS.map((t) => t.id);
  const [userOrder, setUserOrder] = useState(defaultOrder);
  const [loading, setLoading] = useState(false);

  // Load user's predictions
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (!user) return;

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
  }, [user]);

  const savePredictions = async () => {
    if (!user) return;

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

  const renderItem = (teamId, index) => {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return null;

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
                ⋮⋮
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
        <h2 className="prediction-title">Your Premier League Predictions</h2>
        <p className="prediction-description">
          Drag and drop teams to predict the final league table
        </p>
      </div>

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
