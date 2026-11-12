-- Run before deploying the first-session offer code.
-- The offer is off until an admin enables it for each service.
ALTER TABLE public.pricing_config
  ADD COLUMN IF NOT EXISTS intro_offer_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS intro_offer_price numeric(10, 2);

INSERT INTO public.pricing_config (session_type, bundle_size, price, currency, intro_offer_price)
VALUES ('personal', 1, 999, 'INR', 700), ('couple', 1, 1500, 'INR', 999)
ON CONFLICT (session_type, bundle_size) DO UPDATE SET
  price = EXCLUDED.price,
  intro_offer_price = EXCLUDED.intro_offer_price,
  updated_at = CURRENT_TIMESTAMP;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'pricing_intro_offer_price_positive'
  ) THEN
    ALTER TABLE public.pricing_config
      ADD CONSTRAINT pricing_intro_offer_price_positive
      CHECK (intro_offer_price IS NULL OR intro_offer_price > 0);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.first_session_offer_claims (
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('personal', 'couple')),
  txnid text NOT NULL,
  claimed_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, session_type),
  UNIQUE (txnid)
);

ALTER TABLE public.first_session_offer_claims ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.first_session_offer_claims FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.first_session_offer_claims TO service_role;

CREATE OR REPLACE FUNCTION public.claim_first_session_offer(p_user_id uuid, p_session_type text, p_txnid text, p_price numeric)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE claimed boolean;
BEGIN
  IF p_session_type NOT IN ('personal', 'couple') OR p_txnid IS NULL OR length(p_txnid) < 8 THEN
    RETURN false;
  END IF;
  PERFORM pg_advisory_xact_lock(hashtext(p_user_id::text || ':' || p_session_type));
  IF NOT EXISTS (
    SELECT 1 FROM public.pricing_config
    WHERE session_type = p_session_type AND bundle_size = 1 AND intro_offer_enabled = true
      AND intro_offer_price = p_price AND intro_offer_price < price
  ) THEN
    RETURN false;
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE user_id = p_user_id AND session_type = p_session_type AND payment_status = 'completed'
  ) THEN
    RETURN false;
  END IF;
  INSERT INTO public.first_session_offer_claims (user_id, session_type, txnid)
  VALUES (p_user_id, p_session_type, p_txnid)
  ON CONFLICT (user_id, session_type) DO UPDATE
    SET txnid = EXCLUDED.txnid, claimed_at = now()
    WHERE first_session_offer_claims.claimed_at < now() - interval '1 hour'
  RETURNING true INTO claimed;
  RETURN coalesce(claimed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_first_session_offer(uuid, text, text, numeric) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_first_session_offer(uuid, text, text, numeric) TO service_role;
