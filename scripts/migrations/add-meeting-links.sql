-- Add meeting_links column to support multiple meeting links for bundle bookings

-- Add meeting_links column to bookings table (JSONB array)
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meeting_links JSONB; -- Array of meeting links for bundle bookings

-- Add index for faster querying
CREATE INDEX IF NOT EXISTS idx_bookings_meeting_links ON bookings USING GIN (meeting_links);

-- Comment on the column
COMMENT ON COLUMN bookings.meeting_links IS 'Array of Google Meet links for bundle bookings: ["https://meet.google.com/...", "https://meet.google.com/..."]';
