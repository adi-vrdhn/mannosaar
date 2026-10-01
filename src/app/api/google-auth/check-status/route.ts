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

    let { data, error } = await supabase
      .from('google_oauth_credentials')
      .select('user_id,email,connected_at,refresh_token_expires_at')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      const fallback = await supabase
        .from('google_oauth_credentials')
        .select('user_id,email')
        .eq('user_id', session.user.id)
        .maybeSingle();
      data = fallback.data ? { ...fallback.data, connected_at: null, refresh_token_expires_at: null } : null;
      error = fallback.error;
    }

    if (error && error.code !== 'PGRST116') {
      console.error('Error checking Google connection:', error);
      return NextResponse.json({ connected: false });
    }

    const expiresAt = data?.refresh_token_expires_at ? Date.parse(data.refresh_token_expires_at) : null;
    const daysRemaining = expiresAt === null ? null : Math.max(0, Math.ceil((expiresAt - Date.now()) / 86_400_000));
    return NextResponse.json({
      connected: Boolean(data) && (expiresAt === null || expiresAt > Date.now()),
      email: data?.email || null,
      testMode: process.env.GOOGLE_OAUTH_TEST_MODE === 'true',
      daysRemaining,
      expiresAt: data?.refresh_token_expires_at || null,
    });
  } catch (error) {
    console.error('Error:', error);
    return NextResponse.json({ connected: false });
  }
}
