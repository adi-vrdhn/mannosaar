import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdminSectionNav from '@/components/admin/AdminSectionNav';
import GoogleConnectButton from '@/components/admin/GoogleConnectButton';
import PricingSettingsForm from '@/components/admin/PricingSettingsForm';
import ReviewsManagement from '@/components/admin/ReviewsManagement';

export default async function SettingsPage() {
  const session = await auth();

  // Check if user is admin or therapist
  if (!session?.user?.id || (session?.user?.role !== 'admin' && session?.user?.role !== 'therapist')) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-[#faf9f7] pb-12 pt-8">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <AdminSectionNav className="mb-8" />

        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 font-playfair text-3xl font-semibold text-[#34213f] sm:text-4xl">Settings</h1>
          <p className="text-base text-gray-600 sm:text-xl">Manage integrations and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-8">
          {/* Google Calendar Integration Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Integrations</h2>
            
            <GoogleConnectButton />
          </div>

          {/* Pricing Settings Section */}
          <PricingSettingsForm userRole={session?.user?.role} />

          {/* Reviews Management Section */}
          <ReviewsManagement userRole={session?.user?.role} />

          {/* User Information Section */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-8">
            <h2 className="mb-6 text-xl font-semibold text-gray-900">Account information</h2>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="text-lg font-semibold text-gray-900">{session?.user?.email}</p>
                </div>
              </div>
              
              <div className="flex justify-between items-start pt-4 border-t border-gray-200">
                <div>
                  <p className="text-sm text-gray-600">Role</p>
                  <p className="text-lg font-semibold text-gray-900 capitalize">{session?.user?.role || 'User'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Help Section */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5 sm:p-8">
            <h2 className="text-2xl font-bold text-blue-900 mb-4">❓ Need Help?</h2>
            
            <div className="space-y-3 text-blue-800">
              <p>
                📚 Check out the <code className="bg-blue-100 px-2 py-1 rounded">GOOGLE_CALENDAR_SETUP.md</code> guide for detailed instructions on setting up Google Calendar integration.
              </p>
              <p>
                🔑 You'll need to create OAuth credentials in Google Cloud Console and add them to your .env.local file.
              </p>
              <p>
                💬 Once connected, your clients will automatically receive meeting links via email.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
