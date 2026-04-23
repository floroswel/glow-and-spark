
-- Create user_points table
CREATE TABLE public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  balance integer NOT NULL DEFAULT 0,
  lifetime_points integer NOT NULL DEFAULT 0,
  tier text NOT NULL DEFAULT 'Bronze',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own points"
  ON public.user_points FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users update own points"
  ON public.user_points FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage user_points"
  ON public.user_points FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- Function to compute tier from lifetime points
CREATE OR REPLACE FUNCTION public.compute_tier(pts integer)
RETURNS text
LANGUAGE sql IMMUTABLE
AS $$
  SELECT CASE
    WHEN pts >= 2000 THEN 'Gold'
    WHEN pts >= 500 THEN 'Silver'
    ELSE 'Bronze'
  END;
$$;

-- Trigger function: award points on order insert
CREATE OR REPLACE FUNCTION public.award_points_on_order()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  pts integer;
BEGIN
  -- Only award if user is logged in
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;

  pts := GREATEST(floor(NEW.total)::integer, 0);

  INSERT INTO public.user_points (user_id, balance, lifetime_points, tier, updated_at)
  VALUES (NEW.user_id, pts, pts, compute_tier(pts), now())
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_points.balance + pts,
    lifetime_points = user_points.lifetime_points + pts,
    tier = compute_tier(user_points.lifetime_points + pts),
    updated_at = now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_award_points_on_order
  AFTER INSERT ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.award_points_on_order();
