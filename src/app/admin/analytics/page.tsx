import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import Analytics from '@/components/admin/Analytics';

export default async function AnalyticsPage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  // Check if user is admin or therapist using service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user?.email)
    .single();

  // Allow only admin and therapist roles
  if (error || (user?.role !== 'admin' && user?.role !== 'therapist')) {
    redirect('/');
  }

  return <Analytics />;
}
