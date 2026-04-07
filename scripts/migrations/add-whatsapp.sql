-- Add whatsapp_number column to profiles table
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

-- Add reminder_sent_at column to bookings table
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON bookings(reminder_sent_at);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
