import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/client';
import { sendSessionReminderWhatsApp } from '@/lib/whatsapp';

/**
 * Sends WhatsApp reminders for sessions happening in the next 24-48 hours
 * This can be called by a cron job
 */
export async function POST(request: NextRequest) {
  try {
    // Verify request is from authorized source (cron job or internal)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient();

    // Get all bookings happening in 24 hours that haven't been reminded
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(
        `
        id,
        slot_date,
        slot_start_time,
        slot_end_time,
        session_type,
        user_id,
        therapist_id,
        meeting_link,
        profiles!bookings_user_id_fkey(id, name, email, whatsapp_number),
        therapist:profiles!bookings_therapist_id_fkey(id, name, email)
      `
      )
      .gte('slot_date', now.toISOString().split('T')[0])
      .lte('slot_date', in24Hours.toISOString().split('T')[0])
      .eq('status', 'confirmed')
      .is('reminder_sent_at', null);

    if (error) {
      console.error('Error fetching bookings for reminder:', error);
      return NextResponse.json(
        { error: 'Failed to fetch bookings' },
        { status: 500 }
      );
    }

    if (!bookings || bookings.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No bookings to remind',
        remindersSent: 0,
      });
    }

    const results = [];

    for (const booking of bookings) {
      try {
        const userProfile = booking.profiles as any;
        const therapistProfile = booking.therapist as any;

        // Check if user has WhatsApp number linked
        if (!userProfile?.whatsapp_number) {
          console.log(`⚠️ User ${booking.user_id} has no WhatsApp number linked`);
          continue;
        }

        const sessionDate = new Date(`${booking.slot_date}T${booking.slot_start_time}`);
        const hoursUntil = Math.round((sessionDate.getTime() - now.getTime()) / (1000 * 60 * 60));

        // Only send if within 24-48 hours
        if (hoursUntil < 12 || hoursUntil > 48) {
          console.log(`⏭️  Skipping reminder for booking ${booking.id} - ${hoursUntil} hours away`);
          continue;
        }

        const result = await sendSessionReminderWhatsApp({
          toPhoneNumber: userProfile.whatsapp_number,
          clientName: userProfile.name,
          therapistName: therapistProfile?.name || 'Your Therapist',
          date: booking.slot_date,
          startTime: booking.slot_start_time,
          endTime: booking.slot_end_time,
          meetingLink: booking.meeting_link || undefined,
          sessionType: booking.session_type || 'Therapy Session',
          hoursUntil,
        });

        if (result.success) {
          // Mark reminder as sent
          const { error: updateError } = await supabase
            .from('bookings')
            .update({ reminder_sent_at: new Date().toISOString() })
            .eq('id', booking.id);

          if (updateError) {
            console.error(`Error marking reminder as sent for booking ${booking.id}:`, updateError);
          }

          results.push({
            bookingId: booking.id,
            success: true,
            messageSid: result.messageSid,
          });
        } else {
          results.push({
            bookingId: booking.id,
            success: false,
            error: result.error,
          });
        }
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        results.push({
          bookingId: booking.id,
          success: false,
          error: (error as Error).message,
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      success: true,
      remindersSent: successCount,
      totalProcessed: results.length,
      results,
    });
  } catch (error) {
    console.error('Error in POST /api/bookings/send-reminders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
