-- 1) Gift cards table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  initial_amount NUMERIC NOT NULL CHECK (initial_amount > 0),
  balance NUMERIC NOT NULL DEFAULT 0 CHECK (balance >= 0),
  currency TEXT NOT NULL DEFAULT 'RON',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'redeemed', 'cancelled')),
  recipient_email TEXT,
  recipient_name TEXT,
  sender_name TEXT,
  message TEXT,
  expires_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);

ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gift_cards"
  ON public.gift_cards FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 2) Transaction history
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('issue', 'redeem', 'refund', 'adjust', 'expire')),
  amount NUMERIC NOT NULL,
  balance_after NUMERIC NOT NULL,
  order_id UUID,
  performed_by UUID,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_gc_tx_card ON public.gift_card_transactions(gift_card_id);

ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage gift_card_transactions"
  ON public.gift_card_transactions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 3) updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS gift_cards_touch ON public.gift_cards;
CREATE TRIGGER gift_cards_touch
  BEFORE UPDATE ON public.gift_cards
  FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- 4) Atomic redeem function
CREATE OR REPLACE FUNCTION public.redeem_gift_card(
  p_code TEXT,
  p_amount NUMERIC,
  p_order_id UUID DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, message TEXT, new_balance NUMERIC)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_card public.gift_cards%ROWTYPE;
BEGIN
  SELECT * INTO v_card FROM public.gift_cards WHERE code = p_code FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Cod invalid'::TEXT, 0::NUMERIC; RETURN;
  END IF;
  IF v_card.status <> 'active' THEN
    RETURN QUERY SELECT false, ('Card ' || v_card.status)::TEXT, v_card.balance; RETURN;
  END IF;
  IF v_card.expires_at IS NOT NULL AND v_card.expires_at < now() THEN
    UPDATE public.gift_cards SET status = 'expired' WHERE id = v_card.id;
    RETURN QUERY SELECT false, 'Card expirat'::TEXT, v_card.balance; RETURN;
  END IF;
  IF p_amount <= 0 OR p_amount > v_card.balance THEN
    RETURN QUERY SELECT false, 'Sold insuficient'::TEXT, v_card.balance; RETURN;
  END IF;

  UPDATE public.gift_cards
    SET balance = balance - p_amount,
        status = CASE WHEN balance - p_amount <= 0 THEN 'redeemed' ELSE status END,
        updated_at = now()
    WHERE id = v_card.id
    RETURNING balance INTO v_card.balance;

  INSERT INTO public.gift_card_transactions (gift_card_id, type, amount, balance_after, order_id, performed_by)
  VALUES (v_card.id, 'redeem', p_amount, v_card.balance, p_order_id, auth.uid());

  RETURN QUERY SELECT true, 'Card folosit cu succes'::TEXT, v_card.balance;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.redeem_gift_card(TEXT, NUMERIC, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.redeem_gift_card(TEXT, NUMERIC, UUID) TO service_role;

-- 5) Migrate existing data from site_settings
DO $$
DECLARE
  v_setting jsonb;
  v_card jsonb;
BEGIN
  SELECT value INTO v_setting FROM public.site_settings WHERE key = 'gift_cards';
  IF v_setting IS NOT NULL AND jsonb_typeof(v_setting) = 'array' THEN
    FOR v_card IN SELECT * FROM jsonb_array_elements(v_setting)
    LOOP
      INSERT INTO public.gift_cards (code, initial_amount, balance, status, recipient_email, expires_at)
      VALUES (
        COALESCE(v_card->>'code', 'GC-' || substr(gen_random_uuid()::text, 1, 8)),
        COALESCE((v_card->>'amount')::numeric, (v_card->>'initial_amount')::numeric, 50),
        COALESCE((v_card->>'balance')::numeric, (v_card->>'amount')::numeric, 50),
        COALESCE(v_card->>'status', 'active'),
        v_card->>'recipient_email',
        CASE WHEN v_card->>'expires_at' IS NOT NULL
             THEN (v_card->>'expires_at')::timestamptz
             ELSE NULL END
      )
      ON CONFLICT (code) DO NOTHING;
    END LOOP;
  END IF;
END $$;