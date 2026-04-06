'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Link from 'next/link';

const AboutSection = () => {
  const [showAllExpertise, setShowAllExpertise] = useState(false);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6 },
    },
  };

  const expertiseAreas = [
    'Addiction',
    'ADHD',
    'Anger',
    'Anxiety',
    'Autism',
    'Bipolar Disorder',
    'Bullying',
    'Child & Adolescent',
    'Depression',
    'Developmental Delay',
    'Grief and Loss',
    'OCD',
    'Personality Disorder',
    'Phobia',
    'Physical Health',
    'Post Traumatic Stress Disorder (PTSD)',
    'Relationship',
    'Self Improvement',
    'Sensory Processing Disorder',
    'Sexual Dysfunction',
    'Sleep',
    'Stress',
    'Workplace',
  ];

  const displayedAreas = showAllExpertise ? expertiseAreas : expertiseAreas.slice(0, 6);

  return (
    <section
      id="about"
      className="py-16 sm:py-20 lg:py-24 bg-gradient-to-br from-purple-50 via-purple-100/30 to-purple-50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="max-w-3xl mx-auto"
        >
          {/* Therapist Info */}
          <motion.div variants={itemVariants} className="space-y-4 sm:space-y-6">
            <motion.div variants={itemVariants}>
              <p className="text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-widest">
                About Your Therapist
              </p>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mt-2">
                Neetu Rathore
              </h2>
            </motion.div>

            {/* Experience */}
            <motion.div
              variants={itemVariants}
              className="space-y-2 sm:space-y-3"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Experience</h3>
              <p className="text-gray-600 text-base sm:text-lg leading-relaxed">
                20+ years of clinical experience in individual and couple's therapy
              </p>
              <div className="flex items-center gap-4 pt-2">
                <div className="flex-1 bg-purple-100 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    whileInView={{ width: '100%' }}
                    viewport={{ once: true }}
                    transition={{ duration: 1 }}
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-full rounded-full"
                  />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-gray-700">20+</span>
              </div>
            </motion.div>

            {/* Area of Expertise */}
            <motion.div
              variants={itemVariants}
              className="space-y-2 sm:space-y-3"
            >
              <h3 className="text-lg sm:text-xl font-semibold text-gray-800">Area of Expertise</h3>
              <div className="grid grid-cols-2 gap-2">
                {displayedAreas.map((area, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ x: 5 }}
                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-purple-50 transition-colors"
                  >
                    <span className="text-purple-500 flex-shrink-0">✓</span>
                    <span className="text-gray-700 text-xs sm:text-sm">{area}</span>
                  </motion.div>
                ))}
              </div>
              {expertiseAreas.length > 6 && (
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowAllExpertise(!showAllExpertise)}
                  className="text-purple-600 hover:text-purple-700 font-semibold text-xs sm:text-sm mt-2 sm:mt-3 transition-colors"
                >
                  {showAllExpertise ? '▼ Show Less' : '▶ Show More'}
                </motion.button>
              )}
            </motion.div>

            {/* Description */}
            <motion.p
              variants={itemVariants}
              className="text-gray-600 leading-relaxed text-base"
            >
              Neetu Rathore specializes in creating a safe, non-judgmental space where you can
              explore your feelings and work towards meaningful change. Her approach combines
              evidence-based techniques with genuine empathy and over two decades of clinical expertise.
            </motion.p>

            {/* Know More Button */}
            <motion.div variants={itemVariants}>
              <Link href="/about">
                <motion.div
                  whileHover={{
                    scale: 1.05,
                    boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)',
                  }}
                  whileTap={{ scale: 0.95 }}
                  className="inline-block px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-400 to-purple-500 text-white rounded-lg sm:rounded-xl font-semibold hover:shadow-lg transition-all cursor-pointer text-sm sm:text-base"
                >
                  Know More
                </motion.div>
              </Link>
            </motion.div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutSection;
