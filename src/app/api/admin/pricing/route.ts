import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getPricingSnapshot } from '@/lib/pricing';

export async function GET() {
  try {
    const session = await auth();
    const snapshot = await getPricingSnapshot(session?.user?.id);

    return NextResponse.json({
      success: true,
      ...snapshot,
      timestamp: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch (err) {
    console.error('Error in pricing endpoint:', err);
    return NextResponse.json({
      success: false,
      error: 'Unable to load pricing',
    }, { status: 500 });
  }
}
