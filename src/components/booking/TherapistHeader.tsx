'use client';

import { motion } from 'framer-motion';

interface TherapistHeaderProps {
  languages?: string[];
}

export default function TherapistHeader({
  languages = ['Hindi', 'English'],
}: TherapistHeaderProps) {
  const languagesText = languages.join(' and ');

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-8"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Session Time Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.15)' }}
          className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-3xl shadow-xl p-8 h-48 flex flex-col items-center justify-center text-white transform transition-all"
        >
          <p className="text-sm md:text-base font-semibold uppercase tracking-widest opacity-90 mb-3">Session Time</p>
          <div className="flex items-baseline gap-2">
            <p className="text-5xl md:text-6xl font-bold">40</p>
            <p className="text-2xl md:text-3xl font-semibold">mins</p>
          </div>
        </motion.div>

        {/* Languages Block */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.15)' }}
          className="bg-gradient-to-br from-purple-400 to-purple-500 rounded-3xl shadow-xl p-8 h-48 flex flex-col items-center justify-center text-white transform transition-all"
        >
          <p className="text-sm md:text-base font-semibold uppercase tracking-widest opacity-90 mb-4">Languages</p>
          <p className="text-2xl md:text-3xl font-bold text-center">{languagesText}</p>
        </motion.div>
      </div>
    </motion.div>
  );
}

