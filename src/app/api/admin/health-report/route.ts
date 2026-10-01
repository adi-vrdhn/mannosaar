import { NextResponse } from 'next/server';
import { isWhatsAppAdmin } from '@/lib/whatsapp/admin';
import { createDailyHealthReport } from '@/lib/daily-health-report';
import { sendDailyHealthReportEmail } from '@/lib/email';

export const runtime = 'nodejs';
export const maxDuration = 60;
export const dynamic = 'force-dynamic';

export async function POST() {
  if (!await isWhatsAppAdmin()) return new Response('Forbidden', { status: 403 });

  try {
    const report = await createDailyHealthReport();
    const recipient = process.env.HEALTH_REPORT_EMAIL || process.env.THERAPIST_EMAIL || process.env.EMAIL_USER;
    const emailed = recipient ? await sendDailyHealthReportEmail(recipient, report) : false;
    return NextResponse.json({ report, emailed, recipientConfigured: Boolean(recipient) });
  } catch (error) {
    console.error('Manual health report failed:', error);
    return NextResponse.json({ error: 'Unable to generate the health report right now.' }, { status: 500 });
  }
}
