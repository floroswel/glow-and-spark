
ALTER TABLE public.abandoned_carts
ADD COLUMN IF NOT EXISTS recovery_email_sent boolean NOT NULL DEFAULT false;
