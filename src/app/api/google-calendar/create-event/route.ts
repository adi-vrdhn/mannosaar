import { NextRequest, NextResponse } from 'next/server';
import { authenticatedAdmin } from '@/lib/admin-authorization';
import { isSameOrigin } from '@/lib/compliance';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await authenticatedAdmin();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Forbidden' },
        { status: 403 }
      );
    }
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

    const body = await request.json();
    const {
      clientEmail,
      clientName,
      slotDate,
      slotTime,
      slotEndTime,
      sessionType = 'personal',
      therapistId = 'default-admin', // Use admin's credentials
      additionalEmails = [],
    } = body;

    // Validate required parameters
    if (typeof clientEmail !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clientEmail) || clientEmail.length > 254 || typeof slotDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(slotDate) || typeof slotTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slotTime) || typeof slotEndTime !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(slotEndTime) || !Array.isArray(additionalEmails) || additionalEmails.length > 5) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: clientEmail, slotDate, slotTime, slotEndTime' },
        { status: 400 }
      );
    }

    // Use the utility function to create Google Calendar event
    const response = await createGoogleCalendarEvent(
      therapistId || session.user.id,
      clientEmail,
      clientName,
      slotDate,
      slotTime,
      slotEndTime,
      sessionType,
      additionalEmails
    );

    return NextResponse.json(response);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Google Calendar event';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
