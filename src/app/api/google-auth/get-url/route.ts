import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 [Google Auth] Request received');
    
    const session = await auth();
    console.log('📋 [Google Auth] Session:', { 
      exists: !!session,
      email: session?.user?.email,
      id: session?.user?.id,
      fullSession: JSON.stringify(session)
    });
    
    if (!session?.user?.id) {
      console.error('❌ [Google Auth] No session or user ID');
      return NextResponse.json(
        { error: 'Unauthorized - Please log in first', details: 'No active session' },
        { status: 401 }
      );
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const REDIRECT_URI = `${APP_URL}/api/auth/google-callback`;

    console.log('🔑 [Google Auth] Config:', {
      hasClientId: !!GOOGLE_CLIENT_ID,
      appUrl: APP_URL,
      redirectUri: REDIRECT_URI,
    });

    if (!GOOGLE_CLIENT_ID) {
      console.error('❌ [Google Auth] Missing GOOGLE_CLIENT_ID');
      return NextResponse.json(
        { 
          error: 'Google OAuth not configured',
          details: 'GOOGLE_CLIENT_ID environment variable is missing.'
        },
        { status: 500 }
      );
    }

    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.append('client_id', GOOGLE_CLIENT_ID);
    authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('scope', [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/userinfo.email',
    ].join(' '));
    authUrl.searchParams.append('access_type', 'offline');
    authUrl.searchParams.append('prompt', 'consent');

    console.log('✅ [Google Auth] Generated auth URL');

    return NextResponse.json({
      authUrl: authUrl.toString(),
    });
  } catch (error) {
    console.error('❌ [Google Auth] Error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to generate auth URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
