'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

const ReviewsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch('/api/reviews');
        if (!response.ok) throw new Error('Failed to fetch reviews');

        const data = await response.json();
        setReviews(data.reviews || []);
      } catch (err) {
        console.error('Error fetching reviews:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReviews();
  }, []);

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

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span key={star} className={star <= rating ? 'text-2xl text-yellow-400' : 'text-2xl text-gray-300'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading || reviews.length === 0) {
    return null;
  }

  const activeReview = reviews[activeIndex];

  return (
    <section
      id="reviews"
      className="py-16 sm:py-24 bg-gradient-to-br from-purple-100/50 via-purple-50 to-purple-100/50"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="space-y-8 sm:space-y-12"
        >
          {/* Header */}
          <motion.div
            variants={itemVariants}
            className="text-center space-y-3 sm:space-y-4"
          >
            <p className="text-purple-600 font-semibold text-xs sm:text-sm uppercase tracking-widest">
              What Clients Say
            </p>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900">
              Real Stories, Real Impact
            </h2>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto">
              Hear from clients who have experienced meaningful change and growth through therapy.
            </p>
          </motion.div>

          {/* Reviews Carousel */}
          <motion.div
            variants={itemVariants}
            className="relative"
          >
            {/* Active Review Card */}
            <div className="relative min-h-72 sm:h-80">
              <motion.div
                key={activeIndex}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="absolute inset-0 bg-white rounded-2xl sm:rounded-3xl shadow-xl p-6 sm:p-8 lg:p-10 border border-purple-100/50"
              >
                <div className="space-y-4 sm:space-y-6 h-full flex flex-col justify-between">
                  {/* Rating */}
                  {renderStars(activeReview.rating)}

                  {/* Review Text */}
                  <p className="text-gray-700 text-base sm:text-lg leading-relaxed flex-1">
                    "{activeReview.comment}"
                  </p>

                  {/* Info */}
                  <div className="pt-4 border-t border-gray-200">
                    <p className="text-xs sm:text-sm text-gray-500">✓ Verified Session • {new Date(activeReview.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Navigation Dots */}
            <div className="flex justify-center gap-2 sm:gap-3 mt-6 sm:mt-8">
              {reviews.map((_, idx) => (
                <motion.button
                  key={idx}
                  whileHover={{ scale: 1.2 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setActiveIndex(idx)}
                  className={`rounded-full transition-all ${
                    activeIndex === idx
                      ? 'bg-purple-500 w-8 h-3'
                      : 'bg-gray-300 hover:bg-gray-400 w-3 h-3'
                  }`}
                />
              ))}
            </div>
          </motion.div>

          {/* Review Cards Grid */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mt-10 sm:mt-16"
          >
            {reviews.map((review, idx) => (
              <motion.div
                key={review.id}
                whileHover={{ y: -5, boxShadow: '0 20px 25px rgba(0,0,0,0.1)' }}
                className="bg-gradient-to-br from-purple-50 to-white rounded-lg sm:rounded-2xl p-3 sm:p-6 border border-purple-100/50 cursor-pointer"
                onClick={() => setActiveIndex(idx)}
              >
                <div className="flex gap-1 mb-2 sm:mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <span key={star} className={star <= review.rating ? 'text-lg sm:text-xl text-yellow-400' : 'text-lg sm:text-xl text-gray-300'}>
                      ★
                    </span>
                  ))}
                </div>
                <p className="text-gray-600 text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-3">{review.comment}</p>
                <p className="text-gray-500 text-xs">Verified Client</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ReviewsSection;
