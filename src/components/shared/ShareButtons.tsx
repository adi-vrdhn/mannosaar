'use client';

import { motion } from 'framer-motion';
import { Share2, Share, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ShareButtonsProps {
  title: string;
  url: string;
  description?: string;
  showLabel?: boolean;
}

export default function ShareButtons({
  title,
  url,
  description,
  showLabel = true,
}: ShareButtonsProps) {
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareOptions = [
    {
      name: 'Twitter',
      icon: '𝕏',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`,
      color: 'hover:bg-black/10',
    },
    {
      name: 'Facebook',
      icon: 'f',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-50',
    },
    {
      name: 'LinkedIn',
      icon: 'in',
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      color: 'hover:bg-blue-50',
    },
    {
      name: 'WhatsApp',
      icon: '💬',
      url: `https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`,
      color: 'hover:bg-green-50',
    },
    {
      name: 'Email',
      icon: '✉️',
      url: `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(description || title + '\n\n' + url)}`,
      color: 'hover:bg-gray-50',
    },
  ];

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center gap-2 px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 font-semibold rounded-lg transition-colors"
      >
        <Share2 size={18} />
        {showLabel && 'Share'}
      </motion.button>

      {/* Share Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden z-50 min-w-max"
        >
          {/* Social Share Options */}
          <div className="p-2 border-b border-gray-200">
            <p className="text-xs font-semibold text-gray-600 px-3 py-2">
              Share on Social Media
            </p>
            <div className="grid grid-cols-5 gap-1">
              {shareOptions.map((option) => (
                <motion.a
                  key={option.name}
                  href={option.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`p-3 flex items-center justify-center rounded text-lg font-bold transition-colors ${option.color}`}
                  title={option.name}
                >
                  {option.icon}
                </motion.a>
              ))}
            </div>
          </div>

          {/* Copy Link Option */}
          <motion.button
            whileHover={{ backgroundColor: '#f3f4f6' }}
            onClick={handleCopyLink}
            className="w-full px-4 py-3 text-left text-sm font-medium text-gray-700 flex items-center gap-2 transition-colors"
          >
            {copied ? (
              <>
                <Check size={16} className="text-green-600" />
                <span className="text-green-600">Copied to clipboard!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Link</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
