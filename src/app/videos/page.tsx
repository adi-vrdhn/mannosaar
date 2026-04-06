'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentNavbar from '@/components/content/ContentNavbar';
import VideoCard from '@/components/content/VideoCard';
import VideoViewer from '@/components/content/VideoViewer';

interface Video {
  id: string;
  title: string;
  description?: string;
  media_url: string;
  thumbnail_url?: string;
  media_duration?: number;
  views_count?: number;
}

export default function VideosPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content?type=video&limit=100');
      const data = await res.json();
      if (data.content) {
        setVideos(data.content);
      }
    } catch (error) {
      console.error('Error fetching videos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ContentNavbar activeTab="videos" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Videos</h1>
          <p className="text-lg text-gray-600">
            Explore our collection of short-form video content and therapeutic insights
          </p>
        </motion.div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
            />
          </div>
        )}

        {/* Empty State */}
        {!loading && videos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🎬</div>
            <p className="text-gray-600 text-lg">No videos available yet</p>
          </motion.div>
        )}

        {/* Videos Grid */}
        {!loading && videos.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {videos.map((video, index) => (
              <VideoCard
                key={video.id}
                id={video.id}
                title={video.title}
                thumbnailUrl={
                  video.thumbnail_url ||
                  'https://images.unsplash.com/photo-1611339555312-e607c90352fd?w=500&h=300&fit=crop'
                }
                duration={video.media_duration}
                onPlay={() => setSelectedVideoIndex(index)}
              />
            ))}
          </motion.div>
        )}

        {/* Video Viewer Modal */}
        {selectedVideoIndex !== null && (
          <VideoViewer
            videos={videos.map((v) => ({
              id: v.id,
              title: v.title,
              mediaUrl: v.media_url,
              description: v.description,
              viewsCount: v.views_count,
            }))}
            initialIndex={selectedVideoIndex}
            onClose={() => setSelectedVideoIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
