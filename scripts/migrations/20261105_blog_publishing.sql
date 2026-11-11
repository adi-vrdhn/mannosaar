ALTER TABLE blogs ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'article';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS editor_name text;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS primary_keyword text;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS secondary_keywords text[] NOT NULL DEFAULT '{}';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_blogs_publication ON blogs (is_published, published_at);

DROP POLICY IF EXISTS "Anyone can read published blogs" ON blogs;
CREATE POLICY "Anyone can read published blogs" ON blogs FOR SELECT
  USING (is_published = true AND (published_at IS NULL OR published_at <= now()));

-- Existing published articles remain visible; new scheduled articles have a future published_at.
