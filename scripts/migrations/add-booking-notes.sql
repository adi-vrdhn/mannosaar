-- Add client notes to bookings so the app and Supabase stay in sync
-- Safe to run multiple times.

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN bookings.notes IS 'Client note captured before booking and shown in admin/profile views';
