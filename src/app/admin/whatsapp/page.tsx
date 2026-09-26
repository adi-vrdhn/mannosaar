import { redirect } from 'next/navigation';
import { isWhatsAppAdmin } from '@/lib/whatsapp/admin';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import WhatsAppOperations from '@/components/admin/WhatsAppOperations';
export default async function WhatsAppAdminPage() {
  if (!await isWhatsAppAdmin()) redirect('/auth/login');
  return <div className="min-h-screen bg-[#faf9f7] px-4 py-8 text-slate-950 sm:px-6 lg:px-8"><div className="mx-auto max-w-7xl"><AdminSectionNav className="mb-8"/><h1 className="mb-6 font-playfair text-3xl font-semibold text-[#34213f] sm:text-4xl">WhatsApp bookings</h1><WhatsAppOperations/></div></div>;
}
