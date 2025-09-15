import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../integrations/supabase/client";
import { toast } from "sonner";

// Team kit imports
import Arsenal from "../assets/Teams_Kits/Arsenal.png";
import Chelsea from "../assets/Teams_Kits/Chelsea.png";
import ManchesterCity from "../assets/Teams_Kits/Manchester_City.png";
import Liverpool from "../assets/Teams_Kits/Liverpool.png";
import Tottenham from "../assets/Teams_Kits/Tottenham.png";
import Newcastle from "../assets/Teams_Kits/Newcastle.png";
import Brighton from "../assets/Teams_Kits/Brighton.png";
import WestHam from "../assets/Teams_Kits/West_Ham.png";
import Everton from "../assets/Teams_Kits/Everton.png";
import Fulham from "../assets/Teams_Kits/Fulham.png";
import AstonVilla from "../assets/Teams_Kits/Aston_Villa.png";
import CrystalPalace from "../assets/Teams_Kits/Crystal_Palace.png";
import Brentford from "../assets/Teams_Kits/Brentford.png";
import NottinghamForest from "../assets/Teams_Kits/Nottingham_Forest.png";
import Wolves from "../assets/Teams_Kits/Wolves.png";
import Burnley from "../assets/Teams_Kits/Burnley.png";
import Bournemouth from "../assets/Teams_Kits/Bournemouth.png";
import LeedsUnited from "../assets/Teams_Kits/Leeds_United.png";
import ManchesterUnited from "../assets/Teams_Kits/Manchester_United.png";
import Sunderland from "../assets/Teams_Kits/Sunderland.png";

// Utility function for merging classes
function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

// Inline Card Components
const Card = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef(({ className, ...props }, ref) => (
  <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
));
CardTitle.displayName = "CardTitle";

const CardContent = React.forwardRef(({ className, ...props }, ref) => 
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
);
CardContent.displayName = "CardContent";

// Inline Button Component
const Button = React.forwardRef(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  const baseClasses = "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold ring-offset-background transition-micro focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0";
  
  const variantClasses = {
    default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary hover:shadow-elevated transition-smooth",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90 shadow-lg",
    outline: "border border-input bg-background/50 backdrop-blur-sm hover:bg-accent hover:text-accent-foreground transition-smooth",
    secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 shadow-lg",
    ghost: "hover:bg-accent/10 hover:text-accent-foreground transition-smooth",
    link: "text-primary underline-offset-4 hover:underline transition-micro",
    primary: "bg-gradient-primary text-primary-foreground hover:shadow-elevated transition-spring shadow-primary",
    accent: "bg-gradient-accent text-accent-foreground hover:shadow-elevated transition-spring shadow-accent"
  };
  
  const sizeClasses = {
    default: "h-11 px-6 py-2.5",
    sm: "h-9 rounded-lg px-4 text-xs",
    lg: "h-12 rounded-xl px-8 text-base",
    icon: "h-11 w-11"
  };
  
  return (
    <button
      className={cn(baseClasses, variantClasses[variant], sizeClasses[size], className)}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Inline Badge Component
function Badge({ className, variant = 'default', ...props }) {
  const baseClasses = "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2";
  
  const variantClasses = {
    default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
    secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
    destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
    outline: "text-foreground"
  };
  
  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} {...props} />
  );
}

const UserProfile = () => {
  const navigate = useNavigate();
  const { userId } = useParams();
  const [player, setPlayer] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [fixtures, setFixtures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadUserProfile();
      loadFixtures();
    }
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Get user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (profileError) {
        console.error('Error loading user profile:', profileError);
        toast.error('User not found');
        return;
      }

      setPlayer(profileData);
      
      // Convert fixture_predictions to array format
      if (profileData.fixture_predictions) {
        const predictionsArray = Object.entries(profileData.fixture_predictions).map(([fixtureId, prediction]) => ({
          id: fixtureId,
          playerId: userId,
          homeTeam: prediction.home_team || 'Unknown',
          awayTeam: prediction.away_team || 'Unknown',
          predictedScore: `${prediction.home_score}-${prediction.away_score}`,
          points: prediction.points_earned || 0,
          correct: prediction.points_earned > 0,
          result: prediction.points_earned !== undefined
        }));
        setPredictions(predictionsArray);
      }
      
    } catch (error) {
      console.error('Error loading user profile:', error);
      toast.error('Failed to load user profile');
    } finally {
      setLoading(false);
    }
  };

  const loadFixtures = async () => {
    try {
      // Get finished fixtures to match with predictions
      const { data: fixturesData, error: fixturesError } = await supabase
        .from('fixtures')
        .select('id, home_team_name, away_team_name, home_score, away_score, status')
        .eq('status', 'FINISHED')
        .limit(20);

      if (fixturesError) {
        console.error('Error loading fixtures:', fixturesError);
        return;
      }

      setFixtures(fixturesData || []);
    } catch (error) {
      console.error('Error loading fixtures:', error);
    }
  };

  const getTeamLogo = (teamName) => {
    const logos = {
      "Arsenal": Arsenal,
      "Chelsea": Chelsea,
      "Manchester City": ManchesterCity,
      "Liverpool": Liverpool,
      "Tottenham": Tottenham,
      "Newcastle": Newcastle,
      "Brighton": Brighton,
      "West Ham": WestHam,
      "Everton": Everton,
      "Fulham": Fulham,
      "Aston Villa": AstonVilla,
      "Crystal Palace": CrystalPalace,
      "Brentford": Brentford,
      "Nottingham Forest": NottinghamForest,
      "Wolves": Wolves,
      "Burnley": Burnley,
      "Bournemouth": Bournemouth,
      "Leeds United": LeedsUnited,
      "Manchester United": ManchesterUnited,
      "Sunderland": Sunderland
    };
    return logos[teamName] || Arsenal;
  };

  const correctPredictions = predictions.filter(p => p.correct);
  const totalPoints = correctPredictions.reduce((sum, p) => sum + p.points, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading user profile...</p>
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-destructive">Player not found</h1>
          <Button onClick={() => navigate("/dashboard")} className="mt-4">
            Go back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-6 mb-12">
          <Button 
            variant="ghost" 
            onClick={() => navigate("/dashboard")}
            className="hover:bg-muted/50 p-3 rounded-xl"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </Button>
          <div className="flex-1">
            <h1 className="text-4xl md:text-5xl font-black bg-gradient-primary bg-clip-text text-transparent tracking-tight">
              {player.display_name}
            </h1>
            <p className="text-muted-foreground text-lg font-light mt-2">
              Player Profile & Statistics
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-3 gap-6 mb-12">
          <Card className="bg-gradient-card shadow-elevated border-border/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-black text-accent mb-2">{player.total_points || 0}</div>
              <div className="text-muted-foreground flex items-center justify-center gap-2 font-medium">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Total Points
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-elevated border-border/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-black text-primary mb-2">
                {player.exact_predictions && player.result_predictions 
                  ? Math.round((player.exact_predictions / (player.exact_predictions + player.result_predictions)) * 100) 
                  : 0}%
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-2 font-medium">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
                Accuracy
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-card shadow-elevated border-border/50 backdrop-blur-sm">
            <CardContent className="p-8 text-center">
              <div className="text-4xl font-black text-foreground mb-2">
                {(player.exact_predictions || 0) + (player.result_predictions || 0)}
              </div>
              <div className="text-muted-foreground flex items-center justify-center gap-2 font-medium">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Predictions
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Predictions History */}
        <Card className="bg-gradient-card shadow-elevated border-border/50 backdrop-blur-sm">
          <CardHeader className="pb-8">
            <CardTitle className="flex items-center gap-3 text-primary text-2xl font-bold">
              <div className="p-2 bg-primary/10 rounded-xl">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              Recent Predictions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {predictions.map((prediction) => (
                <div
                  key={prediction.id}
                  className="flex items-center justify-between p-6 rounded-2xl bg-muted/30 hover:bg-muted/50 transition-smooth border border-border/30"
                >
                  <div className="flex items-center justify-center w-12">
                    {prediction.correct ? (
                      <svg className="h-7 w-7 text-success" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    ) : prediction.result ? (
                      <svg className="h-7 w-7 text-destructive" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg className="h-7 w-7 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    )}
                  </div>
                  
                  {/* Home team */}
                  <div className="flex items-center gap-4 flex-1 justify-center">
                    <div className="flex items-center gap-3">
                      <img 
                        src={getTeamLogo(prediction.homeTeam)} 
                        alt={prediction.homeTeam}
                        className="w-10 h-10 rounded-full object-cover shadow-lg"
                      />
                      <span className="font-semibold text-lg">{prediction.homeTeam}</span>
                    </div>
                  </div>
                  
                  {/* Score and points */}
                  <div className="flex flex-col items-center px-8">
                    <span className="font-black text-primary text-3xl mb-3">{prediction.predictedScore}</span>
                    <div>
                      {prediction.correct && (
                        <Badge 
                          variant="outline" 
                          className="border-success text-success bg-success/10 font-bold px-4 py-2 text-sm"
                        >
                          EXACT MATCH +{prediction.points} pts
                        </Badge>
                      )}
                      {prediction.result && !prediction.correct && (
                        <Badge 
                          variant="outline" 
                          className="border-destructive text-destructive bg-destructive/10 font-bold px-4 py-2 text-sm"
                        >
                          INCORRECT 0 pts
                        </Badge>
                      )}
                      {!prediction.result && (
                        <Badge 
                          variant="outline" 
                          className="border-warning text-warning bg-warning/10 font-bold px-4 py-2 text-sm"
                        >
                          PENDING
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {/* Away team */}
                  <div className="flex items-center gap-4 flex-1 justify-center">
                    <div className="flex items-center gap-3">
                      <span className="font-semibold text-lg">{prediction.awayTeam}</span>
                      <img 
                        src={getTeamLogo(prediction.awayTeam)} 
                        alt={prediction.awayTeam}
                        className="w-10 h-10 rounded-full object-cover shadow-lg"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfile;
