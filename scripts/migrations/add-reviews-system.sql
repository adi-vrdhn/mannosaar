-- Create reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read active reviews (public reviews)
CREATE POLICY "Anyone can read active reviews"
  ON reviews
  FOR SELECT
  USING (is_active = true);

-- RLS: Only admins can insert reviews
CREATE POLICY "Only admins can insert reviews"
  ON reviews
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- RLS: Only admins can update reviews
CREATE POLICY "Only admins can update reviews"
  ON reviews
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- RLS: Only admins can delete reviews
CREATE POLICY "Only admins can delete reviews"
  ON reviews
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT id FROM users WHERE role = 'admin'
    )
  );

-- Insert sample reviews for Neetu Rathore
INSERT INTO reviews (rating, comment) VALUES
  (5, 'Neetu''s compassionate approach and professional expertise helped me overcome my anxiety. Highly recommended!'),
  (5, 'The therapy sessions were transformative. I learned coping strategies that have made a real difference in my daily life.'),
  (5, 'Neetu''s ability to listen without judgment and provide practical guidance has been invaluable. Thank you!'),
  (5, 'I felt comfortable and heard in every session. The progress I''ve made is remarkable. Truly grateful!')
ON CONFLICT DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_reviews_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS reviews_updated_at ON reviews;
CREATE TRIGGER reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_reviews_updated_at();
