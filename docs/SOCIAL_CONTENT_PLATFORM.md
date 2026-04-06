# Social-Style Content Platform

## 🎯 Overview

A complete social-media inspired content management system built into your therapist website using Next.js 16, React, Tailwind CSS, and Framer Motion. The platform supports three content types: **Articles**, **Videos**, and **Images** with a seamless user experience.

---

## 🎨 Features

### Content Types
- **Articles**: Blog posts with rich text editor and preview
- **Videos**: Short-form videos with reels-style full-screen viewer
- **Images**: Gallery with carousel viewer and zoom functionality

### User Experience
- ✅ Medium-style article layout
- ✅ TikTok/Reels-style vertical video viewer
- ✅ Instagram-style image gallery with carousel
- ✅ Smooth Framer Motion animations throughout
- ✅ Responsive design (mobile-first)
- ✅ Real-time content navigation

### Admin Features
- ✅ Unified content upload interface
- ✅ Support for rich text articles
- ✅ Video URL or YouTube support
- ✅ Image upload with alt text
- ✅ Featured content marking
- ✅ Content statistics dashboard
- ✅ Soft delete functionality

---

## 📁 Project Structure

```
src/
├── app/
│   ├── blogs/                    # Articles main page (split layout)
│   ├── videos/                   # Videos grid & viewer
│   ├── images/                   # Images grid & carousel
│   ├── admin/
│   │   └── content/              # Admin content management
│   └── api/
│       └── content/              # Content API routes
│           ├── route.ts          # GET (list), POST (create)
│           └── [id]/route.ts     # GET (single), DELETE
│
├── components/
│   └── content/
│       ├── ContentNavbar.tsx      # Navigation tabs
│       ├── VideoCard.tsx          # Video preview card
│       ├── ImageCard.tsx          # Image preview card
│       ├── VideoViewer.tsx        # Full-screen reels viewer
│       ├── ImageCarouselViewer.tsx # Image carousel viewer
│       └── AdminUploadPanel.tsx   # Upload UI
│
├── lib/
│   └── auth.ts                   # Authentication config
│
└── scripts/migrations/
    └── add-content-system.sql    # Database schema

```

---

## 🗄️ Database Schema

### Content Table
```sql
content (
  id UUID PRIMARY KEY,
  type VARCHAR(50) -- 'article', 'video', 'image'
  title VARCHAR(255),
  description TEXT,
  excerpt VARCHAR(500),
  
  -- Article fields
  article_content TEXT,
  
  -- Media fields
  media_url VARCHAR(500),
  thumbnail_url VARCHAR(500),
  media_duration FLOAT,
  
  -- Image fields
  image_alt_text VARCHAR(255),
  gallery_id UUID,
  image_order INTEGER,
  
  -- Metadata
  author_id UUID,
  slug VARCHAR(255),
  views_count INTEGER,
  featured BOOLEAN,
  published BOOLEAN,
  
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  deleted_at TIMESTAMP  -- Soft delete
)
```

---

## 🛣️ Routes

### PUBLIC ROUTES

#### Articles (`/blogs`)
- **Layout**: Split view (70% articles, 30% featured video + images)
- **Features**:
  - Medium-style article cards
  - List articles with title, excerpt, date, author, view count
  - Load more pagination
  - Featured video preview (right sidebar)
  - Image gallery preview (right sidebar)

#### Videos (`/videos`)
- **Layout**: Masonry grid
- **Features**:
  - Video cards with thumbnail and play button
  - Click to open full-screen reels viewer
  - Vertical scroll navigation (arrow keys)
  - Auto-play on scroll
  - Progress indicators
  - Video title and view count

#### Images (`/images`)
- **Layout**: Responsive grid
- **Features**:
  - Image cards with hover overlay
  - Click to open full-screen carousel
  - Horizontal scroll navigation (arrow keys)
  - Zoom in/out (+ / - keys or buttons)
  - Image info display

---

### ADMIN ROUTES

#### Content Management (`/admin/content`)
- **Features**:
  - Content statistics dashboard
  - Upload new content button
  - Quick access links to views
  - Stats: Total articles, videos, images

#### Upload Panel (Modal)
- **Step 1**: Select content type
  - Article
  - Video
  - Image

- **Step 2**: Fill form
  - **Common Fields**:
    - Title (required)
    - Description
    - Featured checkbox

  - **Article-Specific**:
    - Excerpt
    - Article content (rich text)

  - **Video-Specific**:
    - Video URL (YouTube, MP4, etc.)
    - Thumbnail URL
    - Duration in seconds

  - **Image-Specific**:
    - Image URL
    - Alt text (accessibility)

---

## 🔌 API Endpoints

### GET `/api/content`
List content with filters
```bash
# Get all published articles
GET /api/content?type=article&limit=10&page=1

# Get featured videos
GET /api/content?type=video&featured=true&limit=1

# Get all images
GET /api/content?type=image&limit=100
```

**Response**:
```json
{
  "content": [
    {
      "id": "uuid",
      "type": "article|video|image",
      "title": "string",
      "description": "string",
      "media_url": "string",
      "thumbnail_url": "string",
      "views_count": 123,
      "created_at": "2025-01-15T10:00:00Z"
    }
  ],
  "total": 50,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

### POST `/api/content`
Create new content (admin only)
```bash
POST /api/content
Content-Type: application/json

{
  "type": "article",
  "title": "Why Therapy Matters",
  "description": "An insight into...",
  "excerpt": "Short preview",
  "articleContent": "<h1>...</h1>",
  "featured": true
}
```

### GET `/api/content/[id]`
Get single content + increment view count
```bash
GET /api/content/abc123
```

### DELETE `/api/content/[id]`
Soft delete content (admin only)
```bash
DELETE /api/content/abc123
```

---

## 🎨 Component API

### ContentNavbar
```tsx
<ContentNavbar 
  activeTab="articles"  // 'articles' | 'videos' | 'images'
  onTabChange={(tab) => {}}
/>
```

### VideoCard
```tsx
<VideoCard
  id="uuid"
  title="Video Title"
  thumbnailUrl="https://..."
  duration={120}
  onPlay={() => {}}
/>
```

### VideoViewer
```tsx
<VideoViewer
  videos={[
    { id, title, mediaUrl, description, viewsCount }
  ]}
  initialIndex={0}
  onClose={() => {}}
/>
```

### ImageCard
```tsx
<ImageCard
  id="uuid"
  imageUrl="https://..."
  altText="Description"
  title="Title"
  onOpen={() => {}}
/>
```

### ImageCarouselViewer
```tsx
<ImageCarouselViewer
  images={[
    { id, imageUrl, altText, title, description }
  ]}
  initialIndex={0}
  onClose={() => {}}
/>
```

### AdminUploadPanel
```tsx
<AdminUploadPanel
  isOpen={true}
  onClose={() => {}}
  onSuccess={() => {}}
/>
```

---

## 🚀 Usage Guide

### For Users

1. **Browse Articles**
   - Visit `/blogs`
   - Scroll through Medium-style articles
   - Click article to read full post
   - Check featured video and images on sidebar

2. **Watch Videos**
   - Visit `/videos`
   - Browse video grid
   - Click video to open full-screen viewer
   - Use arrow keys or buttons to navigate
   - Close with ESC key

3. **View Images**
   - Visit `/images`
   - Browse image grid
   - Click image to open carousel
   - Use arrow keys to navigate
   - Use +/- to zoom in/out

### For Admins

1. **Upload Content**
   - Visit `/admin/content`
   - Click "Upload New Content"
   - Select type (article, video, image)
   - Fill required fields
   - Mark as featured (optional)
   - Submit

2. **View Dashboard**
   - See content statistics
   - Quick access links to view content
   - Manage content from public pages

3. **Edit/Delete**
   - Delete via API endpoint
   - Updates are immediate via soft delete

---

## 🔐 Security & Permissions

### User Permissions
- ✅ View all published content
- ❌ Cannot upload content
- ❌ Cannot delete content

### Admin Permissions
- ✅ Upload all content types
- ✅ Delete (soft delete) content
- ✅ Mark content as featured
- ✅ View all statistics

### RLS Policies
```sql
-- Users can view published content
SELECT * FROM content 
WHERE published = true AND deleted_at IS NULL

-- Admins can manage all content
FOR ALL ON content
USING (auth.uid() = admin)
```

---

## 🎬 Animations & UX

### Framer Motion Features
- **Page Transitions**: Fade + slide animations
- **Card Hover**: Scale + shadow effects
- **Modal Entry**: Scale + fade
- **List Stagger**: Sequential animation with delay
- **Progress Indicators**: Dynamic width based on scroll

### Keyboard Shortcuts
- **Videos**: ↑/↓ to navigate, ESC to close
- **Images**: ←/→ to navigate, +/- to zoom, ESC to close

---

## 📱 Responsive Design

- **Mobile** (< 640px): Single column, full-width cards
- **Tablet** (640px - 1024px): 2 columns for videos/images
- **Desktop** (> 1024px): 3 columns, split layout for blogs

---

## 🔧 Setup Instructions

### 1. Run Database Migration
```bash
# Execute in Supabase SQL Editor
\copy scripts/migrations/add-content-system.sql
```

### 2. Environment Variables
Ensure `.env.local` has:
```
NEXT_PUBLIC_SUPABASE_URL=your_url
SUPABASE_SERVICE_ROLE_KEY=your_key
NEXTAUTH_SECRET=your_secret
```

### 3. Access Admin Panel
- Visit `/admin/content`
- Login as admin user
- Start uploading content

---

## 💡 Best Practices

1. **Article Uploads**
   - Keep titles under 100 characters
   - Write engaging excerpts (50-100 words)
   - Use formatted HTML content

2. **Video Uploads**
   - Provide YouTube links or MP4 URLs
   - Upload proper thumbnails (1280x720)
   - Set correct duration in seconds

3. **Image Uploads**
   - Use optimized images (< 500KB)
   - Provide descriptive alt text
   - Use consistent aspect ratios

4. **Featured Content**
   - Mark 1-2 videos/articles as featured
   - Update periodically
   - Highlight best performing content

---

## 📊 Performance Optimizations

- ✅ Image lazy loading (Next.js Image component)
- ✅ Pagination for articles (load more)
- ✅ Soft delete (no hard delete)
- ✅ View count tracking (incremental)
- ✅ Database indexes on frequently queried fields
- ✅ Client-side state management

---

## 🐛 Troubleshooting

### Videos Not Loading
- Check media URL format
- Ensure YouTube video is public
- Verify thumbnail URL is accessible

### Images Not Displaying
- Verify image URL is accessible
- Check image format (JPG, PNG, WebP)
- Ensure alt text is provided

### Admin Upload Not Working
- Confirm user is admin role
- Check authentication token
- Verify database migration executed

---

## 📚 Related Components

- **Blog Editor**: `BlogEditor.tsx` (existing)
- **Blog Card**: `BlogCard.tsx` (existing)
- **Navbar**: `Navbar.tsx` (existing)

---

## 🎯 Future Enhancements

- [ ] Drag-and-drop image uploads
- [ ] Video transcoding
- [ ] Comments on articles
- [ ] Social sharing buttons
- [ ] SEO optimization
- [ ] Multi-language support
- [ ] Advanced search filters
- [ ] Content scheduling
- [ ] Analytics dashboard

---

## 📞 Support

For issues or questions:
1. Check API responses for errors
2. Verify database migration ran successfully
3. Ensure user roles are correctly set in database
4. Check browser console for client-side errors

