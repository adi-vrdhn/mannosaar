import { therapistSlotIds } from '@/lib/bookings/access';
import { auth } from '@/lib/auth';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';
import { splitBookingNotes } from '@/lib/booking-notes';

export async function GET(request: Request) {
  try {
    const session = await auth();
    const url = new URL(request.url);
    const includeAllStatuses = url.searchParams.get('status') === 'all';

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Use service role to fetch bookings (bypass RLS)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user details (including role)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('id, role')
      .eq('email', session.user.email)
      .single();

    if (userError || !userData) {
      console.error('User not found:', userError);
      return NextResponse.json({ bookings: [], error: 'User not found' }, { status: 200 });
    }

    console.log('🔍 Fetching bookings for user:', userData.id, 'role:', userData.role);

    let query = supabase
      .from('bookings')
      .select('*')
      // A legacy reschedule could leave a second row behind. Keep that
      // recoverable for payment/audit purposes, but never present it as an
      // active appointment to the client or therapist.
      .neq('status', 'superseded')
      .order('slot_date', { ascending: false, nullsFirst: false });

    // If user is NOT admin/therapist, only show their own bookings
    if (userData.role !== 'admin' && userData.role !== 'therapist') {
      query = query.eq('user_id', userData.id);
      query = query.eq('status', 'confirmed');
      console.log('👤 User role - showing only own bookings');
    } else {
      if (!includeAllStatuses) {
        query = query.eq('status', 'confirmed');
      }
      console.log('👨‍💼 Admin/Therapist role - showing all client bookings');
    }

    if (userData.role === 'therapist') query = query.in('slot_id', await therapistSlotIds(userData.id));

    const { data: bookings, error: bookingsError } = await query;

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
      return NextResponse.json({
        bookings: [],
        error: bookingsError.message,
      }, { status: 200 });
    }

    const visibleBookings = (bookings || []).filter((booking) => {
      const sessionDates = Array.isArray(booking.session_dates) ? booking.session_dates : [];
      return !sessionDates.some((sessionDate: unknown) =>
        sessionDate && typeof sessionDate === 'object' && 'superseded_by_booking_id' in sessionDate
      );
    });

    console.log('✅ Bookings fetched:', {
      count: visibleBookings.length,
      role: userData.role,
      bookings: visibleBookings.map(b => ({ id: b.id, user_id: b.user_id, slot_date: b.slot_date, status: b.status }))
    });

    const bookingIds = visibleBookings.map(booking => booking.id);
    const paymentByBooking = new Map<string, {
      provider: string;
      method: string | null;
      app: string | null;
      amount: number | null;
      amountSource: 'recorded' | 'checkout' | 'current_price' | 'unavailable';
      currency: string;
      status: string;
      paidAt: string | null;
      reference: string | null;
    }>();
    const checkoutAmountByReference = new Map<string, number>();
    const checkoutMethodByReference = new Map<string, { method: string | null; app: string | null }>();
    const currentPriceByService = new Map<string, number>();

    if (bookingIds.length > 0) {
      const [websitePayments, whatsappPayments, checkoutContexts, prices] = await Promise.all([
        supabase
          .from('payments')
          .select('booking_id,provider,provider_transaction_id,amount,currency,status,created_at,updated_at')
          .in('booking_id', bookingIds),
        supabase
          .from('whatsapp_payments')
          .select('booking_id,provider_id,txnid,amount,currency,status,checkout,created_at,updated_at')
          .in('booking_id', bookingIds),
        supabase
          .from('payu_payment_contexts')
          .select('txnid,context')
          .contains('context', { userId: userData.id }),
        supabase.from('pricing_config').select('session_type,bundle_size,price,currency'),
      ]);

      for (const row of checkoutContexts.data || []) {
        const context = row.context as {
          amount?: number;
          paymentMethod?: string;
          paymentMode?: string;
          providerTransactionId?: string;
          upiAppName?: string | null;
        } | null;
        const references = [row.txnid, context?.providerTransactionId].filter(Boolean) as string[];
        for (const reference of references) {
          if (context?.amount != null) checkoutAmountByReference.set(reference, Number(context.amount));
          checkoutMethodByReference.set(reference, {
            method: context?.paymentMethod || context?.paymentMode || null,
            app: context?.upiAppName || null,
          });
        }
      }
      for (const row of prices.data || []) {
        currentPriceByService.set(`${row.session_type}_${row.bundle_size || 1}`, Number(row.price));
      }

      for (const payment of websitePayments.data || []) {
        if (!payment.booking_id) continue;
        paymentByBooking.set(payment.booking_id, {
          provider: payment.provider || 'Payment provider',
          method: checkoutMethodByReference.get(payment.provider_transaction_id)?.method || null,
          app: checkoutMethodByReference.get(payment.provider_transaction_id)?.app || null,
          amount: payment.amount == null ? null : Number(payment.amount),
          amountSource: 'recorded',
          currency: payment.currency || 'INR',
          status: payment.status || 'UNKNOWN',
          paidAt: payment.updated_at || payment.created_at || null,
          reference: payment.provider_transaction_id
            ? `•••• ${String(payment.provider_transaction_id).slice(-8)}`
            : null,
        });
      }

      for (const payment of whatsappPayments.data || []) {
        if (!payment.booking_id || paymentByBooking.has(payment.booking_id)) continue;
        const reference = payment.provider_id || payment.txnid;
        const checkout = payment.checkout as { paymentMethod?: string; paymentMode?: string; upiAppName?: string } | null;
        paymentByBooking.set(payment.booking_id, {
          provider: 'PayU',
          method: checkout?.paymentMethod || checkout?.paymentMode || 'UPI',
          app: checkout?.upiAppName || 'WhatsApp',
          amount: payment.amount == null ? null : Number(payment.amount),
          amountSource: 'recorded',
          currency: payment.currency || 'INR',
          status: payment.status || 'UNKNOWN',
          paidAt: payment.updated_at || payment.created_at || null,
          reference: reference ? `•••• ${String(reference).slice(-8)}` : null,
        });
      }

      if (websitePayments.error) console.warn('Unable to load website payment details:', websitePayments.error.message);
      if (whatsappPayments.error) console.warn('Unable to load WhatsApp payment details:', whatsappPayments.error.message);
      if (checkoutContexts.error) console.warn('Unable to load checkout payment context:', checkoutContexts.error.message);
      if (prices.error) console.warn('Unable to load pricing fallback:', prices.error.message);
    }

    const bookingsWithPayments = visibleBookings.map(booking => {
      const separatedNotes = splitBookingNotes(booking.notes);
      const checkoutAmount = booking.payment_id ? checkoutAmountByReference.get(booking.payment_id) : undefined;
      const checkoutMethod = booking.payment_id ? checkoutMethodByReference.get(booking.payment_id) : undefined;
      const listedPrice = currentPriceByService.get(`${booking.session_type}_${booking.number_of_sessions || 1}`);
      return {
        ...booking,
        notes: separatedNotes.clientNote,
        therapist_note_for_client:
          booking.therapist_note_for_client || separatedNotes.therapistNoteForClient,
        payment_details: paymentByBooking.get(booking.id) || {
        provider: booking.booking_source === 'WHATSAPP' ? 'PayU' : 'Payment provider',
        method: checkoutMethod?.method || null,
        app: checkoutMethod?.app || (booking.booking_source === 'WHATSAPP' ? 'WhatsApp' : null),
        amount: checkoutAmount ?? listedPrice ?? null,
        amountSource: checkoutAmount != null ? 'checkout' : listedPrice != null ? 'current_price' : 'unavailable',
        currency: 'INR',
        status: booking.payment_status || 'UNKNOWN',
        paidAt: booking.created_at || null,
        reference: booking.payment_id ? `•••• ${String(booking.payment_id).slice(-8)}` : null,
      },
      };
    });

    return NextResponse.json({ 
      bookings: bookingsWithPayments,
      count: visibleBookings.length,
      role: userData.role
    }, { status: 200 });
  } catch (error) {
    console.error('❌ Error in user-bookings API:', error);
    return NextResponse.json(
      { error: 'Internal server error', bookings: [] },
      { status: 500 }
    );
  }
}
