-- Create pricing_settings table
CREATE TABLE IF NOT EXISTS pricing_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL UNIQUE,
  price DECIMAL(10, 2) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE pricing_settings ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read pricing settings (public pricing)
CREATE POLICY "Anyone can read pricing settings"
  ON pricing_settings
  FOR SELECT
  USING (true);

-- RLS: Only admins can update pricing
CREATE POLICY "Only admins can update pricing"
  ON pricing_settings
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- RLS: Only admins can insert pricing
CREATE POLICY "Only admins can insert pricing"
  ON pricing_settings
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Insert default pricing
INSERT INTO pricing_settings (session_type, price, description) VALUES
  ('personal', 1200, 'Personal Therapy Session'),
  ('couple', 1500, 'Couple Therapy Session')
ON CONFLICT (session_type) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS pricing_settings_updated_at ON pricing_settings;
CREATE TRIGGER pricing_settings_updated_at
  BEFORE UPDATE ON pricing_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_updated_at();
