'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, ExternalLink, ChevronRight, ChevronDown } from 'lucide-react';
import Link from 'next/link';

export default function AboutPage() {
  const [expandedExp, setExpandedExp] = useState<number | null>(null);

  // Experience data with detailed descriptions
  const experiences = [
    {
      role: 'Online Psychotherapist',
      organization: 'TalktoAngel',
      period: '2020 – Present',
      details: [
        'Delivered 500+ online psychotherapy sessions across domains including relationships, anxiety, OCD, workplace stress, and career challenges.',
        'Achieved an average 4.8/5 client rating and maintained 100% client satisfaction through personalized therapy and progress tracking.',
        'Supported employees through EAP programs, reducing stress and enhancing productivity.',
        'Helped professionals improve work–life balance and career focus, while guiding students toward better academic outcomes.',
      ],
    },
    {
      role: 'Psychologist & Counsellor',
      organization: 'Army Public School, Jodhpur',
      period: '2022 – 2023',
      details: [
        'Provided counselling for 300+ students on academic, behavioural, and emotional issues.',
        'Conducted workshops for 100+ teachers on teaching psychology and student engagement.',
        'Trained 800+ parents on evolving parenting practices in modern socio-cultural settings.',
        'Launched anti-bullying campaign → 30% reduction in student conflicts.',
        'Introduced early intervention program → 20% improvement in senior students\' results.',
      ],
    },
    {
      role: 'Psychologist & Counsellor',
      organization: 'Astha Cell',
      period: '2022 – 2024',
      details: [
        'Provided comprehensive psychological support to  personnel and their families.',
        'Conducted stress management and resilience training for 200+ personnel.',
        'Facilitated group therapy sessions for PTSD and combat-related stress.',
        'Implemented mental health awareness programs across the unit.',
      ],
    },
    {
      role: 'Psychologist & Counsellor',
      organization: 'Army Public School, Shillong',
      period: '2019 – 2020',
      details: [
        'Guided 300+ students in counselling sessions on various developmental and academic issues.',
        'Conducted workshops for 300 teachers and awareness sessions for 800+ parents.',
        'Reduced conflicts among students by 30%; improved academic outcomes by 20%.',
      ],
    },
    {
      role: 'Psychologist & Counsellor',
      organization: 'Astha Cell ',
      period: '2019 – 2020',
      details: [
        'Provided part-time psychological support while pursuing academic commitments.',
        'Conducted mental health workshops and awareness sessions for families.',
        'Offered individual and group counselling for stress management.',
      ],
    },
    {
      role: 'Counsellor',
      organization: 'Kendriya Vidyalaya, Allahabad',
      period: '2017 – 2018',
      details: [
        'Counselled 600+ students individually and in groups.',
        'Conducted teacher training sessions (300+) and parent workshops (1000+).',
        'Delivered anti-bullying campaign → 20% conflict reduction.',
        'Early academic interventions → 30% result improvement.',
      ],
    },
    {
      role: 'Psychologist and Family Therapist',
      organization: 'NGO',
      period: '2001 – 2016',
      details: [
        'Conducted career counselling for 4000+ students (life skills, aptitude, career development).',
        'Delivered parent training to 4000 parents in marital harmony, health, and grooming.',
        'Led workshops/lectures for 5000+ participants on personality building and conflict resolution.',
      ],
    },
    {
      role: 'Lecturer in Psychology',
      organization: 'Govt. Girls College, Jhunjhunu (Rajasthan)',
      period: '1999 – 2000',
      details: [
        'Taught psychology courses to undergraduate students.',
        'Anti-bullying initiative → 40% student conflict reduction.',
        'Mentoring program → 25% improvement in student results.',
      ],
    },
  ];

  // Area of expertise
  const expertise = [
    'Addiction',
    'ADHD',
    'Anger',
    'Anxiety',
    'Autism',
    'Bipolar Disorder',
    'Bullying',
    'Child & Adolescent',
    'Depression',
    'Developmental Delay',
    'Grief and Loss',
    'OCD',
    'Personality Disorder',
    'Phobia',
    'Physical Health',
    'Post Traumatic Stress Disorder (PTSD)',
    'Relationship',
    'Self Improvement',
    'Sensory Processing Disorder',
    'Sexual Dysfunction',
    'Sleep',
    'Stress',
    'Workplace',
  ];

  // Certifications
  const certifications = [
    'M.A Psychology (Gold Medalist) – Rajasthan University',
    'PG Diploma in Career Counselling & Guidance – Enoma Institute, Mumbai',
    'PG Diploma in Family Therapy & Counselling – IGNOU',
    'Certification – Psychometric Analyser (Careeguide.com)',
    'Certification – Emotional Freedom Technique (EFT)',
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 },
    },
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-purple-50/30 to-purple-50/20">
      {/* Navigation Spacing */}
      <div className="pt-24" />

      {/* Hero Section */}
      <motion.section
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="px-4 sm:px-6 lg:px-8 mb-20"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 lg:gap-16 items-center">
            {/* Left: Profile Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <div className="w-full max-w-lg aspect-[3/4] bg-gradient-to-br from-purple-200 to-purple-300 rounded-3xl shadow-2xl flex items-center justify-center overflow-hidden">
                <img
                  src="/images/profile-picture.jpeg"
                  alt="Neetu Rathore"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Social Icons */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex gap-6 mt-8"
              >
                <motion.a
                  href="https://www.linkedin.com/in/neeturathore9/"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="p-3 rounded-full bg-purple-100 hover:bg-blue-100 text-purple-600 hover:text-blue-600 transition-all flex items-center justify-center"
                  title="LinkedIn"
                >
                  <span className="text-2xl font-bold">in</span>
                </motion.a>
                <motion.a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1 }}
                  className="p-3 rounded-full bg-purple-100 hover:bg-pink-100 text-purple-600 hover:text-pink-600 transition-all flex items-center justify-center"
                  title="Instagram"
                >
                  <span className="text-2xl font-bold">📷</span>
                </motion.a>
                <motion.a
                  href="mailto:contact@neeturathore.com"
                  whileHover={{ scale: 1.1 }}
                  className="p-3 rounded-full bg-purple-100 hover:bg-red-100 text-purple-600 hover:text-red-600 transition-all"
                  title="Email"
                >
                  <Mail size={24} />
                </motion.a>
              </motion.div>
            </motion.div>

            {/* Right: Content */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="space-y-6"
            >
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-4">
                  Neetu Rathore
                </h1>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Dynamic Psychologist, Family Therapist, and Career Counsellor with 24+ years of experience in
                  psychotherapy, relationship counselling, career mentoring, and employee assistance programs (EAP).
                  Delivered 10,000+ counselling sessions across academic, corporate, and family contexts. Recognized for
                  achieving measurable results in conflict reduction, stress management, productivity improvement, and
                  academic performance gains. Gold Medalist in Psychology with proven expertise in designing workshops,
                  implementing early intervention programs, and leading community well-being initiatives.
                </p>
              </div>

              {/* Stats */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="grid grid-cols-3 gap-4 pt-6 border-t border-purple-200"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    24+
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Years Experience</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    10K+
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total sessions</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                    4.9
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Rating</p>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Experience Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="px-4 sm:px-6 lg:px-8 py-20 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center"
          >
            Experience
          </motion.h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
            {experiences.map((exp, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="rounded-2xl bg-gradient-to-br from-purple-50 to-white border border-purple-200 hover:border-purple-400 hover:shadow-lg transition-all cursor-pointer overflow-hidden"
                onClick={() => setExpandedExp(expandedExp === index ? null : index)}
              >
                <div className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="p-3 rounded-full bg-gradient-to-br from-purple-500 to-purple-600 text-white flex-shrink-0">
                      <ChevronRight size={20} />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">{exp.role}</h3>
                      <p className="text-purple-600 font-semibold mt-1">{exp.organization}</p>
                      <p className="text-sm text-gray-500 mt-2">{exp.period}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: expandedExp === index ? 180 : 0 }}
                      transition={{ duration: 0.3 }}
                      className="flex-shrink-0"
                    >
                      <ChevronDown size={20} className="text-purple-600" />
                    </motion.div>
                  </div>

                  {/* Expandable Details */}
                  <AnimatePresence>
                    {expandedExp === index && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.3 }}
                        className="mt-6 pt-6 border-t border-purple-200"
                      >
                        <div className="space-y-4">
                          {exp.details.map((detail, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: idx * 0.05 }}
                              className="flex gap-3 text-sm text-gray-700 leading-relaxed"
                            >
                              <span className="text-purple-500 font-bold flex-shrink-0 mt-1">●</span>
                              <span>{detail}</span>
                            </motion.div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Area of Expertise Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="max-w-7xl mx-auto">
          <motion.h2
            variants={itemVariants}
            className="text-4xl md:text-5xl font-bold text-gray-900 mb-12 text-center"
          >
            Area of Expertise
          </motion.h2>

          <motion.div
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
            variants={containerVariants}
          >
            {expertise.map((skill, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ scale: 1.05, y: -5 }}
                className="px-4 py-3 rounded-full bg-gradient-to-r from-purple-500/10 to-purple-400/10 border border-purple-200 hover:border-purple-400 text-center cursor-pointer transition-all group"
              >
                <p className="text-sm font-semibold text-gray-700 group-hover:text-purple-600 transition-colors">
                  {skill}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* Languages & Certifications Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-100px' }}
        variants={containerVariants}
        className="px-4 sm:px-6 lg:px-8 py-20 bg-white/50 backdrop-blur-sm"
      >
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
            {/* Languages */}
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Languages</h3>
              <div className="space-y-4">
                {['Hindi', 'English'].map((lang, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 10 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white border border-purple-200 hover:border-purple-400 cursor-pointer transition-all"
                  >
                    <p className="text-lg font-semibold text-gray-900">{lang}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Certifications */}
            <motion.div variants={itemVariants}>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-8">Certifications</h3>
              <div className="space-y-4">
                {certifications.map((cert, index) => (
                  <motion.div
                    key={index}
                    whileHover={{ x: 10 }}
                    className="p-4 rounded-xl bg-gradient-to-r from-purple-50 to-white border border-purple-200 hover:border-purple-400 cursor-pointer transition-all"
                  >
                    <p className="text-sm font-semibold text-gray-900 leading-relaxed">{cert}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* CTA Section */}
      <motion.section
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="px-4 sm:px-6 lg:px-8 py-20"
      >
        <div className="max-w-4xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-purple-600 to-purple-500 p-12 md:p-20 text-center shadow-2xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Ready to Start Your Journey?</h2>
              <p className="text-lg text-purple-100 mb-8">
                Take the first step towards better mental health and personal growth. Book a session with me today.
              </p>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Link
                  href="/appointment/type"
                  className="inline-block px-10 py-4 bg-white text-purple-600 font-bold rounded-full hover:shadow-2xl transition-all"
                >
                  Book a Session Now
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* Spacing */}
      <div className="pb-12" />
    </div>
  );
}
