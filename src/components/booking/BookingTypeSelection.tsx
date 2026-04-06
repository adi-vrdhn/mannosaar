'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useEffect } from 'react';

const BookingTypeSelection = () => {
  const router = useRouter();
  const { data: session } = useSession();
  const [selectedType, setSelectedType] = useState<'personal' | 'couple' | null>(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (session === undefined) return; // Still loading
    if (!session) {
      router.push('/auth/login');
    }
  }, [session, router]);

  const handleSelectType = (type: 'personal' | 'couple') => {
    setSelectedType(type);
    // Navigate to slots page with type in URL
    setTimeout(() => {
      router.push(`/appointment/slots?type=${type}`);
    }, 300);
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  const therapyTypes = [
    {
      id: 'personal',
      title: 'Personal Therapy',
      description: 'One-on-one session with Neetu Rathore',
      icon: '👤',
      color: 'from-purple-400 to-pink-400',
      features: ['Individual focus', 'Personalized approach', '45 minutes'],
    },
    {
      id: 'couple',
      title: 'Couple Therapy',
      description: 'Relationship counseling for two people',
      icon: '👥',
      color: 'from-blue-400 to-cyan-400',
      features: ['Relationship focus', 'Communication work', '45 minutes'],
    },
  ];

  if (!session) {
    return null; // Show nothing while redirecting
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
            Choose Your Session Type
          </h1>
          <p className="text-xl text-gray-600">
            Select the therapy type that suits your needs
          </p>
        </motion.div>

        {/* Therapy Type Cards */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12"
        >
          {therapyTypes.map((type) => (
            <motion.div
              key={type.id}
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -10 }}
              onClick={() => handleSelectType(type.id as 'personal' | 'couple')}
              className={`cursor-pointer relative overflow-hidden rounded-3xl shadow-xl transition-all ${
                selectedType === type.id ? 'ring-4 ring-purple-600' : ''
              }`}
            >
              <div className={`bg-gradient-to-br ${type.color} p-8 md:p-12 text-white min-h-96 flex flex-col justify-between relative`}>
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20"></div>

                {/* Content */}
                <div className="relative z-10">
                  <div className="text-6xl mb-6">{type.icon}</div>
                  <h2 className="text-4xl font-bold mb-2">{type.title}</h2>
                  <p className="text-white/90 text-lg mb-8">{type.description}</p>

                  {/* Features */}
                  <div className="space-y-3">
                    {type.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="text-2xl">✓</span>
                        <span className="text-white/80">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Button */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  className="mt-8 w-full bg-white text-purple-600 font-bold py-3 px-6 rounded-xl hover:shadow-xl transition-all relative z-10 cursor-pointer"
                >
                  Select {type.title}
                </motion.button>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="bg-white rounded-2xl shadow-lg p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-3">1</div>
              <h4 className="font-semibold text-gray-900 mb-2">Select Type</h4>
              <p className="text-gray-600">Choose your preferred therapy type</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-3">2</div>
              <h4 className="font-semibold text-gray-900 mb-2">Pick Slot</h4>
              <p className="text-gray-600">Select date and time that works for you</p>
            </div>
            <div className="text-center">
              <div className="text-5xl font-bold text-purple-600 mb-3">3</div>
              <h4 className="font-semibold text-gray-900 mb-2">Confirm</h4>
              <p className="text-gray-600">Review and confirm your appointment</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default BookingTypeSelection;
