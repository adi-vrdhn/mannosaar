'use client';

import { useState, useEffect, use } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { MoreVertical, Edit2, Trash2, X } from 'lucide-react';
import CommentSection from '@/components/blog/CommentSection';
import BlogEditor from '@/components/blog/BlogEditor';
import ShareButtons from '@/components/shared/ShareButtons';

interface BlogDetail {
  id: string;
  title: string;
  content: string;
  excerpt?: string;
  author_name: string;
  author_id: string;
  created_at: string;
  updated_at: string;
  views_count: number;
}

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [blog, setBlog] = useState<BlogDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [editExcerpt, setEditExcerpt] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isAuthor = blog && session?.user?.id === blog.author_id;
  // ONLY check database role - this is the source of truth
  const isAdmin = status === 'authenticated' && session?.user?.role === 'admin';
  const canEdit = isAuthor || isAdmin;

  useEffect(() => {
    fetchBlog();
  }, [slug]);

  const fetchBlog = async () => {
    try {
      const res = await fetch(`/api/blogs/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setBlog(data.blog);
        setEditTitle(data.blog.title);
        setEditContent(data.blog.content);
        setEditExcerpt(data.blog.excerpt || '');
      } else {
        setError('Blog not found');
      }
    } catch (err) {
      setError('Failed to load blog');
      console.error('Error fetching blog:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveEdit = async () => {
    if (!editTitle.trim() || !editContent.trim()) {
      alert('Title and content are required');
      return;
    }

    setIsSaving(true);
    try {
      const res = await fetch(`/api/blogs/${slug}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editTitle.trim(),
          content: editContent,
          excerpt: editExcerpt.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to save changes');
        return;
      }

      const data = await res.json();
      setBlog(data.blog);
      setIsEditing(false);
      alert('Blog updated successfully!');
    } catch (err) {
      alert('An error occurred while saving');
      console.error('Error saving blog:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      console.log('🗑️ Deleting blog with slug:', slug);
      const res = await fetch(`/api/blogs/${slug}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      console.log('Delete response:', { status: res.status, data });

      if (!res.ok) {
        alert(data.error || 'Failed to delete blog');
        setIsDeleting(false);
        return;
      }

      console.log('✅ Blog deleted successfully, redirecting...');
      alert('Blog deleted successfully!');
      // Redirect to blogs page with full page refresh to get fresh data
      setTimeout(() => {
        window.location.href = '/blogs';
      }, 300);
    } catch (err) {
      console.error('Error deleting blog:', err);
      alert('An error occurred while deleting');
      setIsDeleting(false);
    } finally {
      setShowDeleteConfirm(false);
    }
  };


  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          <p className="mt-4 text-gray-600">Loading article...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white pt-24 pb-12">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <Link
            href="/blogs"
            className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition-colors"
          >
            ← Back to Blog
          </Link>
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white pt-24 pb-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-lg p-8 border border-gray-100"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Edit Blog Post</h2>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditTitle(blog.title);
                  setEditContent(blog.content);
                  setEditExcerpt(blog.excerpt || '');
                }}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <form className="space-y-6">
              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Blog Title <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Enter blog title..."
                  maxLength={255}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">{editTitle.length}/255 characters</p>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Excerpt (Optional)
                </label>
                <textarea
                  value={editExcerpt}
                  onChange={(e) => setEditExcerpt(e.target.value)}
                  placeholder="A short summary..."
                  maxLength={500}
                  className="w-full h-20 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 transition-colors resize-none"
                  disabled={isSaving}
                />
                <p className="text-xs text-gray-500 mt-1">{editExcerpt.length}/500 characters</p>
              </div>

              {/* Content Editor */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Content <span className="text-red-600">*</span>
                </label>
                <BlogEditor
                  onContentChange={(html) => setEditContent(html)}
                  initialContent={editContent}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={handleSaveEdit}
                  disabled={isSaving || !editTitle.trim() || !editContent.trim()}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 hover:from-purple-500 hover:to-purple-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-all"
                >
                  {isSaving ? 'Saving...' : '💾 Save Changes'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setEditTitle(blog.title);
                    setEditContent(blog.content);
                    setEditExcerpt(blog.excerpt || '');
                  }}
                  className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-all"
                >
                  ✕ Cancel
                </motion.button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-white pt-24 pb-12">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8"
        >
          <Link
            href="/blogs"
            className="inline-flex items-center text-purple-600 hover:text-purple-700 font-semibold transition-colors"
          >
            ← Back to Blog
          </Link>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex justify-between items-start gap-4 mb-6">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 leading-tight flex-1">
              {blog.title}
            </h1>

            {/* Three-Dot Menu for Admin/Author */}
            {canEdit && (
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-2 rounded-full hover:bg-gray-100 transition-colors relative"
                  title="More options"
                >
                  <MoreVertical size={24} className="text-gray-600" />
                </button>

                {/* Dropdown Menu */}
                {showMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className="absolute right-0 top-12 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-48"
                  >
                    <button
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-gray-700 hover:text-blue-600 transition-colors border-b border-gray-100"
                    >
                      <Edit2 size={18} />
                      Edit Post
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(true);
                        setShowMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-2 text-red-600 hover:bg-red-50 transition-colors rounded-b-lg"
                    >
                      <Trash2 size={18} />
                      Delete Post
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between text-gray-600 border-b border-gray-200 pb-6">
            <div className="flex items-center gap-4 mb-4 md:mb-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900">{blog.author_name}</span>
              </div>
              <span>•</span>
              <time dateTime={blog.created_at} className="text-sm">
                {format(new Date(blog.created_at), 'MMMM d, yyyy')}
              </time>
            </div>
            <div className="flex items-center gap-4 text-sm">
              <time dateTime={blog.updated_at} className="text-gray-500">
                Updated {format(new Date(blog.updated_at), 'MMM d')}
              </time>
            </div>
          </div>

          {/* Share Section */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="mt-6 pt-6 border-t border-gray-200"
          >
            <p className="text-sm font-semibold text-gray-600 mb-3">Share this article</p>
            <ShareButtons
              title={blog.title}
              url={typeof window !== 'undefined' ? window.location.href : ''}
              description={blog.excerpt || blog.title}
              showLabel={false}
            />
          </motion.div>
        </motion.div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-2xl p-8 max-w-sm shadow-xl"
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4">Delete Blog Post?</h3>
              <p className="text-gray-600 mb-6">This action cannot be undone. The blog post will be permanently deleted.</p>
              <div className="flex gap-3">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-semibold rounded-lg transition-colors"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 font-semibold rounded-lg transition-colors"
                >
                  Cancel
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* Content */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="prose prose-lg prose-purple max-w-none mb-12"
        >
          <div
            dangerouslySetInnerHTML={{ __html: blog.content }}
            className="text-gray-800 leading-relaxed"
          />
        </motion.div>

        {/* Comments Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <CommentSection slug={slug} />
        </motion.div>
      </article>
    </div>
  );
}
