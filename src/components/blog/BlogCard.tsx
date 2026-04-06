'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_name: string;
  created_at: string;
  views_count?: number;
}

export default function BlogCard({
  title,
  excerpt,
  slug,
  author_name,
  created_at,
  views_count = 0,
}: BlogCardProps) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100"
    >
      <Link href={`/blogs/${slug}`} className="group">
        <h2 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors line-clamp-2">
          {title}
        </h2>
        <p className="text-gray-600 mb-4 line-clamp-3 leading-relaxed">
          {excerpt}
        </p>
      </Link>

      <div className="flex items-center justify-between text-sm text-gray-500 border-t border-gray-100 pt-4">
        <div className="flex items-center gap-4">
          <span className="font-medium text-gray-700">{author_name}</span>
          <span>{format(new Date(created_at), 'MMM d, yyyy')}</span>
        </div>
        <span className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
          {views_count} views
        </span>
      </div>
    </motion.article>
  );
}
