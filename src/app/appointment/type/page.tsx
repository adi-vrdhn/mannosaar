'use client';

import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TherapistHeader from '@/components/booking/TherapistHeader';

interface BundlePricing {
  personal_1: number;
  personal_2: number;
  personal_3: number;
  couple_1: number;
  couple_2: number;
  couple_3: number;
}

export default function AppointmentTypePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [pricing, setPricing] = useState<BundlePricing>({
    personal_1: 2500,
    personal_2: 4500,
    personal_3: 6000,
    couple_1: 3500,
    couple_2: 6500,
    couple_3: 9000,
  });
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [selectedType, setSelectedType] = useState<string | null>(null); // 'personal' or 'couple'
  const [selectedBundle, setSelectedBundle] = useState<number | null>(null); // 1, 2, or 3

  // Fetch bundle prices on mount
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricing(data.pricing);
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
        // Use defaults if fetch fails
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPricing();
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
    setSelectedType(type);
    setSelectedBundle(null); // Reset bundle selection
  };

  const handleSelectBundle = (bundleSize: number) => {
    setSelectedBundle(bundleSize);
    // Proceed to slots page with type AND bundle info
    const params = new URLSearchParams({
      type: selectedType!,
      bundle: bundleSize.toString(),
    });
    router.push(`/appointment/slots?${params.toString()}`);
  };

  const handleBack = () => {
    setSelectedType(null);
    setSelectedBundle(null);
  };

  const getPriceForBundle = (type: string, bundle: number) => {
    const key = `${type}_${bundle}`;
    return pricing[key as keyof BundlePricing] || 0;
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

        <AnimatePresence mode="wait">
          {!selectedType ? (
            // STEP 1: Select Session Type
            <motion.div
              key="type-selection"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
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
                      <p className="text-xs text-gray-500 mb-1">Starting from</p>
                      <p className="text-2xl font-bold text-purple-600">₹{pricing.personal_1}</p>
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
                      <p className="text-xs text-gray-500 mb-1">Starting from</p>
                      <p className="text-2xl font-bold text-purple-600">₹{pricing.couple_1}</p>
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
            </motion.div>
          ) : (
            // STEP 2: Select Bundle Size (1, 2, or 3 sessions)
            <motion.div
              key="bundle-selection"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Header */}
              <motion.div
                variants={itemVariants}
                initial="hidden"
                animate="visible"
                className="text-center mb-12"
              >
                <button
                  onClick={handleBack}
                  className="text-purple-600 hover:text-purple-700 font-semibold mb-4 inline-flex items-center gap-2"
                >
                  ← Back
                </button>
                <h1 className="text-4xl font-bold text-gray-900 mb-2">
                  {selectedType === 'personal' ? '👤' : '👥'} Select Bundle Size
                </h1>
                <p className="text-xl text-gray-600">
                  Choose how many sessions you'd like to book ({selectedType} therapy)
                </p>
              </motion.div>

              {/* Bundle Options */}
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-3 gap-6 mb-12"
              >
                {/* 1 Session */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-purple-200 hover:border-purple-400 transition-all"
                  onClick={() => handleSelectBundle(1)}
                >
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900 mb-2">1</p>
                    <p className="text-gray-600 mb-4">Session</p>
                    <div className="bg-purple-50 rounded-lg p-4 mb-6">
                      <p className="text-3xl font-bold text-purple-600">
                        ₹{getPriceForBundle(selectedType, 1)}
                      </p>
                      <p className="text-sm text-gray-600 mt-2">One-time payment</p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Select
                    </motion.button>
                  </div>
                </motion.div>

                {/* 2 Sessions - Recommended */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl shadow-xl p-8 cursor-pointer border-2 border-purple-400 transition-all relative"
                  onClick={() => handleSelectBundle(2)}
                >
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    🎁 Save ₹{(getPriceForBundle(selectedType, 1) * 2 - getPriceForBundle(selectedType, 2)).toFixed(0)}
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900 mb-2">2</p>
                    <p className="text-gray-600 mb-4">Sessions</p>
                    <div className="bg-white rounded-lg p-4 mb-6">
                      <p className="text-3xl font-bold text-purple-600">
                        ₹{getPriceForBundle(selectedType, 2)}
                      </p>
                      <p className="text-sm text-purple-600 mt-2 font-semibold">
                        Save {Math.round((1 - getPriceForBundle(selectedType, 2) / (getPriceForBundle(selectedType, 1) * 2)) * 100)}%
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Select (Popular)
                    </motion.button>
                  </div>
                </motion.div>

                {/* 3 Sessions - Best Value */}
                <motion.div
                  variants={itemVariants}
                  whileHover={{ scale: 1.05, y: -5 }}
                  className="bg-white rounded-2xl shadow-lg p-8 cursor-pointer border-2 border-purple-200 hover:border-purple-400 transition-all"
                  onClick={() => handleSelectBundle(3)}
                >
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-full text-sm font-semibold">
                    🏆 Best Value
                  </div>
                  <div className="text-center">
                    <p className="text-4xl font-bold text-gray-900 mb-2">3</p>
                    <p className="text-gray-600 mb-4">Sessions</p>
                    <div className="bg-green-50 rounded-lg p-4 mb-6">
                      <p className="text-3xl font-bold text-green-600">
                        ₹{getPriceForBundle(selectedType, 3)}
                      </p>
                      <p className="text-sm text-green-600 mt-2 font-semibold">
                        Save {Math.round((1 - getPriceForBundle(selectedType, 3) / (getPriceForBundle(selectedType, 1) * 3)) * 100)}%
                      </p>
                    </div>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-full px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                    >
                      Select
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Info Box */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-8">
                <p className="text-blue-900 font-semibold mb-2">ℹ️ Bundle Sessions</p>
                <p className="text-blue-800 text-sm">
                  After selecting your bundle size, you'll choose the dates and times for all {selectedBundle || "your"} sessions. Each session will have its own Google Meet link.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
