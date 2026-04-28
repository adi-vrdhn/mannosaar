'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { format } from 'date-fns';
import { ArrowUpRight } from 'lucide-react';

interface BlogCardProps {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_name: string;
  created_at: string;
  featured_image?: string | null;
}

export default function BlogCard({
  title,
  excerpt,
  slug,
  author_name,
  created_at,
  featured_image,
}: BlogCardProps) {
  const initials = author_name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      whileHover={{ y: -6 }}
      className="group overflow-hidden rounded-[28px] border border-white/70 bg-white/85 shadow-[0_18px_50px_rgba(99,102,241,0.12)] backdrop-blur"
    >
      <Link href={`/blogs/${slug}`} className="block">
        <div className="relative aspect-[16/11] overflow-hidden bg-gradient-to-br from-purple-100 via-pink-50 to-blue-100">
          {featured_image ? (
            <img
              src={featured_image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-end bg-[radial-gradient(circle_at_top_left,_rgba(236,72,153,0.18),_transparent_35%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.18),_transparent_28%),linear-gradient(135deg,_rgba(255,255,255,0.95),_rgba(238,242,255,0.9))]">
              <div className="px-6 pb-6">
                <div className="inline-flex rounded-full bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-purple-700">
                  Cover image
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
            <div className="rounded-full bg-white/90 px-3 py-2 text-xs font-semibold text-gray-800 backdrop-blur-md">
              {format(new Date(created_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 to-pink-500 text-sm font-bold text-white shadow-lg">
              {initials || 'MH'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-gray-900">{author_name}</p>
              <p className="text-xs text-gray-500">{format(new Date(created_at), 'EEEE, MMM d')}</p>
            </div>
            <ArrowUpRight className="text-purple-500 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={18} />
          </div>

          <h2 className="line-clamp-2 text-[1.65rem] font-black leading-tight tracking-tight text-gray-900 group-hover:text-purple-700">
            {title}
          </h2>

          <p className="line-clamp-3 text-sm leading-7 text-gray-600">
            {excerpt}
          </p>

          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <span className="text-sm font-semibold text-gray-900 transition-colors group-hover:text-purple-700">
              Read story
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
