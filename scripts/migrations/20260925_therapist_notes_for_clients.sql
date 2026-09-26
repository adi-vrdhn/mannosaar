-- A therapist-authored note intentionally shared with the client.
-- This is separate from bookings.notes, which is the client's pre-booking intake note.
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS therapist_note_for_client TEXT;

COMMENT ON COLUMN public.bookings.therapist_note_for_client IS
  'Optional non-clinical note written by the assigned therapist/admin for the client to view in their account';
