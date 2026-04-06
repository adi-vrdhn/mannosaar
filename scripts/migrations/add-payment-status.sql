-- Migration file for payment feature support

-- Add payment_status field to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'pending' 
CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded'));

-- Add payment_id field to store Razorpay payment ID
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS payment_id VARCHAR(255);

-- Add index for payment status queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON bookings(payment_status);

-- Add index for payment_id queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_id ON bookings(payment_id);

-- Add update_at trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_bookings_timestamp ON bookings;
CREATE TRIGGER update_bookings_timestamp
BEFORE UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Ensure phone_number exists and phone doesn't
-- First check if phone column exists and migrate data
DO $$
BEGIN
  -- Check if phone column exists
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone') THEN
    -- Add phone_number if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='phone_number') THEN
      ALTER TABLE users ADD COLUMN phone_number VARCHAR(20);
      -- Migrate data from phone to phone_number
      UPDATE users SET phone_number = phone WHERE phone IS NOT NULL;
    END IF;
    -- Drop the old phone column
    ALTER TABLE users DROP COLUMN phone;
  END IF;
END $$;

-- Ensure is_available index exists for slots
CREATE INDEX IF NOT EXISTS idx_therapy_slots_is_available ON therapy_slots(is_available) WHERE is_available = true;
