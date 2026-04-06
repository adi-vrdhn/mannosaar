'use client';

import { motion } from 'framer-motion';
import { Trash2, Edit2, ChevronDown, ChevronUp, Share2 } from 'lucide-react';
import { useState } from 'react';

interface ImageItem {
  id: string;
  title?: string;
  media_url: string;
  image_alt_text?: string;
  description?: string;
}

interface ImageGridProps {
  images: ImageItem[];
  isAdmin?: boolean;
  onDelete?: (imageId: string, title: string) => void;
  onEdit?: (imageId: string, currentDescription: string) => void;
}

export default function ImageGrid({ images, isAdmin = false, onDelete, onEdit }: ImageGridProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [shareMenuId, setShareMenuId] = useState<string | null>(null);

  const handleShare = (imageId: string, imageTitle: string) => {
    const imageUrl = `${window.location.origin}/blogs?image=${imageId}`;
    
    // Copy to clipboard
    navigator.clipboard.writeText(imageUrl);
    alert('Link copied to clipboard!');
    setShareMenuId(null);

    // Optional: Open share menu for social media
    if (navigator.share) {
      navigator.share({
        title: imageTitle,
        text: imageTitle,
        url: imageUrl,
      });
    }
  };

  if (images.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No images yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {images.map((image, idx) => {
        const isExpanded = expandedId === image.id;
        const displayTitle = image.title || '';

        return (
          <motion.div
            key={image.id}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.1 }}
            className="group"
          >
            <div className="space-y-3">
              {/* Image Container */}
              <div className="relative rounded-2xl overflow-hidden shadow-lg hover:shadow-xl transition-shadow bg-gray-100 aspect-[4/5]">
                <img
                  src={image.media_url}
                  alt={image.image_alt_text || image.title || 'Gallery image'}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />

                {/* Admin & Share Buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => handleShare(image.id, image.title || 'Untitled')}
                    className="p-2 rounded-lg bg-green-500 hover:bg-green-600 text-white transition-colors"
                    title="Share image"
                  >
                    <Share2 size={18} />
                  </button>
                  {isAdmin && onEdit && (
                    <button
                      onClick={() => onEdit(image.id, image.description || '')}
                      className="p-2 rounded-lg bg-blue-500 hover:bg-blue-600 text-white transition-colors"
                      title="Edit description"
                    >
                      <Edit2 size={18} />
                    </button>
                  )}
                  {isAdmin && onDelete && (
                    <button
                      onClick={() => onDelete(image.id, image.title || 'Untitled')}
                      className="p-2 rounded-lg bg-red-500 hover:bg-red-600 text-white transition-colors"
                      title="Delete image"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>

              {/* Caption with Expand/Collapse */}
              {displayTitle && (
                <div className="px-2">
                  <p className={`text-sm text-gray-700 font-medium ${!isExpanded ? 'line-clamp-2' : ''}`}>
                    {displayTitle}
                  </p>

                  {/* Show More/Less Button */}
                  {displayTitle.length > 80 && (
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : image.id)}
                      className="mt-2 flex items-center gap-1 text-purple-600 hover:text-purple-700 text-xs font-medium transition-colors"
                    >
                      {isExpanded ? (
                        <>
                          Show less <ChevronUp size={14} />
                        </>
                      ) : (
                        <>
                          Show more <ChevronDown size={14} />
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
