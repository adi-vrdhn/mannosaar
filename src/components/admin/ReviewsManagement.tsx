'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface Review {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
}

interface ReviewsManagementProps {
  userRole?: string;
}

const ReviewsManagement = ({ userRole }: ReviewsManagementProps) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form state
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  const canManage = userRole === 'admin';

  // Fetch reviews
  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reviews');
      if (!response.ok) throw new Error('Failed to fetch reviews');

      const data = await response.json();
      setReviews(data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReview = async () => {
    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (newComment.trim().length < 10) {
      setError('Comment must be at least 10 characters');
      return;
    }

    setAdding(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/reviews/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rating: newRating,
          comment: newComment,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add review');
      }

      setReviews([data.review, ...reviews]);
      setNewComment('');
      setNewRating(5);
      setSuccess('✅ Review added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to add review';
      setError(errorMsg);
    } finally {
      setAdding(false);
    }
  };

  const handleDeleteReview = async (id: string) => {
    if (!confirm('Are you sure you want to delete this review?')) return;

    setDeleting(id);
    setError('');

    try {
      const response = await fetch(`/api/reviews/delete?id=${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete review');
      }

      setReviews(reviews.filter((r) => r.id !== id));
      setSuccess('✅ Review deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to delete review';
      setError(errorMsg);
    } finally {
      setDeleting(null);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? 'text-yellow-400 text-xl' : 'text-gray-300 text-xl'}
          >
            ★
          </span>
        ))}
      </div>
    );
  };

  if (loading) {
    return <div className="text-gray-600">Loading reviews...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">⭐ Customer Reviews</h2>

      {!canManage && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ You have view-only access. Only admins can manage reviews.
          </p>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      {/* Add Review Form */}
      {canManage && (
        <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Review</h3>

          <div className="space-y-4">
            {/* Rating Selector */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Rating (1-5 stars)
              </label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setNewRating(star)}
                    className={`text-3xl transition-all ${
                      star <= newRating
                        ? 'text-yellow-400 scale-110'
                        : 'text-gray-300 hover:text-yellow-300'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            {/* Comment Input */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Review Comment
              </label>
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                disabled={adding}
                placeholder="Write a customer review (min 10 characters)..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-500 mt-1">
                {newComment.length}/10 characters minimum
              </p>
            </div>

            {/* Add Button */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAddReview}
              disabled={adding}
              className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {adding ? '➕ Adding...' : '➕ Add Review'}
            </motion.button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Current Reviews ({reviews.length})
        </h3>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No reviews yet. Add one to get started!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reviews.map((review) => (
              <motion.div
                key={review.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                className="p-4 border border-gray-200 rounded-lg hover:border-purple-300 hover:bg-purple-50 transition-all"
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    {renderStars(review.rating)}
                    <p className="text-gray-700 mt-2">{review.comment}</p>
                    <p className="text-xs text-gray-500 mt-2">
                      {new Date(review.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {canManage && (
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleDeleteReview(review.id)}
                      disabled={deleting === review.id}
                      className="px-3 py-1 text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                      title="Delete review"
                    >
                      {deleting === review.id ? '⏳' : '🗑️'}
                    </motion.button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ReviewsManagement;
