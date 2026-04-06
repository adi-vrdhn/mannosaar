import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import BlockScheduleManagement from '@/components/admin/BlockScheduleManagement';

export default async function BlockSchedulePage() {
  const session = await auth();

  if (!session) {
    redirect('/auth/login');
  }

  // Check if user is admin using service role key
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user?.email)
    .single();

  if (error || user?.role !== 'admin') {
    redirect('/');
  }

  return <BlockScheduleManagement />;
}
