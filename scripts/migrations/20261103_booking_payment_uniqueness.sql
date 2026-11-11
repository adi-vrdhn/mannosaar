-- Apply after resolving any duplicates reported by the preflight query below.
-- This makes a provider transaction usable for at most one booking, including
-- concurrent callbacks and recovery attempts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.bookings
    WHERE payment_id IS NOT NULL AND btrim(payment_id) <> ''
    GROUP BY payment_id HAVING count(*) > 1
  ) THEN
    RAISE EXCEPTION 'Duplicate bookings.payment_id values must be reviewed before adding the unique index';
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS bookings_payment_id_unique
  ON public.bookings (payment_id)
  WHERE payment_id IS NOT NULL AND btrim(payment_id) <> '';
