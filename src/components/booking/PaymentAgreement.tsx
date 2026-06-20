'use client';

import Link from 'next/link';

interface PaymentAgreementProps {
  isChecked: boolean;
  onCheck: (checked: boolean) => void;
}

export default function PaymentAgreement({ isChecked, onCheck }: PaymentAgreementProps) {
  return (
    <div className="my-6 rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-semibold text-gray-900">
        Payment & Refund Agreement
      </h3>
      <p className="mt-2 text-sm leading-6 text-gray-600">
        By continuing, you confirm that you understand our payment, refund, and cancellation terms.
      </p>

      <ul className="mt-4 space-y-3 text-sm leading-6 text-gray-700">
        <li>Payment will be processed securely through PayU.</li>
        <li>
          I understand the{' '}
          <Link
            href="/refund-policy"
            target="_blank"
            className="font-medium text-purple-600 underline hover:text-purple-700"
          >
            Refund Policy
          </Link>
          {' '}and cancellation terms.
        </li>
        <li>
          I agree to the{' '}
          <Link
            href="/terms"
            target="_blank"
            className="font-medium text-purple-600 underline hover:text-purple-700"
          >
            Terms & Conditions
          </Link>
          .
        </li>
        <li>Full refund for cancellations 24+ hours before. No refund within 24 hours or for no-shows.</li>
      </ul>

      <label
        className={`mt-5 flex items-start gap-3 rounded-xl border p-4 transition-colors ${
          isChecked
            ? 'border-purple-400 bg-purple-50'
            : 'cursor-pointer border-gray-200 bg-white hover:border-purple-300'
        }`}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={(e) => onCheck(e.target.checked)}
          className="mt-1 h-5 w-5 cursor-pointer rounded text-purple-600 focus:ring-2 focus:ring-purple-500"
        />
        <span className="text-sm font-medium leading-6 text-gray-900">
          I agree to all payment terms, refund policy, and service conditions.
        </span>
      </label>
    </div>
  );
}
