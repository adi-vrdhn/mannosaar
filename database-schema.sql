-- Users Table (with admin role support)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  phone VARCHAR(20),
  role VARCHAR(50) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Therapist Availability Slots
CREATE TABLE IF NOT EXISTS therapy_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER DEFAULT 45,
  is_available BOOLEAN DEFAULT true,
  is_blocked BOOLEAN DEFAULT false,
  blocked_reason VARCHAR(255),
  therapist_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000000',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(date, start_time, therapist_id)
);

-- Bookings Table
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slot_id UUID NOT NULL REFERENCES therapy_slots(id) ON DELETE CASCADE,
  session_type VARCHAR(50) NOT NULL CHECK (session_type IN ('personal', 'couple')),
  status VARCHAR(50) DEFAULT 'confirmed' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  sessions_taken_before INTEGER DEFAULT 0,
  meeting_link VARCHAR(255),
  meeting_password VARCHAR(50),
  google_calendar_event_id VARCHAR(255),
  cancellation_reason VARCHAR(255),
  cancelled_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Block Schedule (for admin to block multiple slots)
CREATE TABLE IF NOT EXISTS block_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN ('full_day', 'time_range')),
  reason VARCHAR(255),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Google OAuth Credentials (for therapist/admin)
CREATE TABLE IF NOT EXISTS google_oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_therapy_slots_date ON therapy_slots(date);
CREATE INDEX IF NOT EXISTS idx_therapy_slots_available ON therapy_slots(is_available);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(status);
CREATE INDEX IF NOT EXISTS idx_block_schedules_dates ON block_schedules(start_date, end_date);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE block_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

-- Users can view available slots
CREATE POLICY "Users can view available slots" ON therapy_slots
  FOR SELECT USING (is_available = true AND is_blocked = false);

-- Users can view their own bookings
CREATE POLICY "Users can view own bookings" ON bookings
  FOR SELECT USING (auth.uid()::text = user_id::text);

-- Admins can manage slots
CREATE POLICY "Admins can manage slots" ON therapy_slots
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  ));

-- Admins can view all bookings
CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  ));
