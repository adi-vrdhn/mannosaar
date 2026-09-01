import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Check, ChevronDown, Languages } from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Neetu Rathore | Mannosaar',
  description: 'Learn about Neetu Rathore, psychologist, family therapist, and career counsellor with 24+ years of clinical experience.',
};

const experiences = [
  { role: 'Online Psychotherapist', organization: 'TalktoAngel', period: '2020 - Present', details: ['Delivered 500+ online psychotherapy sessions across relationships, anxiety, OCD, workplace stress, and career challenges.', 'Supported employees through EAP programmes and helped professionals build healthier work-life balance.', 'Guided students toward stronger academic outcomes and career focus.'] },
  { role: 'Psychologist & Counsellor', organization: 'Army Public School, Jodhpur', period: '2022 - 2023', details: ['Provided counselling for 300+ students on academic, behavioural, and emotional concerns.', 'Conducted psychology and student-engagement workshops for teachers and parenting workshops for families.', 'Launched an anti-bullying campaign and early intervention programme for senior students.'] },
  { role: 'Psychologist & Counsellor', organization: 'Astha Cell', period: '2022 - 2024', details: ['Provided psychological support to personnel and their families.', 'Conducted stress-management and resilience training.', 'Facilitated group therapy for PTSD and combat-related stress.'] },
  { role: 'Psychologist & Counsellor', organization: 'Army Public School, Shillong', period: '2019 - 2020', details: ['Guided students through developmental and academic concerns.', 'Conducted teacher workshops and parent awareness sessions.', 'Supported early interventions for student wellbeing and academic outcomes.'] },
  { role: 'Psychologist & Counsellor', organization: 'Astha Cell', period: '2019 - 2020', details: ['Provided individual and group counselling for stress management.', 'Conducted mental-health workshops and family awareness sessions.'] },
  { role: 'Counsellor', organization: 'Kendriya Vidyalaya, Allahabad', period: '2017 - 2018', details: ['Counselled students individually and in groups.', 'Conducted teacher training, parent workshops, and anti-bullying initiatives.'] },
  { role: 'Psychologist and Family Therapist', organization: 'NGO', period: '2001 - 2016', details: ['Conducted career counselling for 4,000+ students.', 'Led parent training in marital harmony, health, and personal development.', 'Delivered workshops on personality building and conflict resolution.'] },
  { role: 'Lecturer in Psychology', organization: 'Govt. Girls College, Jhunjhunu', period: '1999 - 2000', details: ['Taught undergraduate psychology courses.', 'Led student mentoring and anti-bullying initiatives.'] },
];

const expertise = [
  'Addiction', 'ADHD', 'Anger', 'Anxiety', 'Autism', 'Bipolar Disorder', 'Bullying',
  'Child & Adolescent', 'Depression', 'Developmental Delay', 'Grief and Loss', 'OCD',
  'Personality Disorder', 'Phobia', 'Physical Health', 'Post Traumatic Stress Disorder (PTSD)',
  'Relationship', 'Self Improvement', 'Sensory Processing Disorder', 'Sexual Dysfunction',
  'Sleep', 'Stress', 'Workplace',
];

const certifications = [
  'M.A Psychology (Gold Medalist) - Rajasthan University',
  'PG Diploma in Career Counselling & Guidance - Enoma Institute, Mumbai',
  'PG Diploma in Family Therapy & Counselling - IGNOU',
  'Certification - Psychometric Analyser (Careeguide.com)',
  'Certification - Emotional Freedom Technique (EFT)',
];

export default function AboutPage() {
  return (
    <main className="bg-[#cbb7df] text-[#34213f]">
      <section className="px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16 lg:px-8">
        <div className="mx-auto grid max-w-[1320px] items-center gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <div className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b267a]">Meet Neetu Rathore</p>
            <h1 className="mt-4 max-w-2xl font-playfair text-4xl font-bold leading-[1.02] tracking-[-0.045em] sm:text-5xl lg:text-6xl">A thoughtful space for the parts of life that feel hard to carry alone.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[#4c4052] sm:text-lg">Neetu is a psychologist, family therapist, and career counsellor with over 24 years of clinical experience. Her work is grounded in empathy, practical tools, and the belief that meaningful change begins with being heard.</p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/appointment/type" className="inline-flex items-center justify-center gap-2 rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#481d61]">Book a session <ArrowRight size={16} /></Link>
              <a href="https://www.linkedin.com/in/neeturathore9/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-full border border-[#5b267a]/35 px-6 py-3.5 text-sm font-bold text-[#5b267a] transition hover:border-[#5b267a] hover:bg-white/25">Connect on LinkedIn</a>
            </div>
            <dl className="mt-10 grid max-w-xl grid-cols-3 border-t border-[#6f4b88]/25 pt-6">
              <div><dt className="font-playfair text-3xl font-bold text-[#5b267a]">24+</dt><dd className="mt-1 text-xs leading-5 text-[#4c4052]">Years of experience</dd></div>
              <div><dt className="font-playfair text-3xl font-bold text-[#5b267a]">10K+</dt><dd className="mt-1 text-xs leading-5 text-[#4c4052]">Counselling sessions</dd></div>
              <div><dt className="font-playfair text-3xl font-bold text-[#5b267a]">2</dt><dd className="mt-1 text-xs leading-5 text-[#4c4052]">Languages offered</dd></div>
            </dl>
          </div>

          <div className="relative order-1 mx-auto w-full max-w-md lg:order-2 lg:max-w-none">
            <div className="absolute inset-x-[8%] bottom-[5%] top-[10%] rounded-[48%_52%_44%_56%/48%_42%_58%_52%] border border-white/60" />
            <div className="absolute inset-x-[16%] bottom-0 top-[14%] rounded-[48%_52%_54%_46%/44%_54%_46%_56%] bg-white/25" />
            <Image src="/images/ChatGPT%20Image%20Sep%201%2C%202026%2C%2011_36_39%20AM.png" alt="Neetu Rathore, psychologist and therapist" width={1200} height={1200} priority className="relative z-10 mx-auto h-auto w-full max-w-[550px] object-contain" />
            <p className="absolute bottom-[8%] left-0 z-20 max-w-[180px] border-l border-[#5b267a]/55 pl-3 text-xs leading-5 text-[#4c4052]">Psychologist, family therapist, and career counsellor.</p>
          </div>
        </div>
      </section>

      <section className="border-y border-white/45 bg-white/35 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">How I work</p>
            <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight sm:text-4xl">Therapy that meets you with care and clarity.</h2>
            <p className="mt-5 text-base leading-7 text-[#4c4052]">There is no single right way to begin. Sessions are shaped around your concerns, pace, and goals, creating room to understand patterns and take practical next steps.</p>
            <p className="mt-7 border-l-2 border-[#6f4b88] pl-4 font-playfair text-xl font-bold leading-8 text-[#493153]">“A thoughtful conversation can be the beginning of meaningful change.”</p>
          </div>
          <div className="grid gap-0 border-t border-[#6f4b88]/20 sm:grid-cols-2 sm:border-l">
            {[
              ['Individual therapy', 'A confidential space to explore feelings, patterns, and change.'],
              ['Couples & family therapy', 'Support for communication, connection, and relationships.'],
              ['Career counselling', 'Clarity for decisions, transitions, and professional growth.'],
              ['Workplace wellbeing', 'Practical support for stress, resilience, and balance.'],
            ].map(([title, text]) => <div key={title} className="border-b border-r-0 border-[#6f4b88]/20 p-5 sm:border-r sm:p-7"><h3 className="font-bold text-[#34213f]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#4c4052]">{text}</p></div>)}
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Areas of expertise</p>
            <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight sm:text-4xl">Support for the concerns that matter to you.</h2>
          </div>
          <div className="mt-9 grid border-t border-[#6f4b88]/25 sm:grid-cols-2 lg:grid-cols-3">
            {expertise.map((item) => <div key={item} className="flex items-center gap-2 border-b border-[#6f4b88]/20 py-3.5 text-sm font-medium text-[#493153]"><Check size={15} className="shrink-0 text-[#6b3290]" strokeWidth={2.5} />{item}</div>)}
          </div>
        </div>
      </section>

      <section className="border-y border-white/45 bg-white/35 px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-16">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Languages</p>
            <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight sm:text-4xl">Speak in the language that feels natural.</h2>
            <div className="mt-7 flex items-center gap-3 text-base font-semibold text-[#493153]"><Languages size={21} className="text-[#5b267a]" /> Hindi and English</div>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Education & credentials</p>
            <ul className="mt-5 border-t border-[#6f4b88]/20">
              {certifications.map((cert) => <li key={cert} className="border-b border-[#6f4b88]/20 py-4 text-sm leading-6 text-[#493153]">{cert}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] border-y border-[#6f4b88]/25 py-12 text-center sm:py-16">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Begin when you are ready</p>
          <h2 className="mx-auto mt-3 max-w-2xl font-playfair text-3xl font-bold leading-tight sm:text-4xl">You do not have to have it all figured out to start a conversation.</h2>
          <Link href="/appointment/type" className="mt-7 inline-flex items-center gap-2 rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-[#481d61]">Book a session <ArrowRight size={16} /></Link>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 sm:pb-24 lg:px-8">
        <div className="mx-auto max-w-[1200px] border-t border-[#6f4b88]/25 pt-10">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Professional experience</p>
          <h2 className="mt-3 font-playfair text-3xl font-bold leading-tight sm:text-4xl">A career in care, education, and counselling.</h2>
          <div className="mt-8 border-t border-[#6f4b88]/25">
            {experiences.map((experience) => <details key={`${experience.role}-${experience.organization}-${experience.period}`} className="group border-b border-[#6f4b88]/25 py-5"><summary className="flex cursor-pointer list-none items-start justify-between gap-5 text-left marker:content-none"><span><span className="block text-base font-bold text-[#34213f]">{experience.role}</span><span className="mt-1 block text-sm font-semibold text-[#5b267a]">{experience.organization} <span className="font-normal text-[#4c4052]">| {experience.period}</span></span></span><ChevronDown size={20} className="mt-1 shrink-0 text-[#5b267a] transition-transform group-open:rotate-180" /></summary><ul className="mt-4 max-w-3xl space-y-2 border-l border-[#6f4b88]/25 pl-4 text-sm leading-6 text-[#4c4052]">{experience.details.map((detail) => <li key={detail}>{detail}</li>)}</ul></details>)}
          </div>
        </div>
      </section>
    </main>
  );
}
