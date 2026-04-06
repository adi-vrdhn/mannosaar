'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import ContentNavbar from '@/components/content/ContentNavbar';
import ImageCard from '@/components/content/ImageCard';
import ImageCarouselViewer from '@/components/content/ImageCarouselViewer';

interface Image {
  id: string;
  title?: string;
  description?: string;
  media_url: string;
  image_alt_text?: string;
  excerpt?: string;
}

export default function ImagesPage() {
  const [images, setImages] = useState<Image[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);

  useEffect(() => {
    fetchImages();
  }, []);

  const fetchImages = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content?type=image&limit=100');
      const data = await res.json();
      if (data.content) {
        setImages(data.content);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ContentNavbar activeTab="images" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Gallery</h1>
          <p className="text-lg text-gray-600">
            Browse our collection of beautiful images and visual content
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
        {!loading && images.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="text-6xl mb-4">🖼️</div>
            <p className="text-gray-600 text-lg">No images available yet</p>
          </motion.div>
        )}

        {/* Images Grid */}
        {!loading && images.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
          >
            {images.map((image, index) => (
              <ImageCard
                key={image.id}
                id={image.id}
                imageUrl={image.media_url}
                altText={image.image_alt_text}
                title={image.title}
                onOpen={() => setSelectedImageIndex(index)}
              />
            ))}
          </motion.div>
        )}

        {/* Image Carousel Viewer Modal */}
        {selectedImageIndex !== null && (
          <ImageCarouselViewer
            images={images.map((img) => ({
              id: img.id,
              imageUrl: img.media_url,
              altText: img.image_alt_text,
              title: img.title,
              description: img.description,
              caption: img.excerpt,
            }))}
            initialIndex={selectedImageIndex}
            onClose={() => setSelectedImageIndex(null)}
          />
        )}
      </div>
    </div>
  );
}
