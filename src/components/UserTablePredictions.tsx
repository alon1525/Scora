import { useEffect, useState } from "react";
import { TEAMS } from "@/data/teams";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

type Order = string[]; // array of team ids

function reorder(list: Order, startIndex: number, endIndex: number): Order {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

export const UserTablePredictions = () => {
  const { user } = useAuth();
  const defaultOrder = TEAMS.map((t) => t.id);
  const [userOrder, setUserOrder] = useState<Order>(defaultOrder);
  const [loading, setLoading] = useState(false);

  // Load user's predictions
  useEffect(() => {
    const loadUserPredictions = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('user_table_predictions')
          .select('table_order')
          .eq('user_id', user.id)
          .eq('season', '2024-25')
          .maybeSingle();

        if (error) throw error;

        if (data?.table_order) {
          const savedOrder = data.table_order as string[];
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
      const { error } = await supabase
        .from('user_table_predictions')
        .upsert(
          {
            user_id: user.id,
            season: '2024-25',
            table_order: userOrder,
          },
          { onConflict: 'user_id,season' }
        );

      if (error) throw error;
      toast.success("Your predictions have been saved!");
    } catch (error: any) {
      console.error('Error saving predictions:', error);
      toast.error("Failed to save predictions. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.index === source.index) return;

    setUserOrder((prev) => reorder(prev, source.index, destination.index));
  };

  const renderItem = (teamId: string, index: number) => {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) return null;

    return (
      <Draggable key={teamId} draggableId={teamId} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`flex items-center gap-3 p-3 rounded-lg border border-border bg-card text-card-foreground hover-scale ${
              snapshot.isDragging ? "ring-2 ring-ring shadow-lg" : ""
            }`}
          >
            <div className="w-8 text-sm font-medium opacity-70">{index + 1}</div>
            <img
              src={team.logo}
              alt={`${team.name} official badge`}
              loading="lazy"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-medium">{team.name}</span>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Your Premier League Predictions</h2>
        <p className="text-muted-foreground">
          Drag and drop teams to predict the final league table
        </p>
      </div>

      <DragDropContext onDragEnd={onDragEnd}>
        <div className="bg-card text-card-foreground rounded-lg border border-border p-6">
          <Droppable droppableId="user-predictions">
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-3">
                {userOrder.map((id, idx) => renderItem(id, idx))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </div>
      </DragDropContext>

      <div className="flex">
        <button
          onClick={savePredictions}
          disabled={loading}
          className="ml-auto px-6 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? 'Saving...' : 'Save Predictions'}
        </button>
      </div>
    </div>
  );
};