'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Video, Image as ImageIcon, Upload } from 'lucide-react';
import { useSession } from 'next-auth/react';

type ContentType = 'article' | 'video' | 'image' | null;

interface AdminUploadPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function AdminUploadPanel({
  isOpen,
  onClose,
  onSuccess,
}: AdminUploadPanelProps) {
  const { data: session } = useSession();
  const [contentType, setContentType] = useState<ContentType>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Article fields
  const [title, setTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');
  const [description, setDescription] = useState('');
  const [excerpt, setExcerpt] = useState('');

  // Video/Image fields
  const [mediaUrl, setMediaUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [mediaDuration, setMediaDuration] = useState('');
  const [imageAltText, setImageAltText] = useState('');
  const [imageCaption, setImageCaption] = useState('');

  // Common
  const [featured, setFeatured] = useState(false);

  const resetForm = () => {
    setTitle('');
    setArticleContent('');
    setDescription('');
    setExcerpt('');
    setMediaUrl('');
    setThumbnailUrl('');
    setMediaDuration('');
    setImageAltText('');
    setImageCaption('');
    setFeatured(false);
    setError('');
    setSuccess('');
  };

  const handleBack = () => {
    resetForm();
    setContentType(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!title.trim()) {
      setError('Title is required');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        type: contentType,
        title,
        description,
        excerpt,
        featured,
      };

      if (contentType === 'article') {
        if (!articleContent.trim()) {
          setError('Article content is required');
          setLoading(false);
          return;
        }
        payload.articleContent = articleContent;
      } else if (contentType === 'video') {
        if (!mediaUrl.trim()) {
          setError('Video URL is required');
          setLoading(false);
          return;
        }
        payload.mediaUrl = mediaUrl;
        payload.thumbnailUrl = thumbnailUrl;
        if (mediaDuration) {
          payload.mediaDuration = parseFloat(mediaDuration);
        }
      } else if (contentType === 'image') {
        if (!mediaUrl.trim()) {
          setError('Image URL is required');
          setLoading(false);
          return;
        }
        payload.mediaUrl = mediaUrl;
        payload.imageAltText = imageAltText;
        payload.imageCaption = imageCaption;
      }

      const res = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to upload content');
        setLoading(false);
        return;
      }

      const typeLabel = contentType ? (contentType.charAt(0).toUpperCase() + contentType.slice(1)) : 'Content';
      setSuccess(`✅ ${typeLabel} uploaded successfully!`);
      resetForm();
      setContentType(null);

      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 1500);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user?.email) {
    return null;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold">
                {contentType ? `Upload ${contentType.charAt(0).toUpperCase() + contentType.slice(1)}` : 'Upload Content'}
              </h2>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-full transition-colors"
              >
                <X size={24} />
              </motion.button>
            </div>

            <div className="p-8">
              {/* Content Type Selection */}
              {!contentType ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <p className="text-gray-600 mb-6">Select the type of content to upload:</p>
                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        type: 'article' as const,
                        label: 'Article',
                        icon: <FileText size={32} />,
                        description: 'Write and publish an article',
                      },
                      {
                        type: 'video' as const,
                        label: 'Video',
                        icon: <Video size={32} />,
                        description: 'Upload or link a video (YouTube, MP4, etc.)',
                      },
                      {
                        type: 'image' as const,
                        label: 'Image',
                        icon: <ImageIcon size={32} />,
                        description: 'Upload an image or multiple images',
                      },
                    ].map((item) => (
                      <motion.button
                        key={item.type}
                        whileHover={{ scale: 1.02, translateX: 8 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setContentType(item.type)}
                        className="p-6 border-2 border-gray-200 hover:border-purple-500 rounded-lg text-left transition-colors group"
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-purple-500 group-hover:text-pink-500 transition-colors">
                            {item.icon}
                          </div>
                          <div>
                            <h3 className="font-bold text-gray-900">{item.label}</h3>
                            <p className="text-sm text-gray-600">{item.description}</p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              ) : (
                /* Upload Form */
                <motion.form
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-6"
                >
                  {/* Error/Success Messages */}
                  {error && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
                    >
                      {error}
                    </motion.div>
                  )}
                  {success && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700"
                    >
                      {success}
                    </motion.div>
                  )}

                  {/* Common Fields */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder={`Enter ${contentType} title`}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Enter a brief description"
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                    />
                  </div>

                  {/* Article-Specific Fields */}
                  {contentType === 'article' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Excerpt (summary)
                        </label>
                        <textarea
                          value={excerpt}
                          onChange={(e) => setExcerpt(e.target.value)}
                          placeholder="Enter article excerpt (appears on blog page)"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Article Content *
                        </label>
                        <textarea
                          value={articleContent}
                          onChange={(e) => setArticleContent(e.target.value)}
                          placeholder="Write your article content here..."
                          rows={8}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none font-mono text-sm"
                        />
                        <p className="text-xs text-gray-500 mt-2">
                          Supports HTML and Markdown formatting
                        </p>
                      </div>
                    </>
                  )}

                  {/* Video-Specific Fields */}
                  {contentType === 'video' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Video URL *
                        </label>
                        <input
                          type="text"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="e.g., https://youtube.com/watch?v=... or https://example.com/video.mp4"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          YouTube, MP4, WebM, or other video formats
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Thumbnail URL
                        </label>
                        <input
                          type="text"
                          value={thumbnailUrl}
                          onChange={(e) => setThumbnailUrl(e.target.value)}
                          placeholder="https://example.com/thumbnail.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Duration (seconds)
                        </label>
                        <input
                          type="number"
                          value={mediaDuration}
                          onChange={(e) => setMediaDuration(e.target.value)}
                          placeholder="e.g., 120"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Image-Specific Fields */}
                  {contentType === 'image' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL *
                        </label>
                        <input
                          type="text"
                          value={mediaUrl}
                          onChange={(e) => setMediaUrl(e.target.value)}
                          placeholder="https://example.com/image.jpg"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Alternative Text
                        </label>
                        <input
                          type="text"
                          value={imageAltText}
                          onChange={(e) => setImageAltText(e.target.value)}
                          placeholder="Describe the image for accessibility"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Caption
                        </label>
                        <textarea
                          value={imageCaption}
                          onChange={(e) => setImageCaption(e.target.value)}
                          placeholder="Add a caption for the image (optional)"
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                        />
                      </div>
                    </>
                  )}

                  {/* Featured Checkbox */}
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="featured"
                      checked={featured}
                      onChange={(e) => setFeatured(e.target.checked)}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
                    />
                    <label htmlFor="featured" className="text-sm font-medium text-gray-700">
                      Mark as featured (appears on homepage)
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t">
                    <motion.button
                      type="button"
                      onClick={handleBack}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={loading}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <Upload size={18} />
                      {loading ? 'Uploading...' : 'Upload'}
                    </motion.button>
                  </div>
                </motion.form>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
