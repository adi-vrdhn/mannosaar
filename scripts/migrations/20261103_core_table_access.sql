-- NextAuth sessions are verified in the API, not by Supabase's auth.uid().
-- Browser reads of these tables must go through /api/private-data.
-- Run in staging first and verify admin/client/therapist journeys.
BEGIN;

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.block_schedules ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.users, public.bookings, public.therapy_slots, public.block_schedules FROM PUBLIC, anon, authenticated;
GRANT ALL ON public.users, public.bookings, public.therapy_slots, public.block_schedules TO service_role;

-- Public comment APIs return a fixed projection without contributor email.
-- Direct table reads could otherwise reveal that email for approved comments.
DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['comments', 'blog_comments'] LOOP
    IF to_regclass(format('public.%I', table_name)) IS NOT NULL THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', table_name);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', table_name);
    END IF;
  END LOOP;
END $$;

COMMIT;
