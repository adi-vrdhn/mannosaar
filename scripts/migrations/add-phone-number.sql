-- Database Migration for User Profile & Phone Number Support
-- Run this in Supabase SQL Editor or your database client

-- Step 1: Add phone_number and updated_at columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Step 2: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Step 3: Verify the columns were added
-- Run this query to see the users table structure:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'users' 
-- ORDER BY ordinal_position;

-- Step 4: Optional - Add check constraint for phone number length
-- ALTER TABLE users ADD CONSTRAINT phone_length CHECK (
--   phone_number IS NULL OR LENGTH(REPLACE(phone_number, '-', '')) >= 10
-- );

-- All set! The users table now supports phone numbers.
-- Users can add their phone number via the profile page at /profile
