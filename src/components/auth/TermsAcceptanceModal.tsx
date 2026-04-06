'use client';

import { useState } from 'react';
import Link from 'next/link';
import { X } from 'lucide-react';

interface TermsAcceptanceModalProps {
  isOpen: boolean;
  onAccept: () => void;
  onClose: () => void;
}

export default function TermsAcceptanceModal({
  isOpen,
  onAccept,
  onClose,
}: TermsAcceptanceModalProps) {
  const [isChecked, setIsChecked] = useState(false);

  if (!isOpen) return null;

  const handleAccept = () => {
    if (isChecked) {
      onAccept();
    } else {
      alert('Please check the box to continue');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="bg-purple-600 text-white p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold">Welcome to MANNOSAAR</h2>
          <button
            onClick={onClose}
            className="hover:bg-purple-700 p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          <p className="text-gray-700">
            Before you start using MANNOSAAR, please review and accept our policies:
          </p>

          {/* Checkbox */}
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)}
                className="mt-1 w-4 h-4 text-purple-600 rounded focus:ring-2 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-700">
                I agree to the{' '}
                <Link
                  href="/terms"
                  target="_blank"
                  className="text-purple-600 hover:text-purple-700 font-semibold underline"
                >
                  Terms & Conditions
                </Link>
                {' '}and{' '}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="text-purple-600 hover:text-purple-700 font-semibold underline"
                >
                  Privacy Policy
                </Link>
              </span>
            </label>

            <p className="text-xs text-gray-600 pl-7">
              ✓ You must check this box to continue using MANNOSAAR
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleAccept}
              disabled={!isChecked}
              className={`flex-1 px-4 py-2 rounded-lg transition-colors font-medium text-white ${
                isChecked
                  ? 'bg-purple-600 hover:bg-purple-700 cursor-pointer'
                  : 'bg-gray-300 cursor-not-allowed'
              }`}
            >
              I Agree & Continue
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <div className="bg-gray-50 p-4 border-t text-xs text-gray-600 text-center">
          This is a legal requirement. You must accept to use MANNOSAAR.
        </div>
      </div>
    </div>
  );
}
