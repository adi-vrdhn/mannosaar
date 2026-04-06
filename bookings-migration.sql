-- Add Zoom meeting columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meeting_link VARCHAR(500),
ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(50);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON bookings(created_at DESC);
