'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';

interface Comment {
  id: string;
  user_name: string;
  content: string;
  created_at: string;
}

interface CommentSectionProps {
  slug: string;
}

export default function CommentSection({ slug }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchComments();
  }, [slug]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/blogs/${slug}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data.comments || []);
      }
    } catch (err) {
      console.error('Error fetching comments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!newComment.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    if (!session) {
      setError('You must be logged in to comment');
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch(`/api/blogs/${slug}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const data = await res.json();
        setComments([data.comment, ...comments]);
        setNewComment('');
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to post comment');
      }
    } catch (err) {
      setError('An error occurred');
      console.error('Error posting comment:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mt-12 pt-8 border-t border-gray-200">
      <h3 className="text-2xl font-bold text-gray-900 mb-8">Comments ({comments.length})</h3>

      {/* Comment Input */}
      {session ? (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmitComment}
          className="mb-8 p-6 bg-purple-50 rounded-lg border border-purple-200"
        >
          <label className="block mb-3">
            <span className="text-sm font-semibold text-gray-700">Add a comment</span>
            <span className="text-xs text-gray-500 ml-2">as {session.user?.name}</span>
          </label>
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Share your thoughts on this article..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
            disabled={submitting}
          />
          {error && <p className="text-red-600 text-sm mt-2">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !newComment.trim()}
            className="mt-3 px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white font-semibold rounded-lg transition-colors"
          >
            {submitting ? 'Posting...' : 'Post Comment'}
          </button>
        </motion.form>
      ) : (
        <div className="mb-8 p-6 bg-yellow-50 rounded-lg border border-yellow-200">
          <p className="text-yellow-800">
            <a href="/auth/login" className="font-semibold text-yellow-900 hover:underline">
              Sign in
            </a>
            {' '}to post a comment.
          </p>
        </div>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-500 text-center py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            No comments yet. Be the first to comment!
          </p>
        ) : (
          comments.map((comment, index) => (
            <motion.div
              key={comment.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div>
                  <p className="font-semibold text-gray-900">{comment.user_name}</p>
                  <p className="text-sm text-gray-500">
                    {format(new Date(comment.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 leading-relaxed">{comment.content}</p>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
