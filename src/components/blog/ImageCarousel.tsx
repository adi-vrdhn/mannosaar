'use client';

import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ImageItem {
  id: string;
  media_url: string;
  image_alt_text?: string;
  title?: string;
}

interface ImageCarouselProps {
  images: ImageItem[];
}

export default function ImageCarousel({ images }: ImageCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<'left' | 'right'>('right');

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 1000 : -1000,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      zIndex: 0,
      x: dir < 0 ? 1000 : -1000,
      opacity: 0,
    }),
  };

  const goToNext = () => {
    if (currentIndex < images.length - 1) {
      setDirection('right');
      setCurrentIndex(currentIndex + 1);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      setDirection('left');
      setCurrentIndex(currentIndex - 1);
    }
  };

  const goToSlide = (index: number) => {
    setDirection(index > currentIndex ? 'right' : 'left');
    setCurrentIndex(index);
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No images yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Main Carousel */}
      <div className="relative w-full bg-gray-900 rounded-2xl overflow-hidden shadow-xl">
        {/* Image Container */}
        <div className="relative w-full aspect-square">
          <AnimatePresence initial={false} custom={direction}>
            <motion.img
              key={currentIndex}
              src={images[currentIndex].media_url}
              alt={images[currentIndex].image_alt_text || 'Gallery image'}
              custom={direction === 'right' ? 1 : -1}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: 'spring', stiffness: 300, damping: 30 },
                opacity: { duration: 0.2 },
              }}
              className="absolute inset-0 w-full h-full object-cover"
            />
          </AnimatePresence>

          {/* Navigation Arrows */}
          {images.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                disabled={currentIndex === 0}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/30 hover:bg-white/50 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Previous image"
              >
                <ChevronLeft size={28} />
              </button>

              <button
                onClick={goToNext}
                disabled={currentIndex === images.length - 1}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-2 rounded-full bg-white/30 hover:bg-white/50 text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                title="Next image"
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          {/* Counter Badge */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded-lg text-sm font-semibold">
              {currentIndex + 1} / {images.length}
            </div>
          )}

          {/* Image Title Overlay */}
          {images[currentIndex].title && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
              <p className="text-white font-semibold text-lg">
                {images[currentIndex].title}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Thumbnail Strip - Show up to 10 images */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          {images.map((image, index) => (
            <motion.button
              key={image.id}
              onClick={() => goToSlide(index)}
              className={`flex-shrink-0 relative w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                index === currentIndex
                  ? 'border-purple-500 shadow-lg'
                  : 'border-gray-300 opacity-60 hover:opacity-100'
              }`}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <img
                src={image.media_url}
                alt={`Thumbnail ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}
