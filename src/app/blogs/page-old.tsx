'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import BlogCard from '@/components/blog/BlogCard';
import BlogEditor from '@/components/blog/BlogEditor';
import VideoCard from '@/components/content/VideoCard';
import ImageCard from '@/components/content/ImageCard';
import ContentNavbar from '@/components/content/ContentNavbar';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { Play, Image as ImageIcon } from 'lucide-react';

interface Blog {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_name: string;
  created_at: string;
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

interface Image {
  id: string;
  title?: string;
  media_url: string;
  image_alt_text?: string;
}

export default function BlogsPage() {
  const { data: session } = useSession();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBlogs();
    fetchFeaturedContent();
  }, [page]);

  const fetchFeaturedContent = async () => {
    try {
      // Fetch featured videos
      const videoRes = await fetch('/api/content?type=video&featured=true&limit=1');
      const videoData = await videoRes.json();
      if (videoData.content?.length > 0) {
        setVideos(videoData.content);
      }

      // Fetch images
      const imageRes = await fetch('/api/content?type=image&limit=6');
      const imageData = await imageRes.json();
      if (imageData.content?.length > 0) {
        setImages(imageData.content);
      }
    } catch (err) {
      console.error('Error fetching featured content:', err);
    }
  };

  const fetchBlogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/blogs?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        if (page === 1) {
          setBlogs(data.blogs || []);
        } else {
          setBlogs(prev => [...prev, ...(data.blogs || [])]);
        }
        setHasMore((data.blogs || []).length === 10);
      }
    } catch (err) {
      console.error('Error fetching blogs:', err);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setPublishing(true);

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to publish blog');
        setPublishing(false);
        return;
      }

      setSuccess('Blog published successfully!');
      setTitle('');
      setContent('');
      setExcerpt('');
      setShowEditor(false);

      // Refresh blogs
      setTimeout(() => {
        setPage(1);
        fetchBlogs();
      }, 1000);
    } catch (err) {
      setError('An error occurred');
      console.error('Error publishing blog:', err);
    } finally {
      setPublishing(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Content Navigation */}
      <ContentNavbar activeTab="articles" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-2">
            Articles & Insights
          </h1>
          <p className="text-lg text-gray-600">
            Read our latest articles on wellness, therapy, and personal growth
          </p>
        </motion.div>

        {/* Admin Upload Button */}
        {session?.user?.role === 'admin' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => setShowEditor(!showEditor)}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-lg transition-all shadow-lg hover:shadow-xl"
            >
              ✍️ Write a New Article
            </button>
          </motion.div>
        )}

        {/* Blog Editor */}
        {showEditor && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-12 bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Create New Article</h2>
              <button
                onClick={() => {
                  setShowEditor(false);
                  setTitle('');
                  setContent('');
                  setExcerpt('');
                  setError('');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Messages */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
              >
                {error}
              </motion.div>
            )}

            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
              >
                {success}
              </motion.div>
            )}

            <form onSubmit={handlePublish} className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Article Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter an engaging title..."
                  maxLength={255}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  disabled={publishing}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/255 characters</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Excerpt (Optional)
                </label>
                <textarea
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="A short summary that appears in the blog list..."
                  maxLength={500}
                  className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                  disabled={publishing}
                />
                <p className="text-xs text-gray-500 mt-1">{excerpt.length}/500 characters</p>
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Content <span className="text-red-600">*</span>
                </label>
                <BlogEditor
                  onContentChange={(html) => setContent(html)}
                  initialContent={content}
                />
              </div>

              {/* Publish Button */}
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={publishing || !title.trim() || !content.trim()}
                className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
              >
                {publishing ? 'Publishing...' : '✨ Publish Article'}
              </motion.button>
            </form>
          </motion.div>
        )}

        {/* Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT SECTION: 70% - Articles */}
          <div className="lg:col-span-2">
            {loading && blogs.length === 0 ? (
              <div className="text-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  className="inline-block w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
                />
                <p className="mt-4 text-gray-600">Loading articles...</p>
              </div>
            ) : blogs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg">
                <p className="text-gray-600 text-lg mb-4">No articles published yet.</p>
                <p className="text-gray-500">Check back soon!</p>
              </div>
            ) : (
              <>
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {blogs.map((blog) => (
                    <BlogCard key={blog.id} {...blog} />
                  ))}
                </motion.div>

                {/* Load More Button */}
                {hasMore && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center mt-8"
                  >
                    <button
                      onClick={() => setPage(page + 1)}
                      disabled={loading}
                      className="px-8 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                    >
                      {loading ? 'Loading...' : 'Load More Articles'}
                    </button>
                  </motion.div>
                )}
              </>
            )}
          </div>

          {/* RIGHT SECTION: 30% - Videos & Images */}
          <div className="space-y-8">
            {/* Featured Video Section */}
            {videos.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Play size={20} className="text-purple-600" />
                    Latest Video
                  </h3>
                  <VideoCard
                    id={videos[0].id}
                    title={videos[0].title}
                    thumbnailUrl={
                      videos[0].thumbnail_url ||
                      'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=500&h=300&fit=crop'
                    }
                    duration={videos[0].media_duration}
                    onPlay={() => {
                      // Could open full viewer here
                    }}
                  />
                  <Link
                    href="/videos"
                    className="block mt-4 text-center px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors"
                  >
                    View All Videos
                  </Link>
                </div>
              </motion.div>
            )}

            {/* Images Gallery Section */}
            {images.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white rounded-xl shadow-md overflow-hidden"
              >
                <div className="p-4">
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <ImageIcon size={20} className="text-pink-600" />
                    Gallery
                  </h3>

                  {/* Image Carousel Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {images.slice(0, 4).map((image) => (
                      <div
                        key={image.id}
                        className="aspect-square rounded-lg overflow-hidden bg-gray-200 hover:shadow-lg transition-shadow"
                      >
                        <img
                          src={image.media_url}
                          alt={image.image_alt_text || 'Gallery image'}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300 cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>

                  <Link
                    href="/images"
                    className="block text-center px-4 py-2 bg-pink-100 hover:bg-pink-200 text-pink-700 font-semibold rounded-lg transition-colors"
                  >
                    View All Images
                  </Link>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
