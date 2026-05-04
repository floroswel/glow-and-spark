
CREATE OR REPLACE FUNCTION public.redeem_loyalty_points(p_user_id uuid, p_points integer, p_order_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(success boolean, message text, discount numeric, new_balance integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_balance INT;
  v_discount NUMERIC;
  v_last_order_at TIMESTAMPTZ;
  v_available_at TIMESTAMPTZ;
BEGIN
  -- Check 15-day cooldown from last completed order
  SELECT MAX(created_at) INTO v_last_order_at
  FROM public.orders
  WHERE user_id = p_user_id AND status IN ('completed', 'processing', 'shipped');

  IF v_last_order_at IS NOT NULL AND (now() - v_last_order_at) < INTERVAL '15 days' THEN
    v_available_at := v_last_order_at + INTERVAL '15 days';
    RETURN QUERY SELECT false,
      ('Punctele pot fi folosite după ' || to_char(v_available_at, 'DD.MM.YYYY HH24:MI') || ' (15 zile de la ultima comandă)')::text,
      0::numeric,
      COALESCE((SELECT balance FROM public.user_points WHERE user_id = p_user_id), 0);
    RETURN;
  END IF;

  SELECT balance INTO v_balance FROM public.user_points WHERE user_id = p_user_id FOR UPDATE;
  IF v_balance IS NULL OR v_balance < p_points THEN
    RETURN QUERY SELECT false, 'Puncte insuficiente'::text, 0::numeric, COALESCE(v_balance,0); RETURN;
  END IF;
  IF p_points <= 0 THEN
    RETURN QUERY SELECT false, 'Sumă invalidă'::text, 0::numeric, v_balance; RETURN;
  END IF;
  -- 100% usage allowed — no cap on discount
  v_discount := (p_points / 100.0)::numeric;
  UPDATE public.user_points SET balance = balance - p_points, updated_at = now() WHERE user_id = p_user_id;
  INSERT INTO public.points_transactions (user_id, type, amount, reason)
  VALUES (p_user_id, 'redeem', -p_points, COALESCE('Folosit la comanda ' || p_order_id::text, 'Folosit la checkout'));
  RETURN QUERY SELECT true, 'Puncte folosite'::text, v_discount, v_balance - p_points;
END; $function$;
