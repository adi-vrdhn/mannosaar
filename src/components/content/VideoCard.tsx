'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { Play } from 'lucide-react';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  duration?: number;
  onPlay: () => void;
}

export default function VideoCard({
  id,
  title,
  thumbnailUrl,
  duration,
  onPlay,
}: VideoCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      whileHover={{ scale: 1.05 }}
      onClick={onPlay}
      className="group relative cursor-pointer overflow-hidden rounded-lg bg-gray-900"
    >
      {/* Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-800">
        <Image
          src={thumbnailUrl}
          alt={title}
          fill
          className="object-cover group-hover:scale-110 transition-transform duration-300"
        />

        {/* Play Button Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            whileHover={{ scale: 1.15 }}
            className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90"
          >
            <Play size={28} className="fill-gray-900 text-gray-900 ml-1" />
          </motion.div>
        </motion.div>
      </div>

      {/* Duration Badge */}
      {duration && (
        <div className="absolute top-2 right-2 bg-black/75 text-white text-sm px-2 py-1 rounded">
          {Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}
        </div>
      )}

      {/* Title */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <h3 className="text-white font-semibold line-clamp-2 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>
      </div>
    </motion.div>
  );
}
