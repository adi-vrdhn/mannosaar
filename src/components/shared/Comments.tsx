'use client';

import { useEffect, useState } from 'react';
import { MessageCircle, Send, AlertCircle } from 'lucide-react';

interface Comment {
  id: string;
  author_name: string;
  comment_text: string;
  created_at: string;
}

interface CommentsProps {
  contentId: string;
  contentType: 'article' | 'video' | 'image';
}

export default function Comments({ contentId, contentType }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [authorName, setAuthorName] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  // Fetch approved comments
  useEffect(() => {
    const fetchComments = async () => {
      try {
        const response = await fetch(
          `/api/comments?contentId=${contentId}&contentType=${contentType}`
        );
        const data = await response.json();
        setComments(data.comments || []);
      } catch (error) {
        console.error('Failed to fetch comments:', error);
        setErrorMessage('Failed to load comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();
  }, [contentId, contentType]);

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!commentText.trim()) {
      setErrorMessage('Please write a comment');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId,
          contentType,
          name: authorName || 'Anonymous',
          email: authorEmail,
          comment: commentText,
        }),
      });

      if (response.ok) {
        setSubmitStatus('success');
        setAuthorName('');
        setAuthorEmail('');
        setCommentText('');

        setTimeout(() => {
          setSubmitStatus('idle');
        }, 3000);

        // Refresh comments
        const refreshResponse = await fetch(
          `/api/comments?contentId=${contentId}&contentType=${contentType}`
        );
        const refreshData = await refreshResponse.json();
        setComments(refreshData.comments || []);
      } else {
        setSubmitStatus('error');
        setErrorMessage('Failed to submit comment');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
      setSubmitStatus('error');
      setErrorMessage('Error submitting comment');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Comments Section Header */}
      <div className="flex items-center gap-2">
        <MessageCircle size={24} className="text-purple-600" />
        <h3 className="text-2xl font-semibold text-gray-900">
          Comments ({comments.length})
        </h3>
      </div>

      {/* Comment Form */}
      <form onSubmit={handleSubmitComment} className="space-y-3 bg-purple-50 p-4 rounded-lg">
        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Your name (optional)"
            className="px-3 py-2 rounded border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
          <input
            type="email"
            value={authorEmail}
            onChange={(e) => setAuthorEmail(e.target.value)}
            placeholder="Your email (optional)"
            className="px-3 py-2 rounded border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20"
          />
        </div>

        <textarea
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Share your thoughts... (comments are moderated before publishing)"
          rows={4}
          maxLength={500}
          className="w-full px-3 py-2 rounded border border-gray-200 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 resize-none"
        />

        <div className="flex items-center justify-between">
          <p className="text-xs text-gray-500">{commentText.length}/500</p>
          <button
            type="submit"
            disabled={isSubmitting || !commentText.trim()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            <Send size={16} />
            {isSubmitting ? 'Posting...' : 'Post Comment'}
          </button>
        </div>

        {errorMessage && (
          <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
            <AlertCircle size={16} />
            {errorMessage}
          </div>
        )}

        {submitStatus === 'success' && (
          <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
            ✓ Comment submitted! It will appear after approval.
          </div>
        )}
      </form>

      {/* Comments List */}
      <div className="space-y-4">
        {isLoading ? (
          <p className="text-gray-500 text-center py-8">Loading comments...</p>
        ) : comments.length === 0 ? (
          <p className="text-gray-500 text-center py-8">No comments yet. Be the first to share your thoughts!</p>
        ) : (
          comments.map((comment) => (
            <div
              key={comment.id}
              className="border border-gray-200 rounded-lg p-4 space-y-2 hover:border-purple-300 transition"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{comment.author_name}</p>
                  <p className="text-xs text-gray-500" suppressHydrationWarning>
                    {new Date(comment.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              </div>
              <p className="text-gray-700 text-sm leading-relaxed">{comment.comment_text}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
