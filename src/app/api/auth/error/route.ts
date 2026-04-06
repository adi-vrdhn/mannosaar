import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const error = request.nextUrl.searchParams.get('error');
  
  console.log('[Auth Error]', error);
  
  // Redirect to login page with error
  return NextResponse.redirect(
    new URL(`/auth/login?error=${error || 'unknown'}`, request.url)
  );
}
