import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { isSameOrigin, requestIp } from '@/lib/compliance';
import { writeAudit } from '@/lib/compliance-server';
import { sendPrivacyRequestAcknowledgementEmail } from '@/lib/email';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    if (!isSameOrigin(request)) return NextResponse.json({ error: 'Invalid request origin' }, { status: 403 });

    // Get user ID from email
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData?.id) {
      console.error('Error finding user:', userError);
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const { data: existing } = await supabase.from('privacy_requests').select('id').eq('user_id', userData.id).eq('request_type', 'DELETION').in('status', ['SUBMITTED','UNDER_REVIEW','APPROVED']).limit(1);
    if (existing?.length) return NextResponse.json({ success: true, message: 'Your deletion request is already under review.' }, { status: 202 });
    const { data: privacyRequest, error: requestError } = await supabase.from('privacy_requests').insert({ user_id: userData.id, request_type: 'DELETION', details: 'Submitted from account deletion control.' }).select('id').single();
    if (requestError || !privacyRequest) {
      console.error('Error creating deletion request:', requestError);
      return NextResponse.json(
        { error: 'Failed to submit deletion request' },
        { status: 500 }
      );
    }
    await writeAudit({ userId: userData.id, actorRole: session.user.role || 'user', action: 'PRIVACY_REQUEST_SUBMITTED', resourceType: 'privacy_request', resourceId: privacyRequest.id, ipAddress: requestIp(request.headers), metadata: { requestType: 'DELETION' } });
    await sendPrivacyRequestAcknowledgementEmail({
      clientEmail: session.user.email,
      clientName: session.user.name || 'Client',
      requestType: 'DELETION',
      requestId: privacyRequest.id,
    });

    return NextResponse.json({
      success: true,
      message: 'Deletion request submitted for review. Your account has not been immediately deleted because some records may need to be retained.',
    }, { status: 202 });
  } catch (error) {
    console.error('Error in delete profile endpoint:', error);
    return NextResponse.json(
      { error: 'An error occurred while deleting profile' },
      { status: 500 }
    );
  }
}
