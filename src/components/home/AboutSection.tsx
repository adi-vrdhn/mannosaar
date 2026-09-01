'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';

const expertiseAreas = [
  'Addiction', 'ADHD', 'Anger', 'Anxiety', 'Autism', 'Bipolar Disorder',
  'Bullying', 'Child & Adolescent', 'Depression', 'Developmental Delay',
  'Grief and Loss', 'OCD', 'Personality Disorder', 'Phobia', 'Physical Health',
  'Post Traumatic Stress Disorder (PTSD)', 'Relationship', 'Self Improvement',
  'Sensory Processing Disorder', 'Sexual Dysfunction', 'Sleep', 'Stress', 'Workplace',
];

const AboutSection = () => {
  const [showAllExpertise, setShowAllExpertise] = useState(false);
  const visibleAreas = showAllExpertise ? expertiseAreas : expertiseAreas.slice(0, 9);
  const hiddenCount = expertiseAreas.length - 9;

  return (
    <section id="about" className="bg-[#cbb7df] px-3 py-16 sm:px-5 sm:py-24 lg:px-8">
      <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.15 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }} className="mx-auto max-w-[1536px] border border-white/70 bg-white/55 px-7 py-9 shadow-[0_14px_32px_rgba(68,42,87,0.1)] backdrop-blur-sm sm:px-10 sm:py-11 lg:px-14 lg:py-14">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Meet your therapist</p>
            <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight tracking-[-0.035em] text-[#34213f] sm:text-4xl">A supportive place to begin.</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-[#4c4052]">Therapy is a space to understand what is happening, find steadier ground, and make changes that feel possible.</p>
        </div>

        <div className="mt-9 grid border-t border-[#6f4b88]/20 pt-8 lg:grid-cols-[0.67fr_1.33fr] lg:gap-12">
          <div className="border-b border-[#6f4b88]/20 pb-8 lg:border-b-0 lg:border-r lg:pr-12">
            <p className="font-playfair text-3xl font-bold text-[#34213f]">Neetu Rathore</p>
            <p className="mt-2 text-sm font-semibold text-[#5b267a]">Psychologist, Family Therapist & Career Counsellor</p>
            <p className="mt-6 text-base leading-7 text-[#4c4052]">With over 24 years of clinical experience, Neetu offers practical, compassionate support for individuals, couples, families, and career transitions.</p>
            <p className="mt-6 border-l-2 border-[#7a4b95] pl-4 font-playfair text-lg font-bold leading-7 text-[#493153]">“A thoughtful conversation can be the beginning of meaningful change.”</p>
            <Link href="/about" className="mt-7 inline-flex items-center gap-2 text-sm font-bold text-[#5b267a] underline decoration-[#5b267a]/35 underline-offset-4 transition hover:text-[#3f165b]">
              Learn about Neetu <ArrowRight size={16} />
            </Link>
          </div>

          <div className="pt-8 lg:pt-0">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Areas of expertise</p>
                <h3 className="mt-2 text-xl font-bold text-[#34213f]">Support for the concerns that matter to you.</h3>
              </div>
              <span className="text-xs font-semibold text-[#6f4b88]">{expertiseAreas.length} focus areas</span>
            </div>

            <motion.div layout className="mt-5 grid gap-x-6 sm:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence initial={false}>
                {visibleAreas.map((area) => (
                  <motion.span key={area} layout initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }} className="inline-flex items-center gap-2 border-b border-[#6f4b88]/15 py-2.5 text-sm font-medium text-[#4a3159]">
                    <Check size={14} className="shrink-0 text-[#6b3290]" strokeWidth={2.5} /> {area}
                  </motion.span>
                ))}
              </AnimatePresence>
            </motion.div>

            <button type="button" onClick={() => setShowAllExpertise((current) => !current)} aria-expanded={showAllExpertise} className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#5b267a] underline decoration-[#5b267a]/35 underline-offset-4 transition hover:text-[#3f165b]">
              {showAllExpertise ? 'Show fewer areas' : `See ${hiddenCount} more areas`}
              <ChevronDown size={17} className={`transition-transform ${showAllExpertise ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>
      </motion.div>
    </section>
  );
};

export default AboutSection;
