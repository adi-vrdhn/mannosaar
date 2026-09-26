import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  Calendar,
  CalendarDays,
  Clock3,
  CreditCard,
  Home,
  Settings,
  Users,
} from 'lucide-react';

export interface AdminNavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  roles: Array<'admin' | 'therapist'>;
}

export const adminNavItems: AdminNavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: Home, roles: ['admin', 'therapist'] },
  { label: 'Appointments', href: '/admin/bookings', icon: CalendarDays, roles: ['admin', 'therapist'] },
  { label: 'Calendar', href: '/admin/calendar', icon: Calendar, roles: ['admin', 'therapist'] },
  { label: 'Clients', href: '/admin/users', icon: Users, roles: ['admin'] },
  { label: 'Slots', href: '/admin/slots', icon: Clock3, roles: ['admin'] },
  { label: 'WhatsApp', href: '/admin/whatsapp', icon: CalendarDays, roles: ['admin'] },
  { label: 'Payments', href: '/admin/payments', icon: CreditCard, roles: ['admin', 'therapist'] },
  { label: 'Analytics', href: '/admin/analytics', icon: BarChart3, roles: ['admin', 'therapist'] },
  { label: 'Settings', href: '/admin/settings', icon: Settings, roles: ['admin', 'therapist'] },
];
