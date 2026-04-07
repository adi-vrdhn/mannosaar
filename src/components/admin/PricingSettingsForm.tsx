'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface PricingFormProps {
  userRole?: string;
}

interface BundlePricing {
  [key: string]: number; // personal_1, personal_2, personal_3, couple_1, couple_2, couple_3
}

const PricingSettingsForm = ({ userRole }: PricingFormProps) => {
  const [pricing, setPricing] = useState<BundlePricing>({
    personal_1: 2500,
    personal_2: 4500,
    personal_3: 6000,
    couple_1: 3500,
    couple_2: 6500,
    couple_3: 9000,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Only admins can edit pricing
  const canEdit = userRole === 'admin';

  // Fetch current pricing settings from pricing_config table
  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (!response.ok) throw new Error('Failed to fetch pricing');
        
        const data = await response.json();
        setPricing(data.pricing || {
          personal_1: 2500,
          personal_2: 4500,
          personal_3: 6000,
          couple_1: 3500,
          couple_2: 6500,
          couple_3: 9000,
        });
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

    // Validate all prices
    if (Object.values(pricing).some(price => price <= 0)) {
      setError('All prices must be greater than 0');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/admin/pricing/update-bundle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pricing }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update pricing');
      }

      setSuccess('✅ Bundle pricing updated successfully! Changes will be reflected immediately.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to save pricing';
      setError(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handlePriceChange = (key: string, value: number) => {
    setPricing(prev => ({ ...prev, [key]: value }));
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
      <h2 className="text-2xl font-bold text-gray-900 mb-2">💰 Session Bundle Pricing</h2>
      <p className="text-gray-600 mb-6">Set prices for 1, 2, and 3 session bundles (in Indian Rupees)</p>

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

      {/* Pricing Grid */}
      <div className="overflow-x-auto mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gradient-to-r from-purple-100 to-purple-50 border-b-2 border-purple-300">
              <th className="px-6 py-4 text-left font-semibold text-gray-900">Session Type</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">1 Session</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">2 Sessions</th>
              <th className="px-6 py-4 text-center font-semibold text-gray-900">3 Sessions</th>
            </tr>
          </thead>
          <tbody>
            {/* Personal Sessions */}
            <tr className="border-b border-gray-200 hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold text-gray-900">👤 Personal</td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.personal_1}
                    onChange={(e) => handlePriceChange('personal_1', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.personal_2}
                    onChange={(e) => handlePriceChange('personal_2', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.personal_3}
                    onChange={(e) => handlePriceChange('personal_3', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
            </tr>

            {/* Couple Sessions */}
            <tr className="hover:bg-gray-50">
              <td className="px-6 py-4 font-semibold text-gray-900">👫 Couple</td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.couple_1}
                    onChange={(e) => handlePriceChange('couple_1', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.couple_2}
                    onChange={(e) => handlePriceChange('couple_2', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <div className="flex items-center justify-center gap-2">
                  <span className="text-lg font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    value={pricing.couple_3}
                    onChange={(e) => handlePriceChange('couple_3', parseFloat(e.target.value) || 0)}
                    disabled={!canEdit || saving}
                    className="w-24 px-3 py-2 border border-gray-300 rounded-lg text-center font-semibold focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    step="100"
                    min="0"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Savings Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-4">💡 Bundle Savings Overview</h3>
        <div className="grid grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-blue-700 mb-2">Personal Sessions</p>
            <div className="space-y-1 text-sm text-blue-900">
              <p>Single: ₹{pricing.personal_1.toFixed(0)}</p>
              <p>Bundle 2: ₹{pricing.personal_2.toFixed(0)} (save ₹{(pricing.personal_1 * 2 - pricing.personal_2).toFixed(0)})</p>
              <p>Bundle 3: ₹{pricing.personal_3.toFixed(0)} (save ₹{(pricing.personal_1 * 3 - pricing.personal_3).toFixed(0)})</p>
            </div>
          </div>
          <div>
            <p className="text-sm text-blue-700 mb-2">Couple Sessions</p>
            <div className="space-y-1 text-sm text-blue-900">
              <p>Single: ₹{pricing.couple_1.toFixed(0)}</p>
              <p>Bundle 2: ₹{pricing.couple_2.toFixed(0)} (save ₹{(pricing.couple_1 * 2 - pricing.couple_2).toFixed(0)})</p>
              <p>Bundle 3: ₹{pricing.couple_3.toFixed(0)} (save ₹{(pricing.couple_1 * 3 - pricing.couple_3).toFixed(0)})</p>
            </div>
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
          {saving ? '💾 Saving...' : '💾 Save All Prices'}
        </motion.button>
      )}

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-xs text-blue-800">
          ℹ️ These bundle prices will be automatically applied when users select multi-session bookings and payment. Changes take effect immediately.
        </p>
      </div>
    </motion.div>
  );
};

export default PricingSettingsForm;
