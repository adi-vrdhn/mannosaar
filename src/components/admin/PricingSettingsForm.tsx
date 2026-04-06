'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PricingFormProps {
  userRole?: string;
}

const PricingSettingsForm = ({ userRole }: PricingFormProps) => {
  const [personal, setPersonal] = useState<number>(1200);
  const [couple, setCouple] = useState<number>(1500);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only admins can edit pricing
  const canEdit = userRole === 'admin';

  // Fetch current pricing settings
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (!response.ok) throw new Error('Failed to fetch pricing');
        
        const data = await response.json();
        setPersonal(data.prices.personal || 1200);
        setCouple(data.prices.couple || 1500);
      } catch (err) {
        console.error('Error fetching pricing:', err);
        setError('Failed to load current pricing');
      } finally {
        setLoading(false);
      }
    };

    fetchPricing();
  }, []);

  const handleSave = async () => {
    if (!canEdit) {
      setError('You do not have permission to update pricing');
      return;
    }

    if (personal <= 0 || couple <= 0) {
      setError('Prices must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/pricing/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ personal, couple }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update pricing');
      }

      setSuccess('✅ Pricing updated successfully! Changes will be reflected immediately.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save pricing';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-gray-600">Loading pricing settings...</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white rounded-2xl shadow-lg p-8"
    >
      <h2 className="text-2xl font-bold text-gray-900 mb-6">💰 Session Pricing</h2>

      {!canEdit && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            ⚠️ You have view-only access. Only admins can edit pricing.
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

      <div className="space-y-6">
        {/* Personal Session Price */}
        <motion.div
          whileHover={canEdit ? { scale: 1.02 } : {}}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold text-gray-700">
            Personal Session Price (₹)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">₹</span>
            <input
              type="number"
              value={personal}
              onChange={(e) => setPersonal(parseFloat(e.target.value) || 0)}
              disabled={!canEdit || saving}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              step="0.01"
              min="0"
            />
          </div>
          <p className="text-xs text-gray-500">
            This is the price for personal therapy sessions
          </p>
        </motion.div>

        {/* Couple Session Price */}
        <motion.div
          whileHover={canEdit ? { scale: 1.02 } : {}}
          className="space-y-3"
        >
          <label className="block text-sm font-semibold text-gray-700">
            Couple Session Price (₹)
          </label>
          <div className="flex items-center gap-3">
            <span className="text-2xl font-bold text-gray-900">₹</span>
            <input
              type="number"
              value={couple}
              onChange={(e) => setCouple(parseFloat(e.target.value) || 0)}
              disabled={!canEdit || saving}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              step="0.01"
              min="0"
            />
          </div>
          <p className="text-xs text-gray-500">
            This is the price for couple therapy sessions
          </p>
        </motion.div>

        {/* Price Summary */}
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4 border border-purple-200">
          <p className="text-sm text-purple-900 font-semibold mb-2">Current Pricing:</p>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-purple-700">Personal</p>
              <p className="text-2xl font-bold text-purple-900">₹{personal.toFixed(2)}</p>
            </div>
            <div>
              <p className="text-xs text-purple-700">Couple</p>
              <p className="text-2xl font-bold text-purple-900">₹{couple.toFixed(2)}</p>
            </div>
          </div>
        </div>

        {/* Save Button */}
        {canEdit && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSave}
            disabled={saving}
            className="w-full px-6 py-3 bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? '💾 Saving...' : '💾 Save Pricing'}
          </motion.button>
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          ℹ️ These prices will be automatically applied to all booking sessions and Razorpay payments. Changes take effect immediately.
        </p>
      </div>
    </motion.div>
  );
};

export default PricingSettingsForm;
