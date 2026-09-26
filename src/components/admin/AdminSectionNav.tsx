'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { adminNavItems } from './adminNavItems';

const isActivePath = (pathname: string, href: string) => {
  if (href === '/admin') {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
};

interface AdminSectionNavProps {
  className?: string;
}

export default function AdminSectionNav({ className = '' }: AdminSectionNavProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const role = session?.user?.role as 'admin' | 'therapist' | undefined;
  const visibleItems = role ? adminNavItems.filter(item => item.roles.includes(role)) : adminNavItems;

  return (
    <nav aria-label="Admin sections" className={`border-b border-slate-200 ${className}`.trim()}>
      <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-6 lg:min-w-full lg:justify-between lg:gap-2">
          {visibleItems.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={`relative inline-flex items-center gap-1.5 py-3 text-xs font-medium transition sm:gap-2 sm:py-4 sm:text-sm lg:flex-1 lg:justify-center lg:px-2 ${
                  active
                    ? 'text-[#5b267a] after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-[#5b267a]'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon size={14} className="sm:h-4 sm:w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
