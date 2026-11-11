import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Clock3 } from 'lucide-react';

type BlogCardProps = {
  id: string;
  title: string;
  excerpt: string;
  slug: string;
  author_name?: string;
  created_at: string;
  published_at?: string | null;
  featured_image?: string | null;
  content_type?: string | null;
  reading_minutes?: number;
};

const categoryLabels: Record<string, string> = {
  article: 'Mental Health',
  guide: 'Guides',
  story: 'Stories',
  news: 'Updates',
};

export default function BlogCard({ title, excerpt, slug, featured_image, content_type, reading_minutes }: BlogCardProps) {
  const category = categoryLabels[content_type || 'article'] || 'Mental Health';
  return (
    <article className="group h-full overflow-hidden rounded-xl border border-[#e4dce6] bg-white transition duration-300 hover:border-[#aa8db7] hover:shadow-[0_12px_28px_rgba(68,42,87,0.1)]">
      <Link href={`/blogs/${encodeURIComponent(slug)}`} className="flex h-full flex-col">
        <div className="aspect-square overflow-hidden bg-[#e6dbe9]">
          <Image unoptimized src={featured_image || '/images/social/community-hero.png'} alt={title} width={800} height={800} sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </div>
        <div className="flex flex-1 flex-col p-5">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="text-xs font-semibold text-[#6e3f84]">{category}</span>
            {reading_minutes && <span className="inline-flex items-center gap-1 text-xs text-[#837788]"><Clock3 size={13} aria-hidden="true" />{reading_minutes} min read</span>}
          </div>
          <h2 className="line-clamp-3 font-playfair text-lg font-bold leading-snug text-[#34213f] transition-colors group-hover:text-[#5b267a]">{title}</h2>
          {excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-[#746879]">{excerpt}</p>}
          <span className="mt-auto inline-flex items-center gap-1 pt-4 text-sm font-semibold text-[#6e3f84]">Read article <ArrowRight size={15} aria-hidden="true" /></span>
        </div>
      </Link>
    </article>
  );
}
