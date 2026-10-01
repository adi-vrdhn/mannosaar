'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CalendarDays, Check, CheckCircle2,
  LockKeyhole, MessageSquareText, ShieldCheck,
} from 'lucide-react';
import {
  DEFAULT_BUNDLE_PRICING, formatInr, isServiceId,
  type BundlePricing,
} from '@/lib/services';

function AppointmentNotePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const requestedType = searchParams.get('type');
  const sessionType = isServiceId(requestedType) ? requestedType : 'personal';

  const [isReady, setIsReady] = useState(false);
  const [loadingPrices, setLoadingPrices] = useState(true);
  const [pricing, setPricing] = useState<BundlePricing>({ ...DEFAULT_BUNDLE_PRICING });
  const [note, setNote] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [bundleSize, setBundleSize] = useState<1 | 2 | 3>(1);
  const [bundleSchedule, setBundleSchedule] = useState<'all' | 'progressive'>('all');

  useEffect(() => {
    const fetchPricing = async () => {
      try {
        const response = await fetch('/api/admin/pricing');
        if (response.ok) setPricing((await response.json()).pricing);
      } catch (error) {
        console.error('Error fetching pricing:', error);
      } finally {
        setLoadingPrices(false);
      }
    };
    fetchPricing();
  }, []);

  useEffect(() => {
    const storedNote = window.sessionStorage.getItem('appointmentNote') || '';
    const storedBundleSize = window.sessionStorage.getItem('appointmentBundleSize');
    const storedBundleSchedule = window.sessionStorage.getItem('appointmentBundleSchedule');
    if (storedNote) setNote(storedNote);
    if (storedBundleSize === '2' || storedBundleSize === '3') setBundleSize(Number(storedBundleSize) as 2 | 3);
    if (storedBundleSchedule === 'progressive') setBundleSchedule('progressive');
  }, []);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session) router.push('/auth/login');
    else setIsReady(true);
  }, [session, status, router]);

  const getPriceForBundle = (bundle: number) => pricing[`${sessionType}_${bundle}` as keyof BundlePricing] || 0;

  const handleContinue = () => {
    if (!ageConfirmed) return;
    const trimmedNote = note.trim();
    if (trimmedNote) window.sessionStorage.setItem('appointmentNote', trimmedNote);
    else window.sessionStorage.removeItem('appointmentNote');
    window.sessionStorage.setItem('appointmentSessionType', sessionType);
    window.sessionStorage.setItem('appointmentBundleSize', String(bundleSize));
    window.sessionStorage.setItem('appointmentBundleSchedule', bundleSize > 1 ? bundleSchedule : 'all');
    const params = new URLSearchParams({
      type: sessionType,
      bundle: String(bundleSize),
      schedule: bundleSize > 1 ? bundleSchedule : 'all',
    });
    router.push(`/appointment/slots?${params.toString()}`);
  };

  if (status === 'loading' || !isReady) return <AppointmentNoteLoadingFallback />;

  return (
    <main className="appointment-pinterest min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="appointment-orb appointment-orb-left" aria-hidden="true" />
        <div className="appointment-orb appointment-orb-right" aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-9 flex items-center justify-between gap-4">
            <Link href="/appointment/type" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#4c4052] transition hover:text-[#5b267a]">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Session type
            </Link>
            <div className="flex items-center gap-2" aria-label="Booking progress: step 2 of 3">
              <span className="h-1.5 w-4 rounded-full bg-white/65" />
              <span className="h-1.5 w-9 rounded-full bg-[#5b267a]" />
              <span className="h-1.5 w-4 rounded-full bg-white/45" />
              <span className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-[#4c4052]">2 of 3</span>
            </div>
          </div>

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.42 }} className="mb-9 max-w-3xl">
            <h1 className="font-playfair text-[clamp(2.45rem,6vw,4.85rem)] font-medium leading-[0.98] tracking-[-0.04em] text-[#34213f]">
              A little context, <span className="italic text-[#5b267a]">if you’d like.</span>
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#4c4052] sm:text-lg">
              Choose how many sessions you want, then leave a short note only if it would help your therapist prepare.
            </p>
          </motion.header>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }} className="grid items-start gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(330px,0.85fr)] lg:gap-8">
            <section className="appointment-note-card relative overflow-hidden p-6 sm:p-8" aria-labelledby="note-heading">
              <span className="appointment-tape" aria-hidden="true" />
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#eadff1] text-[#5b267a]"><MessageSquareText className="h-5 w-5" /></span>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">Completely optional</p>
                  <h2 id="note-heading" className="font-playfair mt-1 text-2xl font-medium text-[#34213f] sm:text-3xl">What brings you here?</h2>
                </div>
              </div>

              <div className="mt-7">
                <div className="mb-3 flex items-center justify-between gap-4">
                  <label htmlFor="appointment-note" className="text-sm font-semibold text-[#4c4052]">A short note for your therapist</label>
                  <span className="text-xs font-semibold text-[#6f6275]">{note.length}/500</span>
                </div>
                <textarea
                  id="appointment-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={8}
                  maxLength={500}
                  placeholder="For example: I’ve been feeling overwhelmed lately and would like help finding a way forward…"
                  className="appointment-textarea min-h-[240px] w-full resize-none rounded-[1.35rem] px-5 py-5 text-base leading-7 text-[#34213f] outline-none placeholder:text-[#83758a]"
                />
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-2xl bg-[#eadff1]/70 px-4 py-4 text-sm leading-6 text-[#4c4052]">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-[#5b267a]" />
                <p>Keep it general—please don’t include detailed medical or crisis information here.</p>
              </div>
            </section>

            <aside className="appointment-summary-card p-5 sm:p-6" aria-labelledby="bundle-heading">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">Your booking</p>
                  <h2 id="bundle-heading" className="font-playfair mt-1 text-2xl font-medium text-[#34213f]">Choose a bundle</h2>
                </div>
                <CalendarDays className="h-6 w-6 text-[#5b267a]" strokeWidth={1.7} />
              </div>

              <div className="mt-5 grid gap-2.5">
                {([1, 2, 3] as const).map((size) => {
                  const active = bundleSize === size;
                  return (
                    <button key={size} type="button" onClick={() => setBundleSize(size)} aria-pressed={active} className={`group flex min-h-[76px] w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3.5 text-left transition ${active ? 'border-[#5b267a] bg-[#5b267a] text-white shadow-[0_10px_24px_rgba(91,38,122,0.2)]' : 'border-[#8a7099]/25 bg-white/30 text-[#34213f] hover:border-[#5b267a]/50 hover:bg-white/50'}`}>
                      <span className="flex items-center gap-3">
                        <span className={`flex h-5 w-5 items-center justify-center rounded-full border ${active ? 'border-white/60 bg-white text-[#5b267a]' : 'border-[#80698f]/50 text-transparent'}`}><Check className="h-3 w-3" strokeWidth={3} /></span>
                        <span>
                          <span className="block text-base font-bold">{size} session{size > 1 ? 's' : ''}</span>
                          <span className={`mt-0.5 block text-xs ${active ? 'text-white/75' : 'text-[#65586c]'}`}>{size === 1 ? 'A place to begin' : size === 2 ? 'A little continuity' : 'Steady support'}</span>
                        </span>
                      </span>
                      <span className="text-base font-bold">{loadingPrices ? '—' : formatInr(getPriceForBundle(size))}</span>
                    </button>
                  );
                })}
              </div>

              {bundleSize > 1 && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mt-5 border-t border-dashed border-[#80698f]/25 pt-5">
                  <p className="text-sm font-bold text-[#34213f]">When would you like to choose dates?</p>
                  <div className="mt-3 grid gap-2">
                    {[
                      { id: 'all', title: 'Choose all dates now', copy: 'Reserve every session before payment.' },
                      { id: 'progressive', title: 'One date at a time', copy: 'Book the next after each completed session.' },
                    ].map((option) => {
                      const active = bundleSchedule === option.id;
                      return (
                        <button key={option.id} type="button" onClick={() => setBundleSchedule(option.id as 'all' | 'progressive')} aria-pressed={active} className={`rounded-xl border p-3 text-left transition ${active ? 'border-[#5b267a]/55 bg-[#eadff1]' : 'border-transparent bg-white/25 hover:border-[#80698f]/25'}`}>
                          <span className="flex items-start gap-2.5">
                            <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${active ? 'text-[#5b267a]' : 'text-[#8d7a96]'}`} />
                            <span><span className="block text-sm font-bold text-[#34213f]">{option.title}</span><span className="mt-0.5 block text-xs leading-5 text-[#65586c]">{option.copy}</span></span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  <p className="mt-3 text-xs leading-5 text-[#65586c]">The full bundle is paid upfront in either option.</p>
                </motion.div>
              )}

              <label className="mt-5 flex cursor-pointer items-center gap-3 px-1 text-sm font-semibold text-[#34213f]">
                <input
                  type="checkbox"
                  checked={ageConfirmed}
                  onChange={(event) => setAgeConfirmed(event.target.checked)}
                  className="h-5 w-5 shrink-0 cursor-pointer rounded border-[#80698f]/50 accent-[#5b267a]"
                />
                I confirm that I am 18 years of age or older.
              </label>

              <button type="button" onClick={handleContinue} disabled={!ageConfirmed} className="group mt-5 flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white shadow-[0_10px_24px_rgba(91,38,122,0.2)] transition hover:bg-[#472061] disabled:cursor-not-allowed disabled:bg-[#8f8096] disabled:shadow-none">
                Continue to times <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              <p className="mt-4 flex items-center justify-center gap-2 text-center text-xs font-medium text-[#5d5064]"><ShieldCheck className="h-3.5 w-3.5 text-[#5b267a]" /> You’ll review everything before payment</p>
            </aside>
          </motion.div>
        </div>
      </div>
    </main>
  );
}

function AppointmentNoteLoadingFallback() {
  return (
    <div className="appointment-pinterest flex min-h-[70vh] items-center justify-center">
      <div className="flex items-center gap-3 text-sm font-medium text-[#4c4052]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#5b267a]/25 border-t-[#5b267a]" /> Preparing your booking…
      </div>
    </div>
  );
}

export default function AppointmentNotePage() {
  return <Suspense fallback={<AppointmentNoteLoadingFallback />}><AppointmentNotePageContent /></Suspense>;
}
