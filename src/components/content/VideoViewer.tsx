'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown, ChevronUp } from 'lucide-react';

interface VideoItem {
  id: string;
  title: string;
  mediaUrl: string;
  description?: string;
  viewsCount?: number;
}

interface VideoViewerProps {
  videos: VideoItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function VideoViewer({
  videos,
  initialIndex = 0,
  onClose,
}: VideoViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);

  const currentVideo = videos[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowUp') goToPrevious();
      if (e.key === 'ArrowDown') goToNext();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex]);

  const goToNext = () => {
    if (currentIndex < videos.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsPlaying(true);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsPlaying(true);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
      >
        {/* Close Button */}
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="absolute top-4 right-4 z-50 p-2 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
        >
          <X size={24} className="text-white" />
        </motion.button>

        {/* Video Container */}
        <div className="relative w-full h-full flex items-center justify-center">
          <motion.div
            key={currentVideo.id}
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="relative w-full h-full"
          >
            {/* Video Player */}
            <div className="relative w-full h-full flex items-center justify-center bg-gray-900">
              {currentVideo.mediaUrl.includes('youtube') ||
              currentVideo.mediaUrl.includes('youtu.be') ? (
                // YouTube Embed
                <iframe
                  width="100%"
                  height="100%"
                  title={`Video: ${currentVideo.title}`}
                  src={`https://www.youtube.com/embed/${extractYouTubeId(
                    currentVideo.mediaUrl
                  )}?autoplay=1`}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0"
                />
              ) : (
                // HTML5 Video
                <video
                  key={currentVideo.id}
                  src={currentVideo.mediaUrl}
                  autoPlay={isPlaying}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Video Info Overlay */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6"
            >
              <h2 className="text-white text-xl font-bold mb-2">
                {currentVideo.title}
              </h2>
              {currentVideo.description && (
                <p className="text-gray-300 text-sm line-clamp-2">
                  {currentVideo.description}
                </p>
              )}
              <div className="flex items-center gap-4 mt-3 text-sm text-gray-400">
                {currentVideo.viewsCount && (
                  <span>{currentVideo.viewsCount} views</span>
                )}
                <span>
                  {currentIndex + 1} / {videos.length}
                </span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevious}
            className="absolute left-1/2 top-4 -translate-x-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronUp size={24} className="text-white" />
          </motion.button>
        )}

        {currentIndex < videos.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNext}
            className="absolute left-1/2 bottom-4 -translate-x-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronDown size={24} className="text-white" />
          </motion.button>
        )}

        {/* Progress Indicator */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex gap-1">
          {videos.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
              }`}
              animate={{
                backgroundColor: idx === currentIndex ? '#ffffff' : 'rgba(255,255,255,0.4)',
              }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

function extractYouTubeId(url: string): string {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
    /youtube\.com\/embed\/([^&\n?#]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  return url;
}
