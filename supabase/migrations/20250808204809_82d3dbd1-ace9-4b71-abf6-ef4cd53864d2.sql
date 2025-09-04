-- Tables to store predictions (Alon & Nadav) and real standings

-- 1) Prediction sets: stores both players' full order in one row per label
CREATE TABLE IF NOT EXISTS public.prediction_sets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  p1_order text[] NOT NULL,
  p2_order text[] NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.prediction_sets ENABLE ROW LEVEL SECURITY;

-- RLS: Public read and write (no auth in app). Adjust later if auth is added.
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prediction_sets' AND policyname = 'Public can read prediction sets'
  ) THEN
    CREATE POLICY "Public can read prediction sets"
    ON public.prediction_sets
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prediction_sets' AND policyname = 'Public can insert prediction sets'
  ) THEN
    CREATE POLICY "Public can insert prediction sets"
    ON public.prediction_sets
    FOR INSERT
    WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'prediction_sets' AND policyname = 'Public can update prediction sets'
  ) THEN
    CREATE POLICY "Public can update prediction sets"
    ON public.prediction_sets
    FOR UPDATE
    USING (true);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_prediction_sets_updated_at'
  ) THEN
    CREATE TRIGGER update_prediction_sets_updated_at
    BEFORE UPDATE ON public.prediction_sets
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) Real standings: stores current true rankings as a JSON map team_id -> position
CREATE TABLE IF NOT EXISTS public.real_standings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE,
  positions jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.real_standings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_standings' AND policyname = 'Public can read real standings'
  ) THEN
    CREATE POLICY "Public can read real standings"
    ON public.real_standings
    FOR SELECT
    USING (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_standings' AND policyname = 'Public can insert real standings'
  ) THEN
    CREATE POLICY "Public can insert real standings"
    ON public.real_standings
    FOR INSERT
    WITH CHECK (true);
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'real_standings' AND policyname = 'Public can update real standings'
  ) THEN
    CREATE POLICY "Public can update real standings"
    ON public.real_standings
    FOR UPDATE
    USING (true);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_real_standings_updated_at'
  ) THEN
    CREATE TRIGGER update_real_standings_updated_at
    BEFORE UPDATE ON public.real_standings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;