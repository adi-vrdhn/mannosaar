import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createClient } from '@/lib/supabase/client';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Fetch user's WhatsApp number
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('whatsapp_number')
      .eq('id', session.user.id)
      .single();

    if (error) {
      console.error('Error fetching WhatsApp number:', error);
      return NextResponse.json({ whatsapp_number: null });
    }

    return NextResponse.json({ whatsapp_number: profile?.whatsapp_number || null });
  } catch (error) {
    console.error('Error in GET /api/user/whatsapp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { whatsapp_number } = body;

    // Validate phone number format (basic validation)
    if (whatsapp_number && !/^\+?[1-9]\d{1,14}$/.test(whatsapp_number.replace(/\D/g, ''))) {
      return NextResponse.json(
        { error: 'Invalid phone number format. Use E.164 format (e.g., +1234567890)' },
        { status: 400 }
      );
    }

    const supabase = createClient();

    // Update or insert WhatsApp number
    const { error } = await supabase
      .from('profiles')
      .update({ whatsapp_number: whatsapp_number || null })
      .eq('id', session.user.id);

    if (error) {
      console.error('Error updating WhatsApp number:', error);
      return NextResponse.json(
        { error: 'Failed to update WhatsApp number' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'WhatsApp number updated successfully',
      whatsapp_number: whatsapp_number || null,
    });
  } catch (error) {
    console.error('Error in POST /api/user/whatsapp:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
