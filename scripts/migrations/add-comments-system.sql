-- Generic Comments Table (for articles, videos, images)
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL,
  content_type VARCHAR(50) NOT NULL CHECK (content_type IN ('article', 'video', 'image')),
  author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
  author_email VARCHAR(255),
  comment_text TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_comments_content_id ON comments(content_id);
CREATE INDEX IF NOT EXISTS idx_comments_content_type ON comments(content_type);
CREATE INDEX IF NOT EXISTS idx_comments_is_approved ON comments(is_approved);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_lookup ON comments(content_id, content_type, is_approved);

-- Enable Row Level Security (RLS)
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments" 
  ON comments 
  FOR SELECT 
  USING (is_approved = true);

-- Anyone can insert comments (they start as unapproved)
CREATE POLICY "Anyone can insert comments" 
  ON comments 
  FOR INSERT 
  WITH CHECK (true);

-- Admins can update/delete comments (enable moderation)
CREATE POLICY "Admins can manage all comments" 
  ON comments 
  FOR ALL 
  USING (EXISTS (
    SELECT 1 FROM users 
    WHERE users.id = auth.uid()::uuid 
    AND users.role = 'admin'
  ));
