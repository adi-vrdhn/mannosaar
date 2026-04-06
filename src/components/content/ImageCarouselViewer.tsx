'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import ShareButtons from '@/components/shared/ShareButtons';

interface ImageItem {
  id: string;
  imageUrl: string;
  altText?: string;
  title?: string;
  description?: string;
  caption?: string;
}

interface ImageCarouselViewerProps {
  images: ImageItem[];
  initialIndex?: number;
  onClose: () => void;
}

export default function ImageCarouselViewer({
  images,
  initialIndex = 0,
  onClose,
}: ImageCarouselViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoomLevel, setZoomLevel] = useState(1);

  const currentImage = images[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowLeft') goToPrevious();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === '+' || e.key === '=') zoomIn();
      if (e.key === '-') zoomOut();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, zoomLevel]);

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setZoomLevel(1);
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setZoomLevel(1);
    }
  };

  const zoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.2, 3));
  };

  const zoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.2, 1));
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

        {/* Image Container */}
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.3 }}
              className="relative w-full h-full flex items-center justify-center"
            >
              <motion.div
                animate={{ scale: zoomLevel }}
                transition={{ duration: 0.2 }}
                className="relative w-full h-full cursor-grab active:cursor-grabbing"
              >
                <Image
                  src={currentImage.imageUrl}
                  alt={currentImage.altText || currentImage.title || 'Gallery image'}
                  fill
                  className="object-contain"
                  priority
                />
              </motion.div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Image Info Overlay */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6"
        >
          <div className="space-y-3">
            {currentImage.title && (
              <h2 className="text-white text-xl font-bold">
                {currentImage.title}
              </h2>
            )}
            {currentImage.caption && (
              <p className="text-gray-200 text-sm italic">
                {currentImage.caption}
              </p>
            )}
            {currentImage.description && (
              <p className="text-gray-300 text-sm">
                {currentImage.description}
              </p>
            )}
            <div className="flex items-center justify-between pt-2">
              <span className="text-sm text-gray-400">
                {currentIndex + 1} / {images.length}
              </span>
              <div className="flex gap-4 items-center">
                <ShareButtons
                  title={currentImage.title || 'Check out this image'}
                  url={typeof window !== 'undefined' ? window.location.href : ''}
                  description={currentImage.caption || currentImage.description}
                  showLabel={false}
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={zoomOut}
                  disabled={zoomLevel <= 1}
                  className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                >
                  −
                </motion.button>
                <span className="text-sm text-gray-300 w-12 text-center">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={zoomIn}
                  disabled={zoomLevel >= 3}
                  className="text-sm px-3 py-1 bg-white/10 hover:bg-white/20 rounded transition-colors disabled:opacity-50"
                >
                  +
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Navigation Buttons */}
        {currentIndex > 0 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToPrevious}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronLeft size={28} className="text-white" />
          </motion.button>
        )}

        {currentIndex < images.length - 1 && (
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={goToNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 bg-white/10 hover:bg-white/20 rounded-full transition-colors"
          >
            <ChevronRight size={28} className="text-white" />
          </motion.button>
        )}

        {/* Progress Indicator */}
        <div className="absolute top-20 left-1/2 -translate-x-1/2 flex gap-1">
          {images.map((_, idx) => (
            <motion.div
              key={idx}
              className={`h-1 rounded-full transition-all ${
                idx === currentIndex ? 'bg-white w-8' : 'bg-white/40 w-2'
              }`}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
