'use client';

import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-purple-600 text-white py-12 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand Name */}
        <div className="text-center mb-8">
          <h3 className="text-2xl font-playfair font-bold">MANNOSAAR</h3>
          <p className="text-purple-100 text-sm mt-2">Mental Health & Wellness Platform</p>
        </div>

        {/* Contact Info */}
        <div className="text-center mb-6 pb-6 border-b border-purple-400">
          <p className="text-purple-100 text-sm">
            Email: <a href="mailto:care@mannosaar.com" className="hover:text-white transition-colors font-medium">care@mannosaar.com</a>
          </p>
          <p className="text-purple-100 text-sm mt-2">
            Phone: <a href="tel:+15551234567" className="hover:text-white transition-colors font-medium">+1 (555) 123-4567</a>
          </p>
        </div>

        {/* Links */}
        <div className="text-center space-y-3 text-sm border-t border-purple-400 pt-6">
          <div className="flex justify-center gap-6">
            <Link 
              href="/legal#terms" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Terms & Conditions
            </Link>
            <span className="text-purple-400">|</span>
            <Link 
              href="/legal#privacy" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Privacy Policy
            </Link>
            <span className="text-purple-400">|</span>
            <Link 
              href="/legal#refund" 
              className="text-purple-100 hover:text-white transition-colors font-medium"
            >
              Refund Policy
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-purple-200 text-xs mt-6">
            <p>&copy; 2026 MANNOSAAR. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
