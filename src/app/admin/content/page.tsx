'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Upload, FileText, Video, Image as ImageIcon } from 'lucide-react';
import AdminUploadPanel from '@/components/content/AdminUploadPanel';

interface ContentStats {
  articles: number;
  videos: number;
  images: number;
}

export default function AdminContentPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<ContentStats>({ articles: 0, videos: 0, images: 0 });
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
      return;
    }

    if (session?.user?.role !== 'admin') {
      router.push('/');
      return;
    }

    fetchStats();
  }, [status, session]);

  const fetchStats = async () => {
    try {
      const [articlesRes, videosRes, imagesRes] = await Promise.all([
        fetch('/api/content?type=article&limit=1'),
        fetch('/api/content?type=video&limit=1'),
        fetch('/api/content?type=image&limit=1'),
      ]);

      const [articlesData, videosData, imagesData] = await Promise.all([
        articlesRes.json(),
        videosRes.json(),
        imagesRes.json(),
      ]);

      setStats({
        articles: articlesData.total || 0,
        videos: videosData.total || 0,
        images: imagesData.total || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-purple-200 border-t-purple-600 rounded-full"
        />
      </div>
    );
  }

  if (!session || session.user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Content Management</h1>
          <p className="text-lg text-gray-600">
            Manage your articles, videos, and images all in one place
          </p>
        </motion.div>

        {/* Upload Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsUploadOpen(true)}
            className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold rounded-lg transition-all shadow-lg hover:shadow-xl"
          >
            <Upload size={24} />
            Upload New Content
          </motion.button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ staggerChildren: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {[
            {
              icon: <FileText size={32} />,
              label: 'Articles',
              count: stats.articles,
              color: 'from-blue-500 to-blue-600',
              bgColor: 'bg-blue-50',
              textColor: 'text-blue-600',
            },
            {
              icon: <Video size={32} />,
              label: 'Videos',
              count: stats.videos,
              color: 'from-purple-500 to-purple-600',
              bgColor: 'bg-purple-50',
              textColor: 'text-purple-600',
            },
            {
              icon: <ImageIcon size={32} />,
              label: 'Images',
              count: stats.images,
              color: 'from-pink-500 to-pink-600',
              bgColor: 'bg-pink-50',
              textColor: 'text-pink-600',
            },
          ].map((stat, idx) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`${stat.bgColor} rounded-2xl p-8 border-2 border-transparent hover:border-${stat.textColor}`}
            >
              <div className={`${stat.textColor} mb-4`}>{stat.icon}</div>
              <div className="text-gray-900 font-semibold text-lg">{stat.label}</div>
              <div className={`${stat.textColor} text-4xl font-bold mt-2`}>
                {stat.count}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-lg p-8"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <a
              href="/blogs"
              className="p-6 border-2 border-gray-200 hover:border-blue-500 rounded-lg hover:bg-blue-50 transition-all group"
            >
              <FileText className="text-blue-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-bold text-gray-900 mb-2">View Articles</h3>
              <p className="text-gray-600">Browse all published articles</p>
            </a>

            <a
              href="/videos"
              className="p-6 border-2 border-gray-200 hover:border-purple-500 rounded-lg hover:bg-purple-50 transition-all group"
            >
              <Video className="text-purple-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-bold text-gray-900 mb-2">View Videos</h3>
              <p className="text-gray-600">Browse all published videos</p>
            </a>

            <a
              href="/images"
              className="p-6 border-2 border-gray-200 hover:border-pink-500 rounded-lg hover:bg-pink-50 transition-all group"
            >
              <ImageIcon className="text-pink-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-bold text-gray-900 mb-2">View Gallery</h3>
              <p className="text-gray-600">Browse all published images</p>
            </a>

            <a
              href="/admin"
              className="p-6 border-2 border-gray-200 hover:border-gray-500 rounded-lg hover:bg-gray-50 transition-all group"
            >
              <Upload className="text-gray-600 mb-3 group-hover:scale-110 transition-transform" size={32} />
              <h3 className="font-bold text-gray-900 mb-2">Admin Panel</h3>
              <p className="text-gray-600">Back to main admin dashboard</p>
            </a>
          </div>
        </motion.div>
      </div>

      {/* Upload Panel Modal */}
      <AdminUploadPanel
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          fetchStats();
          setIsUploadOpen(false);
        }}
      />
    </div>
  );
}
