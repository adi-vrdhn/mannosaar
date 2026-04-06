# Social Content Platform - Setup Checklist

## ✅ Completed Components

### Database
- [x] Content table schema (`scripts/migrations/add-content-system.sql`)
- [x] RLS policies for published content
- [x] Soft delete support

### API Routes
- [x] `POST /api/content` - Create content (admin only)
- [x] `GET /api/content` - List content with filters
- [x] `GET /api/content/[id]` - Get single content + view tracking
- [x] `DELETE /api/content/[id]` - Soft delete (admin only)

### Components
- [x] `ContentNavbar` - Tab navigation (Articles, Videos, Images)
- [x] `VideoCard` - Video preview cards
- [x] `ImageCard` - Image preview cards
- [x] `VideoViewer` - Full-screen reels-style viewer
- [x] `ImageCarouselViewer` - Full-screen carousel viewer
- [x] `AdminUploadPanel` - Multi-step upload interface

### Pages
- [x] `/blogs` - Articles with split layout (70% articles, 30% featured)
- [x] `/videos` - Video grid with modal viewer
- [x] `/images` - Image grid with carousel viewer
- [x] `/admin/content` - Content management dashboard

### Documentation
- [x] `SOCIAL_CONTENT_PLATFORM.md` - Complete platform guide

---

## 📋 Setup Steps

### Step 1: Execute Database Migration
```bash
# Open Supabase SQL Editor
# Copy & paste content from: scripts/migrations/add-content-system.sql
# Execute the SQL
```

### Step 2: Restart Dev Server
```bash
npm run dev
```

### Step 3: Test the Platform

#### As Regular User:
1. ✅ Visit `/blogs` - See articles layout with sidebar
2. ✅ Visit `/videos` - See video grid
3. ✅ Visit `/images` - See image gallery

#### As Admin User:
1. ✅ Visit `/admin/content` - See dashboard
2. ✅ Click "Upload New Content"
3. ✅ Create test content:
   - [ ] One article (title, content, excerpt)
   - [ ] One video (YouTube URL or video URL)
   - [ ] One image (image URL, alt text)
4. ✅ Verify content appears on respective pages
5. ✅ Test viewers (click to open modal)

---

## 🎯 Quick Start for Admins

### Upload Your First Article
```
1. Go to /admin/content
2. Click "Upload New Content"
3. Select "Article"
4. Fill in:
   - Title: "My First Article"
   - Excerpt: "A short preview..."
   - Article Content: "Write or paste content here..."
   - Featured: Toggle if desired
5. Click "Upload"
6. Visit /blogs to see it live
```

### Upload Your First Video
```
1. Go to /admin/content
2. Click "Upload New Content"
3. Select "Video"
4. Fill in:
   - Title: "My First Video"
   - Video URL: "https://youtube.com/watch?v=..." 
      (or any video URL)
   - Thumbnail URL: (optional, for custom thumbnail)
   - Duration: 120 (seconds)
5. Click "Upload"
6. Visit /videos to see it live
```

### Upload Your First Image
```
1. Go to /admin/content
2. Click "Upload New Content"
3. Select "Image"
4. Fill in:
   - Title: "Gallery Item"
   - Image URL: "https://unsplash.com/photo/..."
   - Alt text: "Describe image for accessibility"
5. Click "Upload"
6. Visit /images to see it live
```

---

## 🧪 Testing Checklist

### Content Display
- [ ] Articles display on `/blogs` with title, excerpt, date, author
- [ ] Videos display on `/videos` with thumbnail and play button
- [ ] Images display on `/images` with grid layout

### Navigation
- [ ] ContentNavbar tabs work (Articles → Videos → Images)
- [ ] "Show More" buttons redirect to correct pages
- [ ] Featured video shows on blogs sidebar
- [ ] Image carousel shows on blogs sidebar

### Viewers
- [ ] Click video opens full-screen reels viewer
- [ ] Can navigate videos with arrow keys or buttons
- [ ] Arrow keys work: ↑ previous, ↓ next
- [ ] ESC closes video viewer
- [ ] Click image opens full-screen carousel
- [ ] Can navigate images with arrow keys or buttons
- [ ] Can zoom in/out with + and - buttons
- [ ] ESC closes image viewer

### Admin Features
- [ ] Admin can access `/admin/content`
- [ ] Upload button opens modal
- [ ] Can select content type
- [ ] Form submits successfully
- [ ] Content appears immediately after upload
- [ ] Featured checkbox works
- [ ] All field validations work

### Responsive Design
- [ ] Mobile (< 640px): Single column layout
- [ ] Tablet (640-1024px): 2 columns
- [ ] Desktop (> 1024px): 3 columns + split layout

---

## 🔍 Common Issues & Fixes

### "Content not showing on blogs sidebar"
**Fix**: Videos/images need media_url populated. Ensure you're uploading proper URLs.

### "Video not playing in modal"
**Fix**: 
- Check if URL is accessible
- For YouTube: ensure video is public
- For MP4: ensure CORS is enabled

### "Images not loading"
**Fix**:
- Verify image URL is accessible
- Check image format (JPG, PNG, WebP)
- Ensure alt text is provided

### "Admin upload button not visible"
**Fix**:
- Ensure logged-in user has role = 'admin'
- Check NextAuth session is working
- Verify admin check in component

---

## 📊 Database Verification

To check if migration was applied:
```sql
-- In Supabase SQL Editor
SELECT COUNT(*) FROM content;

-- Should return at least 0 (table exists)
-- Check if table has data after uploading content
```

---

## 🚀 Production Checklist

Before deploying to production:
- [ ] Database migration executed successfully
- [ ] All environment variables set in `.env.production`
- [ ] Admin users have correct role in database
- [ ] Test upload/view on staging environment
- [ ] Verify image URLs will be accessible in production
- [ ] Set up CDN for images if needed
- [ ] Configure SEO metadata for content pages

---

## 📞 Support

If you encounter issues:

1. **Check the docs**: `SOCIAL_CONTENT_PLATFORM.md`
2. **Check API responses**: Open browser DevTools → Network tab
3. **Check database**: Log into Supabase and verify content table exists
4. **Check logs**: `npm run dev` terminal for error messages

---

## 🎉 Next Steps

After setup is complete, you can:

1. ✅ Upload test content to all sections
2. ✅ Customize branding/colors in components
3. ✅ Add more admin-only features (edit, featured toggle, etc.)
4. ✅ Integrate with existing navbar
5. ✅ Set up image optimization
6. ✅ Configure social sharing buttons
7. ✅ Add search functionality

---

**Status**: ✅ Ready for deployment!

Date: $(date)
Version: 1.0.0

