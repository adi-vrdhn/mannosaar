'use server';

import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ bookingId: string }> }
) {
  const session = await auth();

  if (!session?.user?.email || !session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bookingId } = await params;
    const { payment_status } = await request.json();

    // Validate payment status
    const validStatuses = ['pending', 'paid', 'refunded'];
    if (!validStatuses.includes(payment_status)) {
      return NextResponse.json(
        { error: 'Invalid payment status' },
        { status: 400 }
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Verify user is admin
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userData?.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden - Admin only' }, { status: 403 });
    }

    // Update payment status
    const { data: booking, error } = await supabase
      .from('bookings')
      .update({ payment_status })
      .eq('id', bookingId)
      .select()
      .single();

    if (error || !booking) {
      return NextResponse.json({ error: 'Failed to update booking' }, { status: 400 });
    }

    console.log('✅ Payment status updated:', { bookingId, payment_status });

    return NextResponse.json({
      message: 'Payment status updated successfully',
      booking: {
        id: booking.id,
        payment_status: booking.payment_status,
      },
    });
  } catch (error) {
    console.error('❌ Update payment status error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment status' },
      { status: 500 }
    );
  }
}
