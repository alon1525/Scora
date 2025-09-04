-- Create user leagues table
CREATE TABLE public.user_leagues (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  is_public boolean NOT NULL DEFAULT false
);

-- Create league memberships table
CREATE TABLE public.league_memberships (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id uuid NOT NULL REFERENCES user_leagues(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(league_id, user_id)
);

-- Create individual user predictions for league table
CREATE TABLE public.user_table_predictions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  season text NOT NULL DEFAULT '2024-25',
  table_order jsonb NOT NULL, -- Array of team IDs in predicted order
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id, season)
);

-- Add user authentication to match predictions (update existing table)
ALTER TABLE public.match_predictions 
ADD CONSTRAINT match_predictions_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES user_profiles(user_id) ON DELETE CASCADE;

-- Enable RLS on all new tables
ALTER TABLE public.user_leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_table_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_leagues
CREATE POLICY "Users can view public leagues and their own leagues" 
ON public.user_leagues 
FOR SELECT 
USING (is_public = true OR created_by = auth.uid());

CREATE POLICY "Users can create their own leagues" 
ON public.user_leagues 
FOR INSERT 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own leagues" 
ON public.user_leagues 
FOR UPDATE 
USING (created_by = auth.uid());

CREATE POLICY "Users can delete their own leagues" 
ON public.user_leagues 
FOR DELETE 
USING (created_by = auth.uid());

-- Create RLS policies for league_memberships
CREATE POLICY "Users can view league memberships for leagues they're in" 
ON public.league_memberships 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  league_id IN (SELECT league_id FROM league_memberships WHERE user_id = auth.uid())
);

CREATE POLICY "Users can join leagues" 
ON public.league_memberships 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can leave leagues" 
ON public.league_memberships 
FOR DELETE 
USING (user_id = auth.uid());

-- Create RLS policies for user_table_predictions
CREATE POLICY "Users can view all table predictions" 
ON public.user_table_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own table predictions" 
ON public.user_table_predictions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own table predictions" 
ON public.user_table_predictions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for match_predictions
CREATE POLICY "Users can view all match predictions" 
ON public.match_predictions 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own match predictions" 
ON public.match_predictions 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own match predictions" 
ON public.match_predictions 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view all profiles" 
ON public.user_profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own profile" 
ON public.user_profiles 
FOR INSERT 
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own profile" 
ON public.user_profiles 
FOR UPDATE 
USING (user_id = auth.uid());

-- Create function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_profiles (user_id, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data ->> 'username', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger to run function on user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_leagues_updated_at
  BEFORE UPDATE ON public.user_leagues
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_table_predictions_updated_at
  BEFORE UPDATE ON public.user_table_predictions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();