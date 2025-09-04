import { useEffect, useMemo, useState } from "react";
import { TEAMS } from "@/data/teams";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { MatchPredictions } from "@/components/MatchPredictions";
import { AdminMatchControls } from "@/components/AdminMatchControls";
import {
  DragDropContext,
  Droppable,
  Draggable,
  type DropResult,
} from "@hello-pangea/dnd";

const positions = Array.from({ length: 20 }, (_, i) => i + 1);

type Predictions = Record<string, number | "">;

type Order = string[]; // array of team ids

type StandingData = {
  id: string;
  position: number;
  name: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
};

const STORAGE_KEYS = {
  p1Order: "plpb_p1_order",
  p2Order: "plpb_p2_order",
  p1Map: "plpb_player1", // legacy/compat mapping
  p2Map: "plpb_player2",
  real: "plpb_real",
};

function reorder(list: Order, startIndex: number, endIndex: number): Order {
  const result = Array.from(list);
  const [removed] = result.splice(startIndex, 1);
  result.splice(endIndex, 0, removed);
  return result;
}

const Index = () => {
  const defaultOrder = useMemo(() => TEAMS.map((t) => t.id), []);
  const [p1Order, setP1Order] = useState<Order>(defaultOrder);
  const [p2Order, setP2Order] = useState<Order>(defaultOrder);
  const [real, setReal] = useState<Predictions>({});
  const [standingsData, setStandingsData] = useState<StandingData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<string>("");
  const [scores, setScores] = useState<{
    p1?: number;
    p2?: number;
    winner?: string;
    loser?: string;
  } | null>(null);

  useEffect(() => {
    document.title = "Premier League Prediction Battle";
  }, []);

  // Load from localStorage
  useEffect(() => {
    try {
      const p1o = JSON.parse(localStorage.getItem(STORAGE_KEYS.p1Order) || "null");
      const p2o = JSON.parse(localStorage.getItem(STORAGE_KEYS.p2Order) || "null");
      const rs = JSON.parse(localStorage.getItem(STORAGE_KEYS.real) || "{}");

      // Ensure we always have 20 teams for 2025-26 season
      // Filter out any team IDs that don't exist in current TEAMS array
      const validP1Order = Array.isArray(p1o) ? p1o.filter(id => TEAMS.some(t => t.id === id)) : [];
      const validP2Order = Array.isArray(p2o) ? p2o.filter(id => TEAMS.some(t => t.id === id)) : [];
      
      setP1Order(validP1Order.length === 20 ? validP1Order : defaultOrder);
      setP2Order(validP2Order.length === 20 ? validP2Order : defaultOrder);
      setReal(rs);
      
      // If stored data doesn't have 20 valid teams, reset to current teams
      if (validP1Order.length !== 20) {
        console.log("Resetting P1 predictions to current 20 teams");
        localStorage.setItem(STORAGE_KEYS.p1Order, JSON.stringify(defaultOrder));
      }
      if (validP2Order.length !== 20) {
        console.log("Resetting P2 predictions to current 20 teams");
        localStorage.setItem(STORAGE_KEYS.p2Order, JSON.stringify(defaultOrder));
      }
    } catch {}
  }, [defaultOrder]);

  // Load from Supabase (cloud)
  useEffect(() => {
    const loadFromDb = async () => {
      try {
        const { data: preds, error: predsError } = await supabase
          .from("prediction_sets")
          .select("p1_order, p2_order")
          .eq("label", "default")
          .maybeSingle();
        if (predsError) {
          console.warn("Supabase predictions fetch error:", predsError.message);
        }
        if (preds?.p1_order?.length === 20 && preds?.p2_order?.length === 20) {
          // Filter to only include teams that exist in current TEAMS array
          const validP1 = preds.p1_order.filter(id => TEAMS.some(t => t.id === id));
          const validP2 = preds.p2_order.filter(id => TEAMS.some(t => t.id === id));
          
          if (validP1.length === 20 && validP2.length === 20) {
            setP1Order(validP1 as string[]);
            setP2Order(validP2 as string[]);
          }
        } else if (preds) {
          console.log("Supabase predictions don't have 20 teams, using default order");
        }

        const { data: rs, error: rsError } = await supabase
          .from("real_standings")
          .select("positions")
          .eq("label", "current")
          .maybeSingle();
        if (rsError) {
          console.warn("Supabase real standings fetch error:", rsError.message);
        }
        if (rs?.positions) {
          setReal(rs.positions as Predictions);
        }
      } catch (e) {
        console.warn("Supabase load error:", e);
      }
    };
    loadFromDb();
  }, []);

  

  // If no real standings loaded yet, try fetching live standings from the web via Edge Function
  useEffect(() => {
    const hasAny = Object.values(real).some(Boolean);
    if (hasAny) return;

    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-pl-standings');
        if (error) throw error;
        const positions = (data as any)?.positionsById as Record<string, number> | undefined;
        const standings = (data as any)?.standingsData as StandingData[] | undefined;
        const updated = (data as any)?.lastUpdated as string | undefined;
        if (positions && Object.keys(positions).length > 0) {
          setReal(positions as any);
          if (standings) setStandingsData(standings);
          if (updated) setLastUpdated(updated);
          await supabase
            .from('real_standings')
            .upsert({ label: 'current', positions }, { onConflict: 'label' });
          toast.info('Loaded live standings from the web.');
        }
      } catch (e: any) {
        console.warn('fetch-pl-standings error:', e?.message || e);
      }
    })();
  }, [real]);

  // Auto-refresh standings every hour
  useEffect(() => {
    const refreshStandings = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('fetch-pl-standings');
        if (!error) {
          const positions = (data as any)?.positionsById as Record<string, number> | undefined;
          const standings = (data as any)?.standingsData as StandingData[] | undefined;
          const updated = (data as any)?.lastUpdated as string | undefined;
          if (positions) {
            setReal(positions as any);
            if (standings) setStandingsData(standings);
            if (updated) setLastUpdated(updated);
            await supabase
              .from('real_standings')
              .upsert({ label: 'current', positions }, { onConflict: 'label' });
            toast.success('Standings updated');
          }
        }
      } catch (e: any) {
        console.warn('Auto-refresh error:', e?.message || e);
      }
    };

    const interval = setInterval(refreshStandings, 60 * 60 * 1000); // 1 hour
    return () => clearInterval(interval);
  }, []);


  const savePredictions = async () => {
    // Save locally
    localStorage.setItem(STORAGE_KEYS.p1Order, JSON.stringify(p1Order));
    localStorage.setItem(STORAGE_KEYS.p2Order, JSON.stringify(p2Order));

    // also save mapping for readability/compat
    const toMap = (order: Order) =>
      order.reduce<Record<string, number>>((acc, id, idx) => {
        acc[id] = idx + 1;
        return acc;
      }, {});
    localStorage.setItem(STORAGE_KEYS.p1Map, JSON.stringify(toMap(p1Order)));
    localStorage.setItem(STORAGE_KEYS.p2Map, JSON.stringify(toMap(p2Order)));

    // Save to Supabase (cloud)
    try {
      const { error } = await supabase
        .from("prediction_sets")
        .upsert(
          { label: "default", p1_order: p1Order, p2_order: p2Order },
          { onConflict: "label" }
        );
      if (error) throw error;
      toast.success("Predictions saved to cloud.");
    } catch (e: any) {
      console.warn("Supabase savePredictions error:", e?.message || e);
      toast.error("Failed to save to cloud. Saved locally instead.");
    }
  };


  const allFilled = (preds: Predictions) => positions.every((n) => Object.values(preds).includes(n));

  const calculateScores = async () => {
    let current = real;
    if (!allFilled(current)) {
      toast.message('Fetching live standings…');
      // Try database first
      try {
        const { data: rs } = await supabase
          .from('real_standings')
          .select('positions')
          .eq('label', 'current')
          .maybeSingle();
        if (rs?.positions) current = rs.positions as Predictions;
      } catch {}
      // Fallback to Edge Function
      if (!allFilled(current)) {
        try {
          const { data, error } = await supabase.functions.invoke('fetch-pl-standings');
          if (!error) {
            const positions = (data as any)?.positionsById as Record<string, number> | undefined;
            const standings = (data as any)?.standingsData as StandingData[] | undefined;
            const updated = (data as any)?.lastUpdated as string | undefined;
            if (positions) {
              current = positions as any;
              if (standings) setStandingsData(standings);
              if (updated) setLastUpdated(updated);
              await supabase
                .from('real_standings')
                .upsert({ label: 'current', positions }, { onConflict: 'label' });
            }
          }
        } catch {}
      }
      if (!allFilled(current)) {
        toast.error('Real standings not available yet. Please try again in a moment.');
        return;
      }
      setReal(current);
    }

    const sumForOrder = (order: Order) =>
      TEAMS.reduce((sum, t) => {
        const predicted = order.indexOf(t.id) + 1; // 1-based
        const rr = (current as any)[t.id];
        if (typeof rr === 'number' && predicted > 0) {
          return sum + Math.abs(predicted - rr);
        }
        return sum; // no penalty for missing predictions
      }, 0);

    const p1s = sumForOrder(p1Order);
    const p2s = sumForOrder(p2Order);
    const winner = p1s === p2s ? 'Draw' : p1s < p2s ? 'Alon' : 'Nadav';
    const loser = p1s === p2s ? '' : p1s < p2s ? 'Nadav' : 'Alon';
    setScores({ p1: p1s, p2: p2s, winner, loser });
    toast.info('Scores calculated.');
  };

  const onDragEnd = (result: DropResult) => {
    const { destination, source } = result;
    if (!destination) return;
    if (destination.droppableId !== source.droppableId) return; // no cross-list moves
    if (destination.index === source.index) return;

    if (source.droppableId === "p1") {
      setP1Order((prev) => reorder(prev, source.index, destination.index));
    } else if (source.droppableId === "p2") {
      setP2Order((prev) => reorder(prev, source.index, destination.index));
    }
  };

  const renderItem = (teamId: string, index: number, listId: "p1" | "p2") => {
    const team = TEAMS.find((t) => t.id === teamId);
    if (!team) {
      console.warn(`Team with id "${teamId}" not found, skipping render`);
      return null;
    }
    return (
      <Draggable key={`${listId}-${team.id}`} draggableId={`${listId}-${team.id}`} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`flex items-center gap-3 p-2 rounded-md border border-border bg-card text-card-foreground hover-scale ${
              snapshot.isDragging ? "ring-2 ring-ring" : ""
            }`}
          >
            <div className="w-6 text-xs opacity-70">{index + 1}</div>
            <img
              src={team.logo}
              alt={`${team.name} official badge`}
              loading="lazy"
              width={28}
              height={28}
              className="h-7 w-7 object-contain"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).style.display = "none";
              }}
            />
            <span className="font-medium text-sm md:text-base">{team.name}</span>
          </div>
        )}
      </Draggable>
    );
  };

  return (
    <main className="min-h-screen py-10">
      <section className="container space-y-8 animate-fade-in">
        <header className="text-center space-y-2">
          <h1 className="text-3xl md:text-4xl font-bold">Premier League Prediction Battle</h1>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Drag and drop teams to set Alon and Nadav’s predictions. Save your lists; the real table updates automatically.
          </p>
        </header>

        {/* Drag-and-drop predictions */}
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-card text-card-foreground rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold mb-3">Alon’s Prediction</h2>
              <Droppable droppableId="p1">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {p1Order.map((id, idx) => renderItem(id, idx, "p1"))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>

            <div className="bg-card text-card-foreground rounded-lg border border-border p-4">
              <h2 className="text-lg font-semibold mb-3">Nadav’s Prediction</h2>
              <Droppable droppableId="p2">
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps} className="space-y-2">
                    {p2Order.map((id, idx) => renderItem(id, idx, "p2"))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </div>
          </div>
        </DragDropContext>

        <div className="flex flex-col md:flex-row gap-3 md:items-center">
          <div className="flex gap-3">
            <button
              onClick={savePredictions}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:opacity-90 transition"
            >
              Save Predictions
            </button>
          </div>
        </div>

        {/* Live Premier League Standings */}
        <div className="bg-card text-card-foreground rounded-lg shadow-md/50 shadow-black/20 border border-border">
          <div className="px-4 py-3 border-b border-border flex justify-between items-center">
            <h3 className="text-lg font-semibold">Live Premier League Standings</h3>
            {lastUpdated && (
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(lastUpdated).toLocaleString()}
              </p>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border text-sm font-medium">
                  <th className="text-left p-3">#</th>
                  <th className="text-left p-3">Team</th>
                  <th className="text-center p-3">P</th>
                  <th className="text-center p-3">W</th>
                  <th className="text-center p-3">D</th>
                  <th className="text-center p-3">L</th>
                  <th className="text-center p-3">GF</th>
                  <th className="text-center p-3">GA</th>
                  <th className="text-center p-3">GD</th>
                  <th className="text-center p-3">Pts</th>
                </tr>
              </thead>
              <tbody>
                {standingsData.length > 0 ? (
                  standingsData
                    .sort((a, b) => a.position - b.position)
                    .map((team) => (
                      <tr key={team.id} className="border-b border-border hover:bg-muted/50">
                        <td className="p-3 text-sm font-medium">{team.position}</td>
                        <td className="p-3">
                          <div className="flex items-center gap-3">
                            <img
                              src={TEAMS.find(t => t.id === team.id)?.logo}
                              alt={`${team.name} badge`}
                              loading="lazy"
                              width={24}
                              height={24}
                              className="h-6 w-6 object-contain"
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                            <span className="font-medium text-sm">{team.name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-center text-sm">{team.played}</td>
                        <td className="p-3 text-center text-sm">{team.wins}</td>
                        <td className="p-3 text-center text-sm">{team.draws}</td>
                        <td className="p-3 text-center text-sm">{team.losses}</td>
                        <td className="p-3 text-center text-sm">{team.goalsFor}</td>
                        <td className="p-3 text-center text-sm">{team.goalsAgainst}</td>
                        <td className="p-3 text-center text-sm font-medium">
                          <span className={team.goalDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                            {team.goalDifference > 0 ? '+' : ''}{team.goalDifference}
                          </span>
                        </td>
                        <td className="p-3 text-center text-sm font-bold">{team.points}</td>
                      </tr>
                    ))
                ) : (
                  <tr>
                    <td colSpan={10} className="p-6 text-center text-muted-foreground">
                      {Object.keys(real).length > 0 
                        ? "Loading detailed standings data..." 
                        : "Unable to fetch live standings right now. Please try again later."
                      }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex">
          <div className="ml-auto">
            <button
              onClick={calculateScores}
              className="px-4 py-2 rounded-md bg-accent text-accent-foreground hover:opacity-90 transition"
            >
              Calculate Scores
            </button>
          </div>
        </div>

        {scores && (
          <article className="bg-card text-card-foreground rounded-lg p-4 border border-border">
            <h2 className="text-xl font-semibold mb-2">Results</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
              <div className="bg-background/50 rounded-md p-3 border border-border">
                <p className="font-medium">Alon Total</p>
                <p className="text-2xl">{scores.p1}</p>
              </div>
              <div className="bg-background/50 rounded-md p-3 border border-border">
                <p className="font-medium">Nadav Total</p>
                <p className="text-2xl">{scores.p2}</p>
              </div>
              <div className="bg-background/50 rounded-md p-3 border border-border">
                <p className="font-medium">{scores.winner === "Draw" ? "Result" : "Winner"}</p>
                <p className="text-2xl">
                  {scores.winner === "Draw" ? "It's a draw!" : scores.winner}
                </p>
                {scores.winner !== "Draw" && (
                  <div className="mt-2 text-sm">
                    <span className="font-medium">Loser:</span> {scores.loser}
                  </div>
                )}
              </div>
            </div>
          </article>
        )}

        {/* Match Predictions and Admin Controls */}
        <div className="space-y-8">
          <AdminMatchControls />
          <MatchPredictions />
        </div>

        <footer className="text-center text-xs text-muted-foreground">
          Lowest total difference wins. Your data is stored locally in your browser.
        </footer>
      </section>
    </main>
  );
};

export default Index;
