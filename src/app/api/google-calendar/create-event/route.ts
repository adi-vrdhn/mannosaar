import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGoogleCalendarEvent } from '@/lib/google-calendar';

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

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
    if (!clientEmail || !slotDate || !slotTime || !slotEndTime) {
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
