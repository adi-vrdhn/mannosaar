import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface ZoomMeetingResponse {
  id: number;
  uuid: string;
  host_id: string;
  topic: string;
  type: number;
  start_time: string;
  duration: number;
  timezone: string;
  created_at: string;
  join_url: string;
  password?: string;
  settings: {
    host_video: boolean;
    participant_video: boolean;
    join_before_host: boolean;
    auto_recording: string;
    waiting_room: boolean;
  };
}

async function getZoomAccessToken(): Promise<string> {
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  const accountId = process.env.ZOOM_ACCOUNT_ID;

  if (!clientId || !clientSecret || !accountId) {
    throw new Error('Missing Zoom credentials: ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET, or ZOOM_ACCOUNT_ID');
  }

  const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const response = await fetch('https://zoom.us/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${authHeader}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: `grant_type=account_credentials&account_id=${accountId}`,
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Zoom token error:', error);
    throw new Error(`Failed to get Zoom token: ${error.message || error.error}`);
  }

  const data = await response.json();
  return data.access_token;
}

async function createZoomMeeting(
  topic: string,
  duration: number = 40,
  startTime: Date
): Promise<{ meeting: ZoomMeetingResponse; password: string }> {
  const accessToken = await getZoomAccessToken();
  
  // Generate password once to ensure consistency
  const generatedPassword = Math.random().toString().slice(2, 8);

  // Format start time to ISO string without milliseconds
  const isoStartTime = startTime.toISOString().split('.')[0]; // Format: 2024-04-03T15:30:00

  console.log('Creating Zoom meeting with:', {
    topic,
    duration,
    startTime: isoStartTime,
    timezone: 'UTC',
    password: generatedPassword,
  });

  const response = await fetch('https://api.zoom.us/v2/users/me/meetings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      topic: topic,
      type: 2, // Scheduled meeting
      start_time: isoStartTime,
      duration: duration,
      timezone: 'UTC',
      password: generatedPassword, // Use consistent password
      settings: {
        host_video: true,
        participant_video: true,
        cn_meeting: false,
        in_meeting: false,
        join_before_host: true,
        jbh_time: 0,
        waiting_room: false,
        auto_recording: 'none',
        approval_type: 0,
        audio: 'both',
        enforce_login: false,
        enforce_login_domains: '',
        alternative_hosts: '',
        close_registration: false,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Zoom meeting creation error:', error);
    throw new Error(`Failed to create Zoom meeting: ${error.message || JSON.stringify(error)}`);
  }

  const meeting: ZoomMeetingResponse = await response.json();
  console.log('Zoom meeting created successfully:', {
    meetingId: meeting.id,
    joinUrl: meeting.join_url,
  });

  return { meeting, password: generatedPassword };
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionType = 'personal', slotDate, slotTime } = body;

    // Validate required parameters
    if (!slotDate || !slotTime) {
      return NextResponse.json(
        { success: false, error: 'Missing slot date and time' },
        { status: 400 }
      );
    }

    // Create meeting start time from slot date and time
    const [hours, minutes] = slotTime.split(':').map(Number);
    const startTime = new Date(slotDate);
    startTime.setHours(hours, minutes, 0, 0);

    // Validate that meeting time is in the future
    if (startTime <= new Date()) {
      return NextResponse.json(
        { success: false, error: 'Slot time must be in the future' },
        { status: 400 }
      );
    }

    // Create Zoom meeting with actual slot time
    const { meeting, password } = await createZoomMeeting(
      `Therapy Session - ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}`,
      40,
      startTime
    );

    const response = {
      success: true,
      meetingId: meeting.id,
      meetingUuid: meeting.uuid,
      meetLink: meeting.join_url,
      password: password,
      duration: meeting.duration,
      startTime: meeting.start_time,
    };

    console.log('Sending Zoom response:', response);

    return NextResponse.json(response);
  } catch (error) {
    console.error('Zoom API error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create Zoom meeting';
    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      },
      { status: 500 }
    );
  }
}
