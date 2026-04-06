-- Blog Posts Table
CREATE TABLE blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  author_id UUID NOT NULL REFERENCES users(id),
  author_name VARCHAR(255) NOT NULL,
  featured_image VARCHAR(500),
  is_published BOOLEAN DEFAULT true,
  views_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Blog Comments Table
CREATE TABLE blog_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID NOT NULL REFERENCES blogs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  user_name VARCHAR(255) NOT NULL,
  user_email VARCHAR(255),
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX idx_blogs_slug ON blogs(slug);
CREATE INDEX idx_blogs_author_id ON blogs(author_id);
CREATE INDEX idx_blogs_created_at ON blogs(created_at DESC);
CREATE INDEX idx_blog_comments_blog_id ON blog_comments(blog_id);
CREATE INDEX idx_blog_comments_user_id ON blog_comments(user_id);
CREATE INDEX idx_blog_comments_created_at ON blog_comments(created_at DESC);

-- Row Level Security (RLS) for blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Public can read published blogs
CREATE POLICY "Anyone can read published blogs" 
  ON blogs 
  FOR SELECT 
  USING (is_published = true);

-- Authors can update their own blogs
CREATE POLICY "Authors can update their own blogs" 
  ON blogs 
  FOR UPDATE 
  USING (auth.uid() = author_id);

-- Authors can delete their own blogs
CREATE POLICY "Authors can delete their own blogs" 
  ON blogs 
  FOR DELETE 
  USING (auth.uid() = author_id);

-- Only therapist (admin) can insert blogs
CREATE POLICY "Only therapist can create blogs" 
  ON blogs 
  FOR INSERT 
  WITH CHECK (auth.uid() = author_id AND (SELECT role FROM users WHERE id = auth.uid()) = 'therapist');

-- Row Level Security (RLS) for comments
ALTER TABLE blog_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read approved comments
CREATE POLICY "Anyone can read approved comments" 
  ON blog_comments 
  FOR SELECT 
  USING (is_approved = true);

-- Logged-in users can insert comments
CREATE POLICY "Logged-in users can comment" 
  ON blog_comments 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments" 
  ON blog_comments 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments" 
  ON blog_comments 
  FOR DELETE 
  USING (auth.uid() = user_id);
