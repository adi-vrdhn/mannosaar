'use client';

import Link from 'next/link';

interface PaymentAgreementProps {
  isChecked: boolean;
  onCheck: (checked: boolean) => void;
}

export default function PaymentAgreement({ isChecked, onCheck }: PaymentAgreementProps) {
  return (
    <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border-l-4 border-purple-600 rounded-lg p-6 my-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="text-purple-600 text-2xl pt-1">💳</div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            Payment & Refund Agreement
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            By proceeding with payment, you agree to our payment terms, refund policy, and service conditions:
          </p>

          <div className="bg-white rounded p-4 mb-4 border border-purple-200">
            <ul className="text-sm text-gray-700 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>Payment will be processed through Razorpay securely</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>
                  I understand the{' '}
                  <Link
                    href="/refund-policy"
                    target="_blank"
                    className="text-purple-600 font-semibold hover:text-purple-700 underline"
                  >
                    Refund Policy
                  </Link>
                  {' '}and cancellation terms
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>
                  I agree to the{' '}
                  <Link
                    href="/terms"
                    target="_blank"
                    className="text-purple-600 font-semibold hover:text-purple-700 underline"
                  >
                    Terms & Conditions
                  </Link>
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>Cancellations 24+ hours before: Full refund</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-purple-600 font-bold">✓</span>
                <span>No-show or cancellations within 24 hours: No refund</span>
              </li>
            </ul>
          </div>

          {/* Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer bg-white rounded p-3 border-2 border-purple-300 hover:border-purple-500 transition-colors">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={(e) => onCheck(e.target.checked)}
              className="mt-1 w-5 h-5 text-purple-600 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer"
            />
            <span className="text-sm font-medium text-gray-900">
              ✅ I agree to all payment terms, refund policy, and service conditions
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
