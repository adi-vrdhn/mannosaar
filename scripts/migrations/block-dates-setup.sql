-- Enable block_schedules table if not exists (already in schema)
-- This ensures the table exists for storing therapist blocking

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

-- Create index for efficient date range queries
CREATE INDEX IF NOT EXISTS idx_block_schedules_dates ON block_schedules(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_block_schedules_created_by ON block_schedules(created_by);

-- Enable RLS on block_schedules
ALTER TABLE block_schedules ENABLE ROW LEVEL SECURITY;

-- Only admins can view block schedules
CREATE POLICY "Admins can view block schedules" ON block_schedules
  FOR SELECT USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  ));

-- Only admins can create/delete block schedules
CREATE POLICY "Admins can manage block schedules" ON block_schedules
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  ))
  WITH CHECK (
    created_by = auth.uid()::uuid AND EXISTS (
      SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
    )
  );
