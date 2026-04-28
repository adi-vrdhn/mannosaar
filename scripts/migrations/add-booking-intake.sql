-- Add client note and session sequence metadata to bookings

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS sessions_taken_before INTEGER DEFAULT 0;

COMMENT ON COLUMN bookings.notes IS 'Short client note collected before booking';
COMMENT ON COLUMN bookings.sessions_taken_before IS 'Sequential session number for the client at booking time';
