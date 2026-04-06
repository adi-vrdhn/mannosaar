-- Add user and slot information to bookings table for easier access
-- This denormalizes the data but makes queries and displays much faster

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_name VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_email VARCHAR(255);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS user_phone VARCHAR(20);
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_date DATE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_start_time TIME;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS slot_end_time TIME;

-- Populate existing bookings with user and slot data
UPDATE bookings
SET 
  user_name = u.name,
  user_email = u.email,
  user_phone = u.phone_number,
  slot_date = ts.date,
  slot_start_time = ts.start_time,
  slot_end_time = ts.end_time
FROM users u, therapy_slots ts
WHERE bookings.user_id = u.id
  AND bookings.slot_id = ts.id
  AND (bookings.user_name IS NULL OR bookings.slot_date IS NULL);

-- Create an index on booking dates for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_slot_date ON bookings(slot_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_email ON bookings(user_email);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);

-- Add comments explaining the columns
COMMENT ON COLUMN bookings.user_name IS 'Denormalized user name for faster display';
COMMENT ON COLUMN bookings.user_email IS 'Denormalized user email for faster display';
COMMENT ON COLUMN bookings.user_phone IS 'Denormalized user phone number for contact';
COMMENT ON COLUMN bookings.slot_date IS 'Denormalized slot date for easier querying';
COMMENT ON COLUMN bookings.slot_start_time IS 'Denormalized slot start time';
COMMENT ON COLUMN bookings.slot_end_time IS 'Denormalized slot end time';
