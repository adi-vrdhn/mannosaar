'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, Check, Clock3, HeartHandshake, Languages,
  UserRound, UsersRound,
} from 'lucide-react';
import {
  BOOKABLE_SERVICES, DEFAULT_BUNDLE_PRICING, formatInr,
  type BundlePricing, type ServiceId,
} from '@/lib/services';

const serviceDetails = {
  personal: {
    eyebrow: 'A space for you',
    note: 'For thoughts, patterns, transitions, stress, or anything that feels heavy right now.',
    features: ['One-to-one support', 'Private online setting'],
    icon: UserRound,
    tone: 'soft',
  },
  couple: {
    eyebrow: 'A space for two',
    note: 'For communication, conflict, reconnection, or navigating change together.',
    features: ['Shared support', 'Relationship-focused'],
    icon: UsersRound,
    tone: 'deep',
  },
} as const;

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.09 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.42 } },
};

export default function AppointmentTypePage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isReady, setIsReady] = useState(false);
  const [pricing, setPricing] = useState<BundlePricing>({ ...DEFAULT_BUNDLE_PRICING });
  const [loadingPrices, setLoadingPrices] = useState(true);

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
    if (status === 'loading') return;
    if (!session) router.push('/auth/login');
    else setIsReady(true);
  }, [session, status, router]);

  const handleSelectType = (type: ServiceId) => router.push(`/appointment/note?type=${type}`);

  if (status === 'loading' || !isReady) {
    return (
      <div className="appointment-pinterest flex min-h-[70vh] items-center justify-center">
        <div className="flex items-center gap-3 text-sm font-medium text-[#4c4052]">
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-[#5b267a]/25 border-t-[#5b267a]" />
          Preparing your booking…
        </div>
      </div>
    );
  }

  return (
    <main className="appointment-pinterest min-h-screen overflow-hidden px-4 py-8 sm:px-6 sm:py-12 lg:px-8">
      <div className="relative mx-auto max-w-6xl">
        <div className="appointment-orb appointment-orb-left" aria-hidden="true" />
        <div className="appointment-orb appointment-orb-right" aria-hidden="true" />

        <div className="relative z-10">
          <div className="mb-9 flex items-center justify-between gap-4">
            <Link href="/" className="group inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#4c4052] transition hover:text-[#5b267a]">
              <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" /> Back home
            </Link>
            <div className="flex items-center gap-2" aria-label="Booking progress: step 1 of 3">
              <span className="h-1.5 w-9 rounded-full bg-[#5b267a]" />
              <span className="h-1.5 w-4 rounded-full bg-white/45" />
              <span className="h-1.5 w-4 rounded-full bg-white/45" />
              <span className="ml-1 text-xs font-bold uppercase tracking-[0.18em] text-[#4c4052]">1 of 3</span>
            </div>
          </div>

          <motion.header initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }} className="mx-auto mb-10 max-w-3xl text-center sm:mb-14">
            <h1 className="font-playfair text-[clamp(2.55rem,7vw,5.6rem)] font-medium leading-[0.96] tracking-[-0.045em] text-[#34213f]">
              What kind of support <span className="block italic text-[#5b267a]">feels right?</span>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-7 text-[#4c4052] sm:text-lg">
              Choose the session that fits this moment. You can review every detail before confirming.
            </p>
          </motion.header>

          <motion.section variants={containerVariants} initial="hidden" animate="visible" className="mx-auto grid max-w-5xl gap-6 md:grid-cols-2 md:gap-8" aria-label="Session types">
            {BOOKABLE_SERVICES.map((service) => {
              const details = serviceDetails[service.id];
              const Icon = details.icon;
              const price = pricing[`${service.id}_1`];
              return (
                <motion.article key={service.id} variants={itemVariants} className="appointment-pin-card group relative">
                  <span className={`appointment-pin appointment-pin-${details.tone}`} aria-hidden="true" />
                  <button type="button" onClick={() => handleSelectType(service.id)} className="flex h-full w-full flex-col p-6 text-left sm:p-8" aria-label={`Choose ${service.name}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className={`flex h-14 w-14 items-center justify-center rounded-[1.1rem] ${details.tone === 'soft' ? 'bg-[#eadff1] text-[#5b267a]' : 'bg-[#5b267a] text-white'}`}>
                        <Icon className="h-6 w-6" strokeWidth={1.7} />
                      </div>
                      <div className="text-right">
                        <p className="text-[0.7rem] font-bold uppercase tracking-[0.16em] text-[#6f6275]">from</p>
                        <p className="mt-1 text-xl font-bold text-[#34213f]">{loadingPrices ? '—' : formatInr(price)}</p>
                      </div>
                    </div>
                    <div className="mt-8">
                      <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#5b267a]">{details.eyebrow}</p>
                      <h2 className="font-playfair mt-2 text-3xl font-medium tracking-[-0.02em] text-[#34213f] sm:text-[2.15rem]">{service.name}</h2>
                      <p className="mt-4 min-h-[5.25rem] text-base leading-7 text-[#4c4052]">{details.note}</p>
                    </div>
                    <div className="mt-7 border-y border-dashed border-[#80698f]/25 py-5">
                      <ul className="grid gap-3 text-sm font-medium text-[#4c4052] sm:grid-cols-2">
                        {[...details.features, `${service.durationMinutes} minutes`].map((feature) => (
                          <li key={feature} className="flex items-center gap-2">
                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#eadff1] text-[#5b267a]"><Check className="h-3 w-3" strokeWidth={2.5} /></span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-6">
                      <span className="font-semibold text-[#34213f]">Choose this session</span>
                      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[#5b267a] text-white shadow-[0_8px_18px_rgba(91,38,122,0.22)] transition-transform duration-300 group-hover:translate-x-1"><ArrowRight className="h-5 w-5" /></span>
                    </div>
                  </button>
                </motion.article>
              );
            })}
          </motion.section>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} className="mx-auto mt-10 flex max-w-3xl flex-wrap items-center justify-center gap-x-7 gap-y-3 text-sm text-[#4c4052] sm:mt-14">
            <span className="inline-flex items-center gap-2"><Clock3 className="h-4 w-4 text-[#5b267a]" /> 40-minute online sessions</span>
            <span className="inline-flex items-center gap-2"><Languages className="h-4 w-4 text-[#5b267a]" /> Hindi & English</span>
            <span className="inline-flex items-center gap-2"><HeartHandshake className="h-4 w-4 text-[#5b267a]" /> Private and supportive</span>
          </motion.div>
        </div>
      </div>
    </main>
  );
}
