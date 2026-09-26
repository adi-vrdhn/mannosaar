import { protectToken, revealToken } from './google-calendar/token-protection';
import { createClient } from '@supabase/supabase-js';

interface GoogleCredential { user_id: string; access_token: string; refresh_token: string; token_expiry?: string | null; email?: string | null }
interface GoogleEventData { id?: string; htmlLink?: string; summary?: string; hangoutLink?: string; conferenceData?: { entryPoints?: Array<{ entryPointType?: string; uri?: string }> } }

async function getTherapistGoogleCredentials(therapistId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  console.log('🔍 Looking for therapist credentials with ID:', therapistId);

  // First try to get credentials for the specified therapist
  const { data, error } = await supabase
    .from('google_oauth_credentials')
    .select('*')
    .eq('user_id', therapistId)
    .maybeSingle();

  console.log('🔍 Therapist credential query result:', { 
    hasData: !!data, 
    error, 
    therapistId 
  });

  if (data) {
    console.log('✅ Found therapist credentials');
    return data;
  }

  // Fallback: If therapist doesn't have credentials, find admin user credentials
  console.log('⚠️ Therapist has no Google credentials, looking for admin credentials...');
  
  const { data: adminDataList, error: adminError } = await supabase
    .from('users')
    .select('id, email')
    .eq('role', 'admin')
    .limit(2); // Get up to 2 admins

  console.log('🔍 Admin lookup result:', { 
    adminCount: adminDataList?.length, 
    adminError,
    admins: adminDataList
  });

  if (adminError || !adminDataList || adminDataList.length === 0) {
    throw new Error('No admin user found to create Google Calendar event.');
  }

  // Try to get credentials for the first admin with valid credentials
  let adminCredentials: GoogleCredential | null = null;

  for (const admin of adminDataList) {
    const { data: creds, error: credError } = await supabase
      .from('google_oauth_credentials')
      .select('*')
      .eq('user_id', admin.id)
      .maybeSingle();

    console.log('🔍 Checking calendar credentials:', {
      hasCredentials: !!creds, 
      hasError: !!credError,
    });

    if (creds && !credError) {
      adminCredentials = creds;
      console.log('✅ Calendar credentials selected');
      break;
    }
  }

  if (!adminCredentials) {
    throw new Error('No administrator has connected a Google Calendar account.');
  }

  return adminCredentials;
}

// New function to get all admin emails for attendees
async function getAllAdminEmails() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: admins, error } = await supabase
    .from('users')
    .select('email')
    .eq('role', 'admin')
    .limit(2);

  if (error || !admins) {
    console.log('⚠️ Could not fetch admin emails:', error);
    return [];
  }

  const emails = admins.map((a: { email: string | null }) => a.email).filter((email): email is string => Boolean(email));
  console.log('✅ Calendar notification recipients resolved:', emails.length);
  return emails;
}

async function getOrRefreshAccessToken(credentials: GoogleCredential) {
  const now = new Date();

  // If token is still valid, return it
  if (credentials.token_expiry && new Date(credentials.token_expiry) > now) {
    return revealToken(credentials.access_token);
  }

  // Otherwise refresh it
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: revealToken(credentials.refresh_token),
      grant_type: 'refresh_token',
    }).toString(),
  });

  if (!refreshResponse.ok) {
    throw new Error('Failed to refresh Google token');
  }

  const tokenData = await refreshResponse.json();

  // Update the token in database
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const expiryTime = new Date();
  expiryTime.setSeconds(expiryTime.getSeconds() + tokenData.expires_in);

  await supabase
    .from('google_oauth_credentials')
    .update({
      access_token: protectToken(tokenData.access_token),
      token_expiry: expiryTime.toISOString(),
    })
    .eq('user_id', credentials.user_id);

  return tokenData.access_token;
}

function extractMeetLink(eventData: GoogleEventData | null) {
  if (!eventData) return null;

  if (eventData.hangoutLink) {
    return eventData.hangoutLink;
  }

  const entryPoints = eventData.conferenceData?.entryPoints || [];
  const meetEntry = entryPoints.find(
    (entry) =>
      entry.entryPointType === 'video' || entry.uri?.includes('meet.google.com')
  );

  return meetEntry?.uri || null;
}

export async function createGoogleCalendarEvent(
  therapistId: string,
  clientEmail: string,
  clientName: string,
  slotDate: string,
  slotTime: string,
  slotEndTime: string,
  _sessionType: string = 'personal',
  additionalEmails: string[] = []
) {
  void _sessionType;
  try {
    // Get therapist's Google credentials
    const credentials = await getTherapistGoogleCredentials(therapistId);
    console.log('✅ Got calendar credentials:', {
      hasAccessToken: !!credentials.access_token,
      hasRefreshToken: !!credentials.refresh_token
    });

    const accessToken = await getOrRefreshAccessToken(credentials);
    console.log('✅ Got access token for event creation');

    // Get all admin emails to add as attendees
    const adminEmails = await getAllAdminEmails();

    // Parse dates and times with proper timezone handling
    const slotStartDate = new Date(slotDate);
    const [startHours, startMinutes] = slotTime.split(':').map(Number);
    slotStartDate.setHours(startHours, startMinutes, 0, 0);

    const slotEndDate = new Date(slotDate);
    const [endHours, endMinutes] = slotEndTime.split(':').map(Number);
    slotEndDate.setHours(endHours, endMinutes, 0, 0);

    // Format for Google Calendar (ISO 8601 as local time, not UTC)
    const formatLocalDateTime = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };

    const startDateTime = formatLocalDateTime(slotStartDate);
    const endDateTime = formatLocalDateTime(slotEndDate);

    console.log('🔄 Creating Google Calendar event:', {
      summary: 'Mannosaar Online Session',
      start: startDateTime,
      end: endDateTime,
      timezone: 'Asia/Kolkata',
      attendeeCount: 1 + adminEmails.length + additionalEmails.length,
    });

    // Build attendees list with client and all admins
    const attendees = [
      { email: clientEmail, displayName: clientName || 'Client' },
      ...adminEmails.map((email: string) => ({ 
        email, 
        displayName: 'Therapist',
        organizer: adminEmails[0] === email // First admin is organizer
      })),
      ...additionalEmails.map((email: string) => ({ email })),
    ];

    // Create Google Calendar event with Google Meet
    const eventResponse = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events?conferenceDataVersion=1', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        summary: 'Mannosaar Online Session',
        description: 'Scheduled online session. Please use the attached Google Meet link.',
        visibility: 'private',
        start: {
          dateTime: startDateTime,
          timeZone: 'Asia/Kolkata',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'Asia/Kolkata',
        },
        attendees,
        conferenceData: {
          createRequest: {
            requestId: `therapy-${Date.now()}`,
            conferenceSolution: {
              key: {
                conferenceType: 'hangoutsMeet',
              },
            },
          },
        },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 },
            { method: 'popup', minutes: 15 },
          ],
        },
      }),
    });

    if (!eventResponse.ok) {
      const error = await eventResponse.json();
      console.error('Google Calendar API error:', error);
      throw new Error(`Failed to create Google Calendar event: ${error.error?.message || 'Unknown error'}`);
    }

    const event = await eventResponse.json();

    // Google may create the event before its Meet entry point is ready. Poll the
    // event briefly so callers never persist an old or empty meeting link.
    let finalEvent = event;
    let meetLink = extractMeetLink(finalEvent);
    for (let attempt = 0; !meetLink && event.id && attempt < 4; attempt += 1) {
      await new Promise(resolve => setTimeout(resolve, 500 * (attempt + 1)));
      const getEventResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/primary/events/${event.id}?conferenceDataVersion=1`,
        { method: 'GET', headers: { Authorization: `Bearer ${accessToken}` } }
      );
      if (getEventResponse.ok) {
        finalEvent = await getEventResponse.json();
        meetLink = extractMeetLink(finalEvent);
      }
    }

    const response = {
      success: true,
      eventId: finalEvent.id,
      meetLink,
      eventLink: finalEvent.htmlLink,
      summary: finalEvent.summary,
    };

    console.log('✅ Google Calendar event created successfully:', {
      eventId: finalEvent.id,
      meetCreated: Boolean(meetLink),
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Google Calendar event';
    console.error('❌ Google Calendar creation error:', errorMessage);
    throw error;
  }
}

export async function deleteGoogleCalendarEvent(
  therapistId: string,
  eventId: string
) {
  try {
    if (!eventId) {
      console.log('ℹ️ No Google Calendar event ID provided, skipping delete');
      return true;
    }

    const credentials = await getTherapistGoogleCredentials(therapistId);
    const accessToken = await getOrRefreshAccessToken(credentials);

    const deleteResponse = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/primary/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!deleteResponse.ok && deleteResponse.status !== 404) {
      const errorText = await deleteResponse.text();
      throw new Error(
        `Failed to delete Google Calendar event: ${deleteResponse.status} ${errorText}`
      );
    }

    console.log('✅ Google Calendar event deleted successfully:', eventId);
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to delete Google Calendar event';
    console.error('❌ Google Calendar deletion error:', errorMessage);
    return false;
  }
}
