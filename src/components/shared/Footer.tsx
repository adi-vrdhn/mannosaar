'use client';

import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-purple-600 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Logo and Brand Name */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Image
              src="/images/mannosaar-logo.svg"
              alt="Mannosaar Logo"
              width={60}
              height={60}
              className="h-16 w-auto"
            />
          </div>
          <h3 className="text-2xl font-playfair font-bold">MANNOSAAR</h3>
          <p className="text-purple-100 text-sm mt-2">Mental Health & Wellness Platform</p>
        </div>

        {/* Links */}
        <div className="text-center space-y-3 text-sm border-t border-purple-400 pt-8">
          <div className="flex justify-center gap-6">
            <Link 
              href="/terms" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Terms & Conditions
            </Link>
            <span className="text-purple-400">|</span>
            <Link 
              href="/privacy" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Privacy Policy
            </Link>
            <span className="text-purple-400">|</span>
            <Link 
              href="/refund-policy" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Refund Policy
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-purple-200 text-xs mt-6 pt-6 border-t border-purple-400">
            <p>&copy; 2026 MANNOSAAR. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
