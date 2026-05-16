-- Track session-specific reminder delivery for bookings
-- Stores one entry per session key with client/therapist timestamps

ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS session_reminders_sent JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN bookings.session_reminders_sent IS 'Per-session reminder send state keyed by session slot/date-time';
