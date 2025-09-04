-- Create user profiles table for tracking penalties
CREATE TABLE public.user_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  username TEXT NOT NULL,
  total_penalties DECIMAL(4,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (true);

-- Create match events table for prediction challenges
CREATE TABLE public.match_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team TEXT NOT NULL,
  away_team TEXT NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  betting_opens_at TIMESTAMP WITH TIME ZONE NOT NULL,
  betting_closes_at TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'betting_open', 'betting_closed', 'completed')),
  home_score INTEGER,
  away_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view match events" 
ON public.match_events 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can create match events" 
ON public.match_events 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update match events" 
ON public.match_events 
FOR UPDATE 
USING (true);

-- Create match predictions table
CREATE TABLE public.match_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID NOT NULL REFERENCES public.match_events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username TEXT NOT NULL,
  predicted_home_score INTEGER NOT NULL,
  predicted_away_score INTEGER NOT NULL,
  penalty_applied DECIMAL(4,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(match_id, user_id)
);

-- Enable RLS
ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Everyone can view predictions" 
ON public.match_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create predictions" 
ON public.match_predictions 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update their own predictions" 
ON public.match_predictions 
FOR UPDATE 
USING (true);

-- Add triggers for automatic timestamp updates
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON public.user_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_events_updated_at
BEFORE UPDATE ON public.match_events
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_match_predictions_updated_at
BEFORE UPDATE ON public.match_predictions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();