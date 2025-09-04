-- Enable RLS on missing tables
ALTER TABLE public.prediction_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_standings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for prediction_sets (legacy table - admin only)
CREATE POLICY "Only authenticated users can view prediction sets" 
ON public.prediction_sets 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can insert prediction sets" 
ON public.prediction_sets 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update prediction sets" 
ON public.prediction_sets 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for real_standings (public read, admin write)
CREATE POLICY "Anyone can view real standings" 
ON public.real_standings 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert real standings" 
ON public.real_standings 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update real standings" 
ON public.real_standings 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

-- Create RLS policies for match_events (public read, admin write)
CREATE POLICY "Anyone can view match events" 
ON public.match_events 
FOR SELECT 
USING (true);

CREATE POLICY "Only authenticated users can insert match events" 
ON public.match_events 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can update match events" 
ON public.match_events 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Only authenticated users can delete match events" 
ON public.match_events 
FOR DELETE 
USING (auth.uid() IS NOT NULL);