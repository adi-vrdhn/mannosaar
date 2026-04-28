'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import BlogEditor from '@/components/blog/BlogEditor';
import { motion } from 'framer-motion';

export default function AdminBlogPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [coverPreview, setCoverPreview] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverError, setCoverError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Redirect if not authenticated or not therapist
  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-gray-600">Please log in to access this page.</p>
        </div>
      </div>
    );
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validation
    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    if (!content.trim()) {
      setError('Content is required');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/blogs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          content,
          excerpt: excerpt.trim() || undefined,
          featured_image: coverImage || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to publish blog');
        return;
      }

      setSuccess('Blog published successfully!');
      setTitle('');
      setContent('');
      setExcerpt('');
      setCoverImage('');
      setCoverPreview('');
      setCoverError('');

      // Redirect to blog details page
      setTimeout(() => {
        router.push(`/blogs/${data.blog.slug}`);
      }, 1500);
    } catch (err) {
      setError('An error occurred');
      console.error('Error publishing blog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverSelect = async (file: File | null) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setCoverError('Please select an image file');
      return;
    }

    setCoverUploading(true);
    setCoverError('');

    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target?.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      setCoverPreview(dataUrl);

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

      setCoverImage(responseData.imageUrl);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload cover image';
      setCoverError(message);
      setCoverImage('');
      setCoverPreview('');
    } finally {
      setCoverUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Create New Blog Post</h1>
          <p className="text-gray-600">Share your thoughts on mental health and wellness</p>
        </motion.div>

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handlePublish}
          className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
        >
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

          {/* Title */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Blog Title <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter an engaging title for your blog post..."
              maxLength={255}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{title.length}/255 characters</p>
          </div>

          {/* Excerpt */}
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Excerpt (Optional)
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="A short summary that appears in the blog list..."
              maxLength={500}
              className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
              disabled={loading}
            />
            <p className="text-xs text-gray-500 mt-1">{excerpt.length}/500 characters</p>
          </div>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Cover Image from Device
            </label>
            <div className="rounded-2xl border border-dashed border-purple-300 bg-purple-50 p-4">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleCoverSelect(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-full file:border-0 file:bg-purple-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-purple-700"
                disabled={loading}
              />
              <p className="mt-2 text-xs text-gray-500">
                This cover image will appear at the top of the article and in the blog feed.
              </p>

              {coverUploading && (
                <p className="mt-3 text-sm font-medium text-purple-700">Uploading cover image...</p>
              )}

              {coverError && (
                <p className="mt-3 text-sm font-medium text-red-600">{coverError}</p>
              )}

              {coverPreview && (
                <div className="mt-4 overflow-hidden rounded-2xl border border-purple-200 bg-white">
                  <img
                    src={coverPreview}
                    alt="Cover preview"
                    className="h-56 w-full object-cover"
                  />
                  <div className="flex items-center justify-between gap-3 p-3">
                    <p className="text-sm font-semibold text-gray-700">Cover selected</p>
                    <button
                      type="button"
                      onClick={() => {
                        setCoverImage('');
                        setCoverPreview('');
                        setCoverError('');
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

          {/* Content Editor */}
          <div className="mb-8">
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
            disabled={loading || !title.trim() || !content.trim() || coverUploading}
            className="w-full px-6 py-4 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
          >
            {loading ? 'Publishing...' : '✨ Publish Blog Post'}
          </motion.button>
        </motion.form>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg"
        >
          <h3 className="font-semibold text-blue-900 mb-2">Tips for Writing Great Blog Posts</h3>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>✓ Start with a clear, engaging title</li>
            <li>✓ Use headings to structure your content</li>
            <li>✓ Keep paragraphs short and readable</li>
            <li>✓ Use lists and bullet points for clarity</li>
            <li>✓ Add relevant links where helpful</li>
            <li>✓ Proofread before publishing</li>
          </ul>
        </motion.div>
      </div>
    </div>
  );
}
