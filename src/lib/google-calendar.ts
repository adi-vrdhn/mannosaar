import { createClient } from '@supabase/supabase-js';

async function getTherapistGoogleCredentials(therapistId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // First try to get credentials for the specified therapist
  const { data, error } = await supabase
    .from('google_oauth_credentials')
    .select('*')
    .eq('user_id', therapistId)
    .single();

  if (data) return data;

  // Fallback: If therapist doesn't have credentials, find the admin user's credentials
  console.log('⚠️ Therapist has no Google credentials, looking for admin credentials...');
  
  const { data: adminData, error: adminError } = await supabase
    .from('users')
    .select('id')
    .eq('role', 'admin')
    .single();

  if (adminError || !adminData) {
    throw new Error('No admin user found to create Google Calendar event.');
  }

  // Get the admin's Google credentials
  const { data: adminCredentials, error: credError } = await supabase
    .from('google_oauth_credentials')
    .select('*')
    .eq('user_id', adminData.id)
    .single();

  if (credError || !adminCredentials) {
    throw new Error('Admin user has not connected their Google account yet.');
  }

  return adminCredentials;
}

async function getOrRefreshAccessToken(credentials: any) {
  const now = new Date();

  // If token is still valid, return it
  if (credentials.token_expiry && new Date(credentials.token_expiry) > now) {
    return credentials.access_token;
  }

  // Otherwise refresh it
  const refreshResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: credentials.refresh_token,
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
      access_token: tokenData.access_token,
      token_expiry: expiryTime.toISOString(),
    })
    .eq('user_id', credentials.user_id);

  return tokenData.access_token;
}

export async function createGoogleCalendarEvent(
  therapistId: string,
  clientEmail: string,
  clientName: string,
  slotDate: string,
  slotTime: string,
  slotEndTime: string,
  sessionType: string = 'personal',
  additionalEmails: string[] = []
) {
  try {
    // Get therapist's Google credentials
    const credentials = await getTherapistGoogleCredentials(therapistId);
    const accessToken = await getOrRefreshAccessToken(credentials);

    // Parse dates and times with proper timezone handling
    const slotStartDate = new Date(slotDate);
    const [startHours, startMinutes] = slotTime.split(':').map(Number);
    slotStartDate.setHours(startHours, startMinutes, 0, 0);

    const slotEndDate = new Date(slotDate);
    const [endHours, endMinutes] = slotEndTime.split(':').map(Number);
    slotEndDate.setHours(endHours, endMinutes, 0, 0);

    // Format for Google Calendar (ISO 8601 with timezone)
    const startDateTime = slotStartDate.toISOString();
    const endDateTime = slotEndDate.toISOString();

    console.log('🔄 Creating Google Calendar event:', {
      summary: `Therapy Session - ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}`,
      start: startDateTime,
      end: endDateTime,
      attendees: [clientEmail, credentials.email, ...additionalEmails],
    });

    // Build attendees list
    const attendees = [
      { email: clientEmail, displayName: clientName || 'Client' },
      { email: credentials.email, displayName: 'Therapist' as any, organizer: true },
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
        summary: `Therapy Session - ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}`,
        description: `${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)} therapy session`,
        start: {
          dateTime: startDateTime,
          timeZone: 'UTC',
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'UTC',
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

    console.log('📋 Full Google Calendar event response:', JSON.stringify(event, null, 2));

    // Extract the Google Meet link
    const meetLink = event.conferenceData?.entryPoints?.find(
      (ep: any) => ep.entryPointType === 'video'
    )?.uri;

    console.log('🔗 Conference data:', event.conferenceData);
    console.log('📞 Entry points:', event.conferenceData?.entryPoints);
    console.log('✅ Meet link:', meetLink);

    const response = {
      success: true,
      eventId: event.id,
      meetLink,
      eventLink: event.htmlLink,
      summary: event.summary,
    };

    console.log('✅ Google Calendar event created successfully:', {
      eventId: event.id,
      meetLink,
    });

    return response;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Google Calendar event';
    console.error('❌ Google Calendar creation error:', errorMessage);
    throw error;
  }
}
