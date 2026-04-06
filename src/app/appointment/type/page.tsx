'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import TherapistHeader from '@/components/booking/TherapistHeader';

export default function AppointmentTypePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [prices, setPrices] = useState({ personal: 1200, couple: 1500 });
  const [loadingPrices, setLoadingPrices] = useState(true);

  // Fetch prices on mount
  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          setPrices(data.prices);
        }
      } catch (err) {
        console.error('Error fetching prices:', err);
        // Use defaults if fetch fails
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPrices();
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      router.push('/auth/login');
    } else {
      setIsReady(true);
    }
  }, [session, status, router]);

  if (status === 'loading' || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const handleSelectType = (type: string) => {
    router.push(`/appointment/slots?type=${type}`);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Therapist Header */}
        <TherapistHeader languages={['Hindi', 'English']} />

        {/* Header */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Select Session Type</h1>
          <p className="text-xl text-gray-600">Choose the therapy session that fits your needs</p>
        </motion.div>

        {/* Session Type Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid md:grid-cols-2 gap-8 mb-12"
        >
          {/* Personal Session */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all"
            onClick={() => handleSelectType('personal')}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-5xl">👤</div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Session Fee</p>
                <p className="text-2xl font-bold text-purple-600">₹{prices.personal}</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Personal Session</h2>
            <p className="text-gray-600 mb-6">
              One-on-one therapy session tailored specifically to your individual needs and concerns.
            </p>
            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Individual focus</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Personalized treatment plan</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Complete confidentiality</span>
              </li>
            </ul>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Continue →
            </motion.button>
          </motion.div>

          {/* Couple Session */}
          <motion.div
            variants={itemVariants}
            whileHover={{ scale: 1.02, y: -5 }}
            className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-transparent hover:border-purple-300 transition-all"
            onClick={() => handleSelectType('couple')}
          >
            <div className="flex justify-between items-start mb-4">
              <div className="text-5xl">👥</div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Session Fee</p>
                <p className="text-2xl font-bold text-purple-600">₹{prices.couple}</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Couple Session</h2>
            <p className="text-gray-600 mb-6">
              Joint therapy session for couples looking to strengthen their relationship and communication.
            </p>
            <ul className="space-y-3 text-gray-700 mb-8">
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Couples therapy</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Relationship counseling</span>
              </li>
              <li className="flex items-center">
                <span className="mr-3">✓</span>
                <span>Shared growth & harmony</span>
              </li>
            </ul>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
            >
              Continue →
            </motion.button>
          </motion.div>
        </motion.div>

        {/* Back Link */}
        <div className="text-center">
          <a href="/" className="text-purple-600 hover:text-purple-700 font-semibold">
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
