import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ connected: false }, { status: 401 });
    }

    const { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('user_id')
      .eq('user_id', session.user.id)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking Google connection:', error);
      return NextResponse.json({ connected: false });
    }

    return NextResponse.json({ connected: !!data });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ connected: false });
  }
}
