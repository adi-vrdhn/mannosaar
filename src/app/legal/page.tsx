'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export default function LegalPage() {
  const [activeTab, setActiveTab] = useState('terms');

  const tabs = [
    { id: 'terms', label: 'Terms & Conditions' },
    { id: 'privacy', label: 'Privacy Policy' },
    { id: 'refund', label: 'Refund Policy' },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  };

  return (
    <div className="min-h-screen bg-white py-12 px-4 sm:px-6 lg:px-8 pt-24">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12"
        >
          <h1 className="text-4xl font-playfair font-bold text-gray-900 mb-4">
            Legal & Policies
          </h1>
          <p className="text-gray-600">
            Learn about our terms, privacy practices, and refund policy
          </p>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={itemVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-wrap gap-2 mb-8 border-b border-gray-200"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 font-medium transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        {/* Content */}
        <motion.div
          key={activeTab}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="prose max-w-none text-gray-700 space-y-6"
        >
          {/* Terms & Conditions Tab */}
          {activeTab === 'terms' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Last updated: April 2026</p>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
                <p>
                  Welcome to MANNOSAAR, a mental health and wellness platform. These Terms & Conditions 
                  govern your use of our services. By accessing and using MANNOSAAR, you agree to be 
                  bound by these terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Use of Service</h2>
                <p>
                  You agree to use MANNOSAAR only for lawful purposes and in a way that does not infringe 
                  upon the rights of others or restrict their use and enjoyment of MANNOSAAR.
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Do not engage in any conduct that restricts or inhibits anyone's use or enjoyment of MANNOSAAR</li>
                  <li>Do not harassment, abuse, defame, threaten or deceive other users</li>
                  <li>Maintain confidentiality of your account credentials</li>
                  <li>You are responsible for all activities under your account</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Therapy Services</h2>
                <p>
                  MANNOSAAR connects you with licensed mental health professionals. The services provided are 
                  professional therapeutic consultations and should not be considered emergency mental health services.
                </p>
                <p className="mt-4 bg-yellow-50 border-l-4 border-yellow-400 p-4 text-yellow-800">
                  <strong>Important:</strong> If you are experiencing a mental health emergency, please contact 
                  emergency services (911 in US, 999 in India) or go to the nearest hospital.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Booking & Rescheduling</h2>
                <p>
                  You agree to:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>Book appointments in advance as indicated on the platform</li>
                  <li>Arrive on time for scheduled sessions</li>
                  <li>Notify the therapist of cancellations with reasonable notice</li>
                  <li>Comply with the therapist's session policies and guidelines</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">5. Payment Terms</h2>
                <p>
                  All payments are processed securely through Razorpay. By proceeding with payment, you confirm:
                </p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>You are authorized to use the payment method provided</li>
                  <li>The information provided is accurate and current</li>
                  <li>You authorize MANNOSAAR to charge your account for the services</li>
                  <li>You understand our refund policy as stated separately</li>
                </ul>
              </section>

              <p className="text-sm text-gray-500 mt-8">
                Content placeholder. Full terms and conditions to be added.
              </p>
            </div>
          )}

          {/* Privacy Policy Tab */}
          {activeTab === 'privacy' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Last updated: April 2026</p>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Introduction</h2>
                <p>
                  MANNOSAAR ("we", "us", "our", or "Company") operates the platform. This page informs you 
                  of our policies regarding the collection, use, and disclosure of personal data when you use 
                  our Service and the choices you have associated with that data.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Information Collection and Use</h2>
                <p>
                  We collect several different types of information for various purposes to provide and 
                  improve our Service to you.
                </p>

                <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2.1 Personal Data</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Name and Email:</strong> Collected during account registration</li>
                  <li><strong>Phone Number:</strong> For appointment confirmations and communications</li>
                  <li><strong>Profile Information:</strong> Your profile picture and bio</li>
                  <li><strong>Booking Information:</strong> Session dates, times, and types</li>
                  <li><strong>Payment Information:</strong> Processed securely through Razorpay (we do not store full card details)</li>
                  <li><strong>Health Information:</strong> Session notes and therapy records (stored securely with encryption)</li>
                </ul>

                <h3 className="text-xl font-bold text-gray-900 mt-6 mb-3">2.2 Usage Data</h3>
                <p>We may also collect information about how the Service is accessed and used including:</p>
                <ul className="list-disc pl-6 space-y-2 mt-3">
                  <li>Your device's IP address</li>
                  <li>Browser type and version</li>
                  <li>Pages visited and time spent</li>
                  <li>Features used</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Therapist-Patient Confidentiality</h2>
                <p>
                  All information shared during therapy sessions is protected by therapist-patient confidentiality, 
                  except in cases where legally required by law or where there is imminent danger.
                </p>
              </section>

              <p className="text-sm text-gray-500 mt-8">
                Content placeholder. Full privacy policy to be added.
              </p>
            </div>
          )}

          {/* Refund Policy Tab */}
          {activeTab === 'refund' && (
            <div className="space-y-6">
              <p className="text-sm text-gray-500">Last updated: April 2026</p>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">1. Overview</h2>
                <p>
                  At MANNOSAAR, we want you to be satisfied with your therapy experience. This Refund Policy 
                  outlines the terms under which refunds can be requested for therapy sessions and services.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">2. Refund Eligibility</h2>
                <p>You may request a refund if:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>You cancel your session at least 24 hours before the scheduled time</li>
                  <li>The therapist cancels the session without completing it</li>
                  <li>Payment was processed incorrectly</li>
                  <li>Technical issues prevented you from attending the session for which you paid</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">3. Non-Refundable Situations</h2>
                <p>Refunds will NOT be issued in the following cases:</p>
                <ul className="list-disc pl-6 space-y-2 mt-4">
                  <li>You cancel within 24 hours of your scheduled session</li>
                  <li>You miss or no-show for your scheduled appointment</li>
                  <li>You fail to join the session at the scheduled time</li>
                  <li>The session has already been completed</li>
                  <li>You request a refund more than 7 days after the session date</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">4. Cancellation Timeline</h2>
                <div className="bg-blue-50 border-l-4 border-blue-400 p-6 mt-4">
                  <ul className="list-disc pl-6 space-y-2 text-blue-900">
                    <li><strong>More than 24 hours before:</strong> Full refund eligible</li>
                    <li><strong>12-24 hours before:</strong> 50% refund</li>
                    <li><strong>Less than 12 hours:</strong> No refund</li>
                    <li><strong>No-show:</strong> No refund (full amount forfeited)</li>
                  </ul>
                </div>
              </section>

              <p className="text-sm text-gray-500 mt-8">
                Content placeholder. Full refund policy to be added.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
