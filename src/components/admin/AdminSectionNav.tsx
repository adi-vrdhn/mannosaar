'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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

  return (
    <div className={`lg:hidden ${className}`.trim()}>
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-2">
          {adminNavItems.map(({ href, icon: Icon, label }) => {
            const active = isActivePath(pathname, href);

            return (
              <Link
                key={href}
                href={href}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:gap-2 sm:px-4 sm:py-2 sm:text-sm ${
                  active
                    ? 'border-violet-200 bg-violet-100 text-violet-700'
                    : 'border-slate-200 bg-white text-slate-600'
                }`}
              >
                <Icon size={14} className="sm:h-4 sm:w-4" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
