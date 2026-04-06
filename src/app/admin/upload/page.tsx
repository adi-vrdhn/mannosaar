'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/admin/RichTextEditor';
import VideoUpload from '@/components/admin/VideoUpload';
import ImageUpload from '@/components/admin/ImageUpload';
import { FileText, Video, Image, Loader2 } from 'lucide-react';

type TabType = 'articles' | 'videos' | 'images';

export default function AdminUpload() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('articles');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Article State
  const [articleTitle, setArticleTitle] = useState('');
  const [articleContent, setArticleContent] = useState('');

  // Video State
  const [videoData, setVideoData] = useState<{
    videoUrl: string;
    publicId: string;
    title: string;
    description: string;
  } | null>(null);

  // Image State
  const [imageData, setImageData] = useState<{
    imageUrl: string;
    caption: string;
  } | null>(null);

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
        }),
      });

      if (response.ok) {
        setSuccessMessage('Article published successfully!');
        setArticleTitle('');
        setArticleContent('');
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to publish article');
      }
    } catch (error) {
      console.error('Error publishing article:', error);
      alert('Error publishing article');
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
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'video',
          title: videoData.title,
          description: videoData.description,
          url: videoData.videoUrl,
          cloudinary_public_id: videoData.publicId,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Video published successfully!');
        setVideoData(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to publish video');
      }
    } catch (error) {
      console.error('Error publishing video:', error);
      alert('Error publishing video');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishImage = async () => {
    if (!imageData) {
      alert('Please upload an image first');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'image',
          title: imageData.caption.split('\n')[0] || 'Untitled',
          description: imageData.caption,
          url: imageData.imageUrl,
        }),
      });

      if (response.ok) {
        setSuccessMessage('Image posted successfully!');
        setImageData(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        alert('Failed to post image');
      }
    } catch (error) {
      console.error('Error posting image:', error);
      alert('Error posting image');
    } finally {
      setIsSubmitting(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ReactNode }[] = [
    { id: 'articles', label: 'Articles', icon: <FileText size={20} /> },
    { id: 'videos', label: 'Videos', icon: <Video size={20} /> },
    { id: 'images', label: 'Images', icon: <Image size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-playfair font-bold text-purple-900 mb-2">
            Content Management
          </h1>
          <p className="text-gray-600">
            Create and publish articles, videos, and images
          </p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 font-medium">
            ✓ {successMessage}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-8 flex gap-2 border-b border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 font-medium flex items-center gap-2 border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 md:p-8">
          {/* Articles Tab */}
          {activeTab === 'articles' && (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Article Title
                </label>
                <input
                  type="text"
                  value={articleTitle}
                  onChange={(e) => setArticleTitle(e.target.value)}
                  placeholder="Enter article title..."
                  className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 text-lg"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Article Content
                </label>
                <RichTextEditor
                  value={articleContent}
                  onChange={setArticleContent}
                />
              </div>

              <button
                onClick={handlePublishArticle}
                disabled={isSubmitting || !articleTitle.trim() || !articleContent.trim()}
                className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
              >
                {isSubmitting && <Loader2 size={20} className="animate-spin" />}
                {isSubmitting ? 'Publishing...' : 'Publish Article'}
              </button>
            </div>
          )}

          {/* Videos Tab */}
          {activeTab === 'videos' && (
            <div className="space-y-6">
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

          {/* Images Tab */}
          {activeTab === 'images' && (
            <div className="space-y-6">
              <ImageUpload
                onUpload={(data) => {
                  setImageData(data);
                }}
              />

              {imageData && (
                <button
                  onClick={handlePublishImage}
                  disabled={isSubmitting}
                  className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition"
                >
                  {isSubmitting && <Loader2 size={20} className="animate-spin" />}
                  {isSubmitting ? 'Publishing...' : 'Publish Image'}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
