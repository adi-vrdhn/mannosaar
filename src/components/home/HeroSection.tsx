'use client';

import Link from 'next/link';

const HeroSection = () => {
  const stats = [
    { number: '24+', label: 'Years Experience' },
    { number: '10K+', label: 'Total sessions' },
    { number: '4.9', label: 'Rating' },
  ];

  return (
    <section className="relative bg-purple-50" suppressHydrationWarning>
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Side - Content */}
        <div className="flex flex-col justify-center px-6 sm:px-8 lg:px-16 py-12 sm:py-16 lg:py-0">
          {/* Heading */}
          <h1
            className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-bold leading-tight mb-6 sm:mb-8 text-purple-700"
            suppressHydrationWarning
          >
            HEAL • GROW • TRANSFORM
          </h1>

          {/* Description */}
          <p
            className="text-gray-600 text-base sm:text-lg leading-relaxed mb-6 sm:mb-8 max-w-xl"
            suppressHydrationWarning
          >
            Psychologist, Family Therapist & Career Counsellor with 24+ years of experience. Delivered 10,000+ sessions across academic, corporate, and family settings, helping individuals reduce stress, improve relationships, and achieve personal and professional growth.
          </p>

          {/* CTA Buttons */}
          <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row gap-3 sm:gap-4" suppressHydrationWarning>
            <Link href="/appointment/type" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-white shadow-lg transition-all bg-gradient-to-r from-purple-600 to-purple-500 hover:shadow-2xl hover:scale-105 active:scale-95">
                Book Appointment
              </button>
            </Link>
            <Link href="/about" className="w-full sm:w-auto">
              <button className="w-full sm:w-auto px-6 sm:px-8 py-3 rounded-full font-semibold text-purple-600 border-2 border-purple-600 shadow-lg transition-all hover:bg-purple-50 hover:scale-105 active:scale-95">
                About the Therapist
              </button>
            </Link>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 sm:gap-12">
            {stats.map((stat, idx) => (
              <div key={idx}>
                <p className="text-3xl sm:text-4xl font-bold text-purple-600">
                  {stat.number}
                </p>
                <p className="text-gray-600 text-xs sm:text-sm mt-1 sm:mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Profile with Chat Cards */}
        <div
          className="relative flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-purple-600 to-purple-700 min-h-96 lg:min-h-screen"
        >
          <div className="relative w-full h-full flex items-center justify-center min-h-80 lg:min-h-full">
            {/* Profile Image Container */}
            <div className="relative w-full h-full flex items-center justify-center">
              <img
                src="/images/profile-picture.jpeg"
                alt="Therapist"
                className="w-full h-full object-cover rounded-2xl sm:rounded-3xl shadow-2xl"
              />
              
              {/* Floating therapist name box - Bottom Left */}
              <div
                className="absolute bottom-4 sm:bottom-6 lg:bottom-8 left-4 sm:left-6 lg:left-8 bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 max-w-xs"
              >
                <p className="text-lg sm:text-2xl font-bold text-gray-900" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                  NEETU RATHORE
                </p>
                <p className="text-gray-600 text-xs sm:text-sm font-medium mt-1">
                  your therapist
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
