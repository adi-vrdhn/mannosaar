'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';

interface ImageCardProps {
  id: string;
  imageUrl: string;
  altText?: string;
  title?: string;
  onOpen: () => void;
}

export default function ImageCard({
  id,
  imageUrl,
  altText,
  title,
  onOpen,
}: ImageCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
      onClick={onOpen}
      className="group relative overflow-hidden rounded-lg cursor-pointer"
    >
      <div className="relative aspect-square w-full overflow-hidden bg-gray-200">
        <Image
          src={imageUrl}
          alt={altText || title || 'Gallery image'}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Overlay on hover */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center"
        >
          <motion.div
            whileHover={{ scale: 1.1 }}
            className="text-white text-center"
          >
            <div className="text-sm font-medium">View</div>
          </motion.div>
        </motion.div>
      </div>

      {/* Title */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-3">
          <h3 className="text-white text-sm font-medium line-clamp-1">
            {title}
          </h3>
        </div>
      )}
    </motion.div>
  );
}
