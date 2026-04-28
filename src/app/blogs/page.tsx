/* eslint-disable-next-line @next/next/no-css-tags */
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import { Play, FileText, Video, Image as ImageIcon, X, Loader2, Trash2, Share2 } from 'lucide-react';
import BlogCard from '@/components/blog/BlogCard';
import RichTextEditor from '@/components/admin/RichTextEditor';
import VideoUpload from '@/components/admin/VideoUpload';
import ImageUpload from '@/components/admin/ImageUpload';
import ImageGrid from '@/components/blog/ImageGrid';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_name: string;
  created_at: string;
  featured_image?: string | null;
  views_count: number;
}

interface Video {
  id: string;
  title: string;
  media_url: string;
  thumbnail_url?: string;
  media_duration?: number;
  views_count?: number;
}

interface ContentItem {
  id: string;
  title?: string;
  description?: string;
  media_url: string;
  image_alt_text?: string;
}

export default function BlogsPage() {
  const { data: session, status } = useSession();
  const [activeTab, setActiveTab] = useState<'articles' | 'shorts' | 'images'>('articles');
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Upload state
  const [showUploadUI, setShowUploadUI] = useState(false);
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [articleCoverImage, setArticleCoverImage] = useState('');
  const [articleCoverPreview, setArticleCoverPreview] = useState('');
  const [articleCoverUploading, setArticleCoverUploading] = useState(false);
  const [articleCoverError, setArticleCoverError] = useState('');
  const [videoData, setVideoData] = useState<{
    videoUrl: string;
    publicId: string;
    title: string;
    description: string;
  } | null>(null);
  const [imageData, setImageData] = useState<{
    imageUrl: string;
    caption: string;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [editingDescription, setEditingDescription] = useState('');

  useEffect(() => {
    fetchAllContent();
  }, []);

  const fetchAllContent = async () => {
    setLoading(true);
    try {
      // Fetch blogs
      const blogRes = await fetch('/api/blogs?limit=20');
      if (blogRes.ok) {
        const blogData = await blogRes.json();
        setBlogs(blogData.blogs || []);
      }

      // Fetch videos
      const videoRes = await fetch('/api/content?type=video&limit=12');
      if (videoRes.ok) {
        const videoData = await videoRes.json();
        setVideos(videoData.content || []);
      }

      // Fetch images
      const imageRes = await fetch('/api/content?type=image&limit=12');
      if (imageRes.ok) {
        const imageData = await imageRes.json();
        setImages(imageData.content || []);
      }
    } catch (err) {
      console.error('Error fetching content:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const tabVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  // Only show admin button if session is loaded AND user role is admin in database
  // This is the ONLY source of truth - don't rely on email matching
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin';
  
  // Debug logging
  useEffect(() => {
    console.log('🔍 [BlogsPage] Admin Check:', {
      status,
      userEmail: session?.user?.email,
      userRole: session?.user?.role,
      isAdmin,
      timestamp: new Date().toISOString(),
    });
  }, [status, session, isAdmin]);

  const handlePublishArticle = async () => {
    if (!articleTitle.trim() || !articleContent.trim()) {
      alert('Please fill in title and content');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: articleTitle,
          content: articleContent,
          excerpt: articleContent
            .replace(/<[^>]*>/g, '')
            .substring(0, 200),
          author: 'Neetu Rathore',
          tags: ['mental-health', 'therapy'],
          featured_image: articleCoverImage || undefined,
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setSuccessMessage('Article published successfully!');
        setArticleTitle('');
        setArticleContent('');
        setArticleCoverImage('');
        setArticleCoverPreview('');
        setArticleCoverError('');
        await fetchAllContent();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        console.error('Publish error:', data);
        alert(`Failed to publish article: ${data.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      alert(`Error publishing article: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishVideo = async () => {
    if (!videoData) {
      alert('Please upload a video first');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('🎬 Publishing video:', { videoData });
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          title: videoData.title,
          description: videoData.description,
          mediaUrl: videoData.videoUrl,
          cloudinary_public_id: videoData.publicId,
          featured: false,
        }),
      });

      console.log('🎬 Video publish response:', { status: response.status });
      const responseData = await response.json();
      console.log('🎬 Video publish data:', responseData);

      if (response.ok) {
        setSuccessMessage('Video published successfully!');
        setVideoData(null);
        fetchAllContent();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(`Failed to publish video: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error publishing video:', error);
      alert(`Error publishing video: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleArticleCoverSelect = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setArticleCoverError('Please select an image file');
      return;
    }

    setArticleCoverUploading(true);
    setArticleCoverError('');

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setArticleCoverPreview(dataUrl);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image: dataUrl,
          folder: 'mental-health/blog-covers',
          resourceType: 'image',
        }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(responseData.error || 'Failed to upload cover image');
      }

      setArticleCoverImage(responseData.imageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload cover image';
      setArticleCoverError(message);
      setArticleCoverImage('');
      setArticleCoverPreview('');
    } finally {
      setArticleCoverUploading(false);
    }
  };

  const handleDeleteVideo = async (videoId: string, videoTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${videoTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting video:', videoId);
      const response = await fetch(`/api/content/${videoId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('🗑️ Delete response:', { status: response.status, data });

      if (!response.ok) {
        alert(data.error || 'Failed to delete video');
        return;
      }

      setSuccessMessage('Video deleted successfully!');
      fetchAllContent();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting video:', error);
      alert('An error occurred while deleting');
    }
  };

  const handleDeleteImage = async (imageId: string, imageTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${imageTitle}"? This cannot be undone.`)) {
      return;
    }

    try {
      console.log('🗑️ Deleting image:', imageId);
      const response = await fetch(`/api/content/${imageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      console.log('🗑️ Delete response:', { status: response.status, data });

      if (!response.ok) {
        alert(data.error || 'Failed to delete image');
        return;
      }

      setSuccessMessage('Image deleted successfully!');
      fetchAllContent();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting image:', error);
      alert('An error occurred while deleting');
    }
  };

  const handleEditImage = (imageId: string, currentDescription: string) => {
    setEditingImageId(imageId);
    setEditingDescription(currentDescription);
  };

  const handleSaveDescription = async () => {
    if (!editingImageId) return;

    try {
      console.log('✏️ Updating image description:', editingImageId);
      const response = await fetch(`/api/content/${editingImageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: editingDescription.trim(),
          title: editingDescription.split('\n')[0] || 'Untitled',
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || 'Failed to update description');
        return;
      }

      setSuccessMessage('Description updated successfully!');
      setEditingImageId(null);
      setEditingDescription('');
      fetchAllContent();
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating description:', error);
      alert('An error occurred while updating');
    }
  };

  const handleShareContent = (title: string, contentType: string, contentId: string) => {
    const shareUrl = `${window.location.origin}/blogs?type=${contentType}&id=${contentId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(shareUrl);
    setSuccessMessage(`Share link copied to clipboard!`);
    setTimeout(() => setSuccessMessage(''), 3000);

    // Optional: Use native share if available
    if (navigator.share) {
      navigator.share({
        title: title,
        text: title,
        url: shareUrl,
      });
    }
  };

  const handlePublishImage = async () => {
    if (!imageData) {
      alert('Please upload an image first');
      return;
    }

    setIsSubmitting(true);
    try {
      console.log('📸 Publishing image:', { imageData });
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          title: imageData.caption.split('\n')[0] || 'Untitled',
          description: imageData.caption,
          mediaUrl: imageData.imageUrl,
          featured: false,
        }),
      });

      console.log('📸 Image publish response:', { status: response.status });
      const responseData = await response.json();
      console.log('📸 Image publish data:', responseData);

      if (response.ok) {
        setSuccessMessage('Image posted successfully!');
        setImageData(null);
        fetchAllContent();
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert(`Failed to post image: ${responseData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error posting image:', error);
      alert('Error posting image');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-purple-50">
      {/* Success Message */}
      {successMessage && (
        <div className="fixed top-4 right-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium z-50">
          ✓ {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-white/80 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-purple-700 shadow-sm backdrop-blur">
              Community feed
            </div>
            <div className="space-y-4">
              <h1 className="max-w-3xl text-5xl font-black leading-[0.95] tracking-tight text-gray-900 md:text-7xl">
                Stories, art, and moments from the mindcare journal.
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-gray-600 md:text-xl">
                Share articles, pictures, and short updates with a bold visual style.
              </p>
            </div>

            <div className="grid max-w-2xl grid-cols-3 gap-3">
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-purple-500">Articles</p>
                <p className="mt-2 text-2xl font-black text-gray-900">{blogs.length}</p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-pink-500">Images</p>
                <p className="mt-2 text-2xl font-black text-gray-900">{images.length}</p>
              </div>
              <div className="rounded-3xl border border-white/80 bg-white/90 p-4 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-blue-500">Shorts</p>
                <p className="mt-2 text-2xl font-black text-gray-900">{videos.length}</p>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-[32px] border border-white/80 bg-white/85 p-5 shadow-[0_20px_60px_rgba(99,102,241,0.12)] backdrop-blur"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-purple-500">Create & share</p>
                <p className="mt-2 text-lg font-bold text-gray-900">Posts feel better with a cover image.</p>
              </div>

              {isAdmin && (
                <motion.button
                  onClick={() => setShowUploadUI(!showUploadUI)}
                  className="rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-purple-500/20 transition hover:shadow-xl"
                  whileHover={{ scale: 1.04 }}
                >
                  {showUploadUI ? 'Hide upload' : '+ Upload'}
                </motion.button>
              )}
            </div>

          </motion.div>
        </div>

        {/* Tab Navigation */}
        <div className="mt-10 flex flex-wrap gap-2 rounded-3xl border border-white/70 bg-white/70 p-2 shadow-sm backdrop-blur">
          {[
            { id: 'articles', label: 'Feed', icon: FileText },
            { id: 'shorts', label: 'Reels', icon: Video },
            { id: 'images', label: 'Gallery', icon: ImageIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                    : 'text-gray-600 hover:bg-white hover:text-gray-900'
                }`}
                whileHover={{ scale: 1.05 }}
              >
                <Icon size={20} />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Admin Upload Panel */}
        {isAdmin && showUploadUI && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mt-8 bg-white rounded-xl border-2 border-purple-200 p-6 shadow-lg"
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-purple-900">Upload New Content</h2>
              <button
                onClick={() => setShowUploadUI(false)}
                className="p-1 hover:bg-gray-100 rounded-lg transition"
                title="Close upload panel"
              >
                <X size={24} className="text-gray-600" />
              </button>
            </div>

            {/* Upload Tabs */}
            <div className="space-y-6">
              {/* Articles Upload */}
              {activeTab === 'articles' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Title
                    </label>
                    <input
                      type="text"
                      value={articleTitle}
                      onChange={(e) => setArticleTitle(e.target.value)}
                      placeholder="Enter article title..."
                      className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Article Content
                    </label>
                    <RichTextEditor
                      value={articleContent}
                      onChange={setArticleContent}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Image from Device
                    </label>
                    <div className="rounded-2xl border border-dashed border-purple-300 bg-purple-50 p-4">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleArticleCoverSelect(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        JPG, PNG, or WebP. This image will appear as the article cover.
                      </p>

                      {articleCoverUploading && (
                        <p className="mt-3 text-sm font-medium text-purple-700">Uploading cover image...</p>
                      )}

                      {articleCoverError && (
                        <p className="mt-3 text-sm font-medium text-red-600">{articleCoverError}</p>
                      )}

                      {articleCoverPreview && (
                        <div className="mt-4 overflow-hidden rounded-2xl border border-purple-200 bg-white">
                          <img
                            src={articleCoverPreview}
                            alt="Cover preview"
                            className="h-56 w-full object-cover"
                          />
                          <div className="flex items-center justify-between gap-3 p-3">
                            <p className="text-sm font-semibold text-gray-700">Cover selected</p>
                            <button
                              type="button"
                              onClick={() => {
                                setArticleCoverImage('');
                                setArticleCoverPreview('');
                                setArticleCoverError('');
                              }}
                              className="rounded-full bg-gray-100 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-200"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handlePublishArticle}
                    disabled={isSubmitting || !articleTitle.trim() || !articleContent.trim() || articleCoverUploading}
                    className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                  >
                    {isSubmitting && <Loader2 size={20} className="animate-spin" />}
                    {isSubmitting ? 'Publishing...' : 'Publish Article'}
                  </button>
                </div>
              )}

              {/* Videos Upload */}
              {activeTab === 'shorts' && (
                <div className="space-y-4">
                  <VideoUpload
                    onUpload={(data) => {
                      setVideoData(data);
                    }}
                  />

                  {videoData && (
                    <button
                      onClick={handlePublishVideo}
                      disabled={isSubmitting}
                      className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                    >
                      {isSubmitting && <Loader2 size={20} className="animate-spin" />}
                      {isSubmitting ? 'Publishing...' : 'Publish Video'}
                    </button>
                  )}
                </div>
              )}

              {/* Images Upload */}
              {activeTab === 'images' && (
                <div className="space-y-4">
                  <ImageUpload
                    onUpload={async (data) => {
                      // Auto-publish each image immediately after upload
                      try {
                        console.log('📸 Auto-publishing image:', data);
                        const response = await fetch('/api/content', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            type: 'image',
                            title: data.caption.split('\n')[0] || 'Untitled',
                            description: data.caption,
                            mediaUrl: data.imageUrl,
                            featured: false,
                          }),
                        });

                        const responseData = await response.json();
                        
                        if (response.ok) {
                          setSuccessMessage('Image posted successfully!');
                          fetchAllContent();
                          setTimeout(() => setSuccessMessage(''), 3000);
                        } else {
                          console.error('Failed to publish image:', responseData.error);
                        }
                      } catch (error) {
                        console.error('Error publishing image:', error);
                      }
                    }}
                  />
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>

      {/* Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading...</p>
          </div>
        ) : (
            <motion.div key={activeTab} variants={tabVariants} initial="hidden" animate="visible">
            {/* Articles Tab */}
            {activeTab === 'articles' && (
              <div className="space-y-6">
                {blogs.length > 0 ? (
                  <div className="grid gap-6 lg:grid-cols-2">
                    {blogs.map((blog, idx) => (
                      <motion.div
                        key={blog.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.08 }}
                      >
                        <BlogCard
                          id={blog.id}
                          title={blog.title}
                          excerpt={blog.excerpt || 'No preview available'}
                          slug={blog.slug}
                          author_name={blog.author_name}
                          created_at={blog.created_at}
                          featured_image={blog.featured_image}
                        />
                        <div className="mt-3 flex justify-end pr-2">
                          <button
                            onClick={() => handleShareContent(blog.title, 'article', blog.slug)}
                            className="inline-flex items-center gap-2 rounded-full bg-white/90 px-4 py-2 text-sm font-semibold text-green-700 shadow-sm transition hover:bg-green-50"
                            title="Share article"
                          >
                            <Share2 size={16} />
                            Share
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-[28px] border border-dashed border-purple-200 bg-white/70 px-6 py-14 text-center">
                    <p className="text-lg font-semibold text-gray-900">No articles yet</p>
                    <p className="mt-2 text-sm text-gray-500">Start with a story, a picture, or a short reflection.</p>
                  </div>
                )}
              </div>
            )}

            {/* Shorts (Videos) Tab */}
            {activeTab === 'shorts' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.length > 0 ? (
                  videos.map((video, idx) => (
                    <motion.div
                      key={video.id}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.1 }}
                      className="group cursor-pointer"
                    >
                      <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-all bg-gray-900 aspect-video">
                        {/* Video Thumbnail */}
                        {video.thumbnail_url ? (
                          <img
                            src={video.thumbnail_url}
                            alt={video.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center">
                            <Video size={48} className="text-white opacity-50" />
                          </div>
                        )}

                        {/* Play Button Overlay */}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-all">
                          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
                            <Play size={32} className="text-white fill-white ml-1" />
                          </div>
                        </div>

                        {/* Duration Badge */}
                        {video.media_duration && (
                          <div className="absolute bottom-3 right-3 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold">
                            {formatDuration(video.media_duration)}
                          </div>
                        )}
                      </div>

                      {/* Video Info */}
                      <div className="mt-4">
                        <div className="flex justify-between items-start gap-2">
                          <h3 className="text-lg font-bold text-gray-900 group-hover:text-purple-600 transition-colors line-clamp-2 flex-1">
                            {video.title}
                          </h3>
                          <div className="flex gap-2 flex-shrink-0 mt-1">
                            <button
                              onClick={() => handleShareContent(video.title, 'video', video.id)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Share video"
                            >
                              <Share2 size={18} />
                            </button>
                            {isAdmin && (
                              <button
                                onClick={() => handleDeleteVideo(video.id, video.title)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete video"
                              >
                                <Trash2 size={18} />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">

                        </p>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="col-span-full text-center py-12">
                    <p className="text-gray-500">No shorts yet</p>
                  </div>
                )}
              </div>
            )}

            {/* Images Tab */}
            {activeTab === 'images' && (
              <div className="w-full">
                <ImageGrid images={images} isAdmin={isAdmin} onDelete={handleDeleteImage} onEdit={handleEditImage} />
              </div>
            )}
          </motion.div>
        )}
      </div>

      {/* Edit Image Description Modal */}
      {editingImageId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-6"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Edit Image Description</h2>
            
            <textarea
              value={editingDescription}
              onChange={(e) => setEditingDescription(e.target.value)}
              placeholder="Enter image description (first line will be used as title)"
              rows={6}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none mb-6"
            />

            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setEditingImageId(null);
                  setEditingDescription('');
                }}
                className="px-6 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveDescription}
                className="px-6 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 transition font-medium"
              >
                Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
