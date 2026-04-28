'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import TherapistHeader from '@/components/booking/TherapistHeader';

interface BundlePricing {
  personal_1: number;
  personal_2: number;
  personal_3: number;
  couple_1: number;
  couple_2: number;
  couple_3: number;
}

export default function AppointmentNotePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const sessionType = (searchParams.get('type') || 'personal') as 'personal' | 'couple';

  const [isReady, setIsReady] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [pricing, setPricing] = useState<BundlePricing>({
    personal_1: 2500,
    personal_2: 4500,
    personal_3: 6000,
    couple_1: 3500,
    couple_2: 6500,
    couple_3: 9000,
  });
  const [note, setNote] = useState('');
  const [bundleSize, setBundleSize] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) {
          const data = await response.json();
          setPricing(data.pricing);
        }
      } catch (err) {
        console.error('Error fetching pricing:', err);
      } finally {
        setLoadingPrices(false);
      }
    };

    fetchPricing();
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const storedNote = window.sessionStorage.getItem('appointmentNote') || '';
    const storedBundleSize = window.sessionStorage.getItem('appointmentBundleSize');

    if (storedNote) {
      setNote(storedNote);
    }

    if (storedBundleSize === '2' || storedBundleSize === '3') {
      setBundleSize(Number(storedBundleSize) as 2 | 3);
    }
  }, []);

  useEffect(() => {
    if (status === 'loading') return;

    if (!session) {
      router.push('/auth/login');
    } else {
      setIsReady(true);
    }
  }, [session, status, router]);

  const getPriceForBundle = (type: string, bundle: number) => {
    const key = `${type}_${bundle}`;
    return pricing[key as keyof BundlePricing] || 0;
  };

  const handleContinue = () => {
    const trimmedNote = note.trim();

    if (!trimmedNote) {
      alert('Please tell your problem in brief before continuing.');
      return;
    }

    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem('appointmentNote', trimmedNote);
      window.sessionStorage.setItem('appointmentSessionType', sessionType);
      window.sessionStorage.setItem('appointmentBundleSize', String(bundleSize));
    }

    const params = new URLSearchParams({
      type: sessionType,
      bundle: String(bundleSize),
    });

    router.push(`/appointment/slots?${params.toString()}`);
  };

  const cardBase =
    'relative rounded-2xl p-6 cursor-pointer border-2 transition-all shadow-lg bg-white';

  if (status === 'loading' || !isReady) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white pt-24 pb-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <TherapistHeader languages={['Hindi', 'English']} />

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-xl border border-purple-100 p-6 sm:p-10"
        >
          <div className="text-center mb-10">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-purple-600 mb-3">
              Step 2
            </p>
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Please tell your problem in brief
            </h1>
            <p className="text-gray-600 max-w-2xl mx-auto">
              A short note helps us understand your situation before the session.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1.3fr_0.9fr] gap-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                Your note
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={10}
                maxLength={1000}
                placeholder="Write a few lines about what you would like support with..."
                className="w-full rounded-2xl border border-gray-300 px-4 py-4 text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
              />
              <div className="flex items-center justify-between mt-2 text-sm text-gray-500">
                <span>Keep it brief and comfortable for you.</span>
                <span>{note.length}/1000</span>
              </div>

              <div className="mt-6">
                <button
                  onClick={handleContinue}
                  className="w-full sm:w-auto px-6 py-3 rounded-xl font-semibold text-white bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-lg transition-all"
                >
                  Continue to Slots
                </button>
              </div>
            </div>

            <div>
              <div className="mb-4">
                <h2 className="text-lg font-bold text-gray-900 mb-2">Choose bundle size</h2>
                <p className="text-sm text-gray-600">
                  Pick how many sessions you want to book for your {sessionType} therapy.
                </p>
              </div>

              <div className="space-y-4">
                {[1, 2, 3].map((size) => {
                  const active = bundleSize === size;
                  return (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setBundleSize(size as 1 | 2 | 3)}
                      className={`${cardBase} text-left ${
                        active
                          ? 'border-purple-500 ring-2 ring-purple-200'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-gray-500">Bundle</p>
                          <p className="text-2xl font-bold text-gray-900">{size} Session{size > 1 ? 's' : ''}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500 mb-1">Price</p>
                          <p className="text-xl font-bold text-purple-600">
                            ₹{loadingPrices ? '...' : getPriceForBundle(sessionType, size)}
                          </p>
                        </div>
                      </div>
                      <p className="mt-3 text-sm text-gray-600">
                        {size === 1
                          ? 'One session to get started'
                          : `${size} sessions for consistent support`}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
