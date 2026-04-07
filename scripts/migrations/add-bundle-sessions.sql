-- Add bundle sessions support

-- 1. Add number_of_sessions and session_dates to bookings table
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS number_of_sessions INTEGER DEFAULT 1;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS session_dates JSONB; -- Array of {date, start_time, end_time}

-- 2. Create pricing_config table
CREATE TABLE IF NOT EXISTS pricing_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type VARCHAR(50) NOT NULL, -- 'personal' or 'couple'
  bundle_size INTEGER NOT NULL CHECK (bundle_size IN (1, 2, 3)), -- 1, 2, or 3
  price DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(10) DEFAULT 'INR',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(session_type, bundle_size)
);

-- 3. Insert demo pricing (in Indian Rupees)
INSERT INTO pricing_config (session_type, bundle_size, price, currency) VALUES
  ('personal', 1, 2500, 'INR'),
  ('personal', 2, 4500, 'INR'),
  ('personal', 3, 6000, 'INR'),
  ('couple', 1, 3500, 'INR'),
  ('couple', 2, 6500, 'INR'),
  ('couple', 3, 9000, 'INR')
ON CONFLICT (session_type, bundle_size) DO UPDATE SET
  price = EXCLUDED.price,
  updated_at = CURRENT_TIMESTAMP;

-- 4. Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_pricing_config_type_size ON pricing_config(session_type, bundle_size);

-- 5. Update comment on bookings table
COMMENT ON COLUMN bookings.number_of_sessions IS 'Number of sessions in this bundle (1, 2, or 3)';
COMMENT ON COLUMN bookings.session_dates IS 'Array of session dates/times: [{date: "2026-04-18", start_time: "18:00", end_time: "18:40"}, ...]';
