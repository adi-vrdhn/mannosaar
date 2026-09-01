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
      className="group overflow-hidden border border-white/70 bg-white/55 shadow-[0_14px_30px_rgba(68,42,87,0.1)]"
    >
      <Link href={`/blogs/${slug}`} className="block">
        <div className="relative aspect-[16/11] overflow-hidden bg-[#bda5d2]">
          {featured_image ? (
            <img
              src={featured_image}
              alt={title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-end bg-[#bda5d2]">
              <div className="px-6 pb-6">
                <div className="inline-flex border-b border-[#5b267a]/45 pb-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#4c245f]">
                  Mannosaar journal
                </div>
              </div>
            </div>
          )}

          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between gap-3">
            <div className="rounded-full bg-white/85 px-3 py-2 text-xs font-semibold text-[#34213f] backdrop-blur-md">
              {format(new Date(created_at), 'MMM d, yyyy')}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5b267a] text-sm font-bold text-white">
              {initials || 'MH'}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-[#34213f]">{author_name}</p>
              <p className="text-xs text-[#4c4052]">{format(new Date(created_at), 'EEEE, MMM d')}</p>
            </div>
            <ArrowUpRight className="text-[#5b267a] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" size={18} />
          </div>

          <h2 className="line-clamp-2 font-playfair text-2xl font-bold leading-tight text-[#34213f] group-hover:text-[#5b267a]">
            {title}
          </h2>

          <p className="line-clamp-3 text-sm leading-7 text-[#4c4052]">
            {excerpt}
          </p>

          <div className="flex items-center justify-between border-t border-[#6f4b88]/15 pt-4">
            <span className="text-sm font-semibold text-[#34213f] transition-colors group-hover:text-[#5b267a]">
              Read story
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
