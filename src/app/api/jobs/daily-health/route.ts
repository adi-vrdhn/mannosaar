import { NextResponse } from 'next/server';
import { equalSecret } from '@/lib/whatsapp/core';
import { createDailyHealthReport } from '@/lib/daily-health-report';
import { sendDailyHealthReportEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

function authorized(request: Request) {
  const expected = process.env.CRON_SECRET ? `Bearer ${process.env.CRON_SECRET}` : '';
  return Boolean(expected) && equalSecret(request.headers.get('authorization') || '', expected);
}

export async function GET(request: Request) {
  if (!authorized(request)) return new Response('Forbidden', { status: 403 });

  try {
    const report = await createDailyHealthReport();
    const recipient = process.env.HEALTH_REPORT_EMAIL || process.env.THERAPIST_EMAIL || process.env.EMAIL_USER;
    if (!recipient) {
      return NextResponse.json({ error: 'HEALTH_REPORT_EMAIL is not configured' }, { status: 503 });
    }
    const delivered = await sendDailyHealthReportEmail(recipient, report);
    if (!delivered) return NextResponse.json({ error: 'Report email could not be delivered', level: report.level }, { status: 503 });
    return NextResponse.json({ ok: true, level: report.level, generatedAt: report.generatedAt });
  } catch (error) {
    console.error('Daily health report failed:', error);
    return NextResponse.json({ error: 'Daily health report failed' }, { status: 500 });
  }
}
