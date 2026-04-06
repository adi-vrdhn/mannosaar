'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { FileText, Video, Image as ImageIcon } from 'lucide-react';

export type ContentTab = 'articles' | 'videos' | 'images';

interface ContentNavbarProps {
  activeTab?: ContentTab;
  onTabChange?: (tab: ContentTab) => void;
}

export default function ContentNavbar({ activeTab = 'articles', onTabChange }: ContentNavbarProps) {
  const [active, setActive] = useState<ContentTab>(activeTab);

  const tabs: { id: ContentTab; label: string; icon: React.ReactNode; href: string }[] = [
    { id: 'articles', label: 'Articles', icon: <FileText size={20} />, href: '/blogs' },
    { id: 'videos', label: 'Videos', icon: <Video size={20} />, href: '/videos' },
    { id: 'images', label: 'Images', icon: <ImageIcon size={20} />, href: '/images' },
  ];

  const handleTabClick = (tab: ContentTab) => {
    setActive(tab);
    onTabChange?.(tab);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-0">
          {tabs.map((tab) => (
            <Link
              key={tab.id}
              href={tab.href}
              onClick={(e) => {
                e.preventDefault();
                handleTabClick(tab.id);
              }}
              className="relative flex items-center gap-2 px-6 py-4 font-medium text-gray-600 hover:text-purple-600 transition-colors"
            >
              {tab.icon}
              <span>{tab.label}</span>

              {active === tab.id && (
                <motion.div
                  layoutId="navbar-underline"
                  className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500"
                  transition={{ duration: 0.3 }}
                />
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
