-- Content Table for storing articles, videos, and images
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type VARCHAR(50) NOT NULL CHECK (type IN ('article', 'video', 'image')),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  excerpt VARCHAR(500),
  
  -- Article-specific fields
  article_content TEXT,
  
  -- Media fields
  media_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  media_duration FLOAT,
  
  -- Gallery/Image specific
  image_alt_text VARCHAR(255),
  gallery_id UUID REFERENCES content(id) ON DELETE CASCADE,
  image_order INTEGER,
  
  -- Metadata
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  slug VARCHAR(255) UNIQUE,
  views_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  published BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type);
CREATE INDEX IF NOT EXISTS idx_content_published ON content(published);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON content(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_content_featured ON content(featured);
CREATE INDEX IF NOT EXISTS idx_content_gallery_id ON content(gallery_id) WHERE type = 'image';
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug);

-- Add RLS to content table
ALTER TABLE content ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Users can view published content
CREATE POLICY "Users can view published content" ON content
  FOR SELECT USING (published = true AND deleted_at IS NULL);

-- Admins can manage all content
CREATE POLICY "Admins can manage content" ON content
  FOR ALL USING (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  )) WITH CHECK (EXISTS (
    SELECT 1 FROM users WHERE users.id = auth.uid()::uuid AND users.role = 'admin'
  ));
