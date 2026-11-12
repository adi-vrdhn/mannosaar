'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState, useRef, useEffect } from 'react';
import { signOut } from 'next-auth/react';
import { useSession } from 'next-auth/react';
import { LogIn, LogOut, ShieldCheck, UserRound } from 'lucide-react';

interface NavbarProps {
  onLogout?: () => void;
}

const Navbar = ({ onLogout }: NavbarProps) => {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
      if (mobileMenuRef.current && !mobileMenuRef.current.contains(event.target as Node)) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isDropdownOpen || isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen, isMobileMenuOpen]);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut({ redirect: true, redirectTo: '/' });
    onLogout?.();
  };

  return (
    <nav className="sticky top-0 z-50 border-b border-white/30 bg-[#cbb7df] shadow-sm" suppressHydrationWarning>
      <div className="mx-auto max-w-[1440px] px-4 py-4 sm:px-6 lg:px-8 xl:px-10 2xl:px-12">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="group flex shrink-0 items-center gap-3 sm:gap-4">
            <Image
              src="/mannosaar_logog_only.png"
              alt=""
              width={535}
              height={349}
              className="h-10 w-auto shrink-0 transition-transform duration-300 group-hover:scale-105 sm:h-12 lg:h-14"
            />
            <div className="flex flex-col">
              <span className="text-xl font-bold leading-tight text-[#34213f] transition-colors duration-300 group-hover:text-[#34213f]/75 sm:text-2xl lg:text-[1.75rem]" style={{ fontFamily: 'var(--font-playfair-display)' }}>
                Mannosaar
              </span>
              <span className="text-[10px] font-medium tracking-wide text-[#34213f]/80 sm:text-xs">
                Heal • Grow • Transform
              </span>
            </div>
          </Link>

          {/* Navigation Links - Center (Desktop Only) */}
          <div className="hidden items-center gap-6 lg:flex xl:gap-8">
            <Link
              href="/"
              className="text-[#34213f] hover:text-[#34213f]/70 transition-colors font-medium text-sm"
            >
              Home
            </Link>
            <Link
              href="/services"
              className="text-[#34213f] hover:text-[#34213f]/70 transition-colors font-medium text-sm"
            >
              Services
            </Link>
            <Link
              href="/about"
              className="text-[#34213f] hover:text-[#34213f]/70 transition-colors font-medium text-sm"
            >
              About
            </Link>
            <Link
              href="/blogs"
              className="text-[#34213f] hover:text-[#34213f]/70 transition-colors font-medium text-sm"
            >
              Blog
            </Link>
            <Link
              href="/#reviews"
              className="text-[#34213f] hover:text-[#34213f]/70 transition-colors font-medium text-sm"
            >
              Reviews
            </Link>
          </div>

          {/* User Section - Right */}
          <div ref={mobileMenuRef} className="flex items-center gap-4 xl:gap-6" suppressHydrationWarning>
            <Link
              href="/book-session"
              className="hidden min-h-11 items-center justify-center rounded-full bg-purple-700 px-5 py-2 text-sm font-semibold text-white transition hover:bg-purple-800 hover:shadow-lg lg:inline-flex"
            >
              Book Session
            </Link>
            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
              className="flex flex-col gap-1.5 p-2 lg:hidden"
              aria-label="Toggle menu"
              aria-expanded={isMobileMenuOpen}
              suppressHydrationWarning
            >
              <div className={`w-6 h-0.5 bg-[#34213f] transition-all duration-300 ${isMobileMenuOpen ? 'rotate-45 translate-y-2' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-[#34213f] transition-all duration-300 ${isMobileMenuOpen ? 'opacity-0' : ''}`}></div>
              <div className={`w-6 h-0.5 bg-[#34213f] transition-all duration-300 ${isMobileMenuOpen ? '-rotate-45 -translate-y-2' : ''}`}></div>
            </button>

            {isMounted && (
              <>
                {session?.user ? (
                  <div ref={dropdownRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsDropdownOpen((isOpen) => !isOpen)}
                      aria-label="Open account menu"
                      aria-expanded={isDropdownOpen}
                      aria-controls="account-menu"
                      className="flex size-11 items-center justify-center rounded-full border border-[#34213f]/25 bg-white/25 text-[#34213f] transition-colors hover:border-[#34213f]/45 hover:bg-white/45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5b267a]"
                    >
                      <UserRound size={22} strokeWidth={1.8} aria-hidden="true" />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div id="account-menu" className="absolute right-0 mt-3 w-72 max-w-[calc(100vw-2rem)] overflow-hidden rounded-2xl border border-[#34213f]/10 bg-white shadow-[0_18px_45px_rgba(52,33,63,0.18)]">
                        <div className="border-b border-[#34213f]/10 px-5 py-4">
                          <p className="truncate text-sm font-semibold text-[#34213f]">
                            {session.user.name || session.user.email?.split('@')[0] || 'Your account'}
                          </p>
                          {session.user.email && (
                            <p className="mt-1 truncate text-xs text-[#63576a]">{session.user.email}</p>
                          )}
                        </div>
                        <div className="p-2">
                          <Link
                            href="/profile"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#34213f] transition-colors hover:bg-[#f3edf7]"
                          >
                            <UserRound size={18} strokeWidth={1.8} aria-hidden="true" />
                            My profile
                          </Link>
                          {session.user.role === 'admin' && (
                            <Link
                              href="/admin"
                              onClick={() => setIsDropdownOpen(false)}
                              className="flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-[#34213f] transition-colors hover:bg-[#f3edf7]"
                            >
                              <ShieldCheck size={18} strokeWidth={1.8} aria-hidden="true" />
                              Admin Panel
                            </Link>
                          )}
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-[#34213f] transition-colors hover:bg-[#f3edf7]"
                          >
                            <LogOut size={18} strokeWidth={1.8} aria-hidden="true" />
                            Log out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href="/auth/login"
                    aria-label="Log in"
                    className="flex size-11 items-center justify-center rounded-full border border-white/50 bg-purple-700 font-medium text-white transition-all hover:bg-purple-800 hover:shadow-lg sm:w-auto sm:px-6"
                  >
                    <LogIn size={19} aria-hidden="true" className="sm:hidden" />
                    <span className="hidden sm:inline">Login</span>
                  </Link>
                )}
              </>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div
            className="mt-4 border-t border-white/25 pb-4 lg:hidden"
            suppressHydrationWarning
          >
            <div className="space-y-2">
              <Link
                href="/"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium text-[#34213f] hover:bg-white/15 transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium text-[#34213f] hover:bg-white/15 transition-colors"
              >
                About
              </Link>
              <Link
                href="/services"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium text-[#34213f] hover:bg-white/15 transition-colors"
              >
                Services
              </Link>
              <Link
                href="/blogs"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium text-[#34213f] hover:bg-white/15 transition-colors"
              >
                Blog
              </Link>
              <Link
                href="/#reviews"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block rounded-lg px-4 py-3 font-medium text-[#34213f] hover:bg-white/15 transition-colors"
              >
                Reviews
              </Link>
              <Link
                href="/book-session"
                onClick={() => setIsMobileMenuOpen(false)}
                className="mt-3 flex min-h-12 items-center justify-center rounded-full bg-purple-700 px-5 py-3 font-semibold text-white transition-colors hover:bg-purple-800"
              >
                Book Session
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
