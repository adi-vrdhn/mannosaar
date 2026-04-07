/**
 * INTEGRATION GUIDE: WhatsApp Booking Messages
 * 
 * This file shows how to integrate WhatsApp message sending with your existing booking APIs.
 * Add these integrations to your booking confirmation and rescheduling endpoints.
 */

import {
  sendBookingConfirmationWhatsApp,
  sendRescheduleNotificationWhatsApp,
  sendCancellationNotificationWhatsApp,
} from '@/lib/whatsapp';

/**
 * Example: Send WhatsApp confirmation after booking is created
 * Add this to your booking creation endpoint (/api/bookings/create or similar)
 */
export async function integrateBookingConfirmationWhatsApp(
  bookingData: {
    user: { id: string; name: string; email: string; phone_number?: string; whatsapp_number?: string };
    therapist: { id: string; name: string; email: string };
    session_type: string;
    slot_date: string;
    slot_start_time: string;
    slot_end_time: string;
    meeting_link?: string;
  }
) {
  // Only send WhatsApp if user has WhatsApp number linked
  if (!bookingData.user.whatsapp_number) {
    console.log(`⚠️ User ${bookingData.user.id} has no WhatsApp number. Email will be sent instead.`);
    return { success: false, reason: 'No WhatsApp number linked' };
  }

  try {
    const result = await sendBookingConfirmationWhatsApp({
      toPhoneNumber: bookingData.user.whatsapp_number,
      clientName: bookingData.user.name,
      therapistName: bookingData.therapist.name,
      date: bookingData.slot_date,
      startTime: bookingData.slot_start_time,
      endTime: bookingData.slot_end_time,
      meetingLink: bookingData.meeting_link,
      sessionType: bookingData.session_type,
    });

    if (result.success) {
      console.log(`✅ WhatsApp confirmation sent to ${bookingData.user.whatsapp_number}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending WhatsApp confirmation:', error);
    return { success: false, error };
  }
}

/**
 * Example: Send WhatsApp notification after rescheduling
 * Add this to your reschedule endpoint (/api/bookings/reschedule)
 */
export async function integrateRescheduleNotificationWhatsApp(
  bookingData: {
    user: { id: string; name: string; email: string; whatsapp_number?: string };
    therapist: { id: string; name: string };
    session_type: string;
    old_slot_date: string;
    old_slot_start_time: string;
    old_slot_end_time: string;
    new_slot_date: string;
    new_slot_start_time: string;
    new_slot_end_time: string;
    new_meeting_link?: string;
  }
) {
  if (!bookingData.user.whatsapp_number) {
    console.log(`⚠️ User ${bookingData.user.id} has no WhatsApp number.`);
    return { success: false, reason: 'No WhatsApp number linked' };
  }

  try {
    const result = await sendRescheduleNotificationWhatsApp({
      toPhoneNumber: bookingData.user.whatsapp_number,
      clientName: bookingData.user.name,
      therapistName: bookingData.therapist.name,
      date: bookingData.new_slot_date,
      startTime: bookingData.new_slot_start_time,
      endTime: bookingData.new_slot_end_time,
      oldDate: bookingData.old_slot_date,
      oldStartTime: bookingData.old_slot_start_time,
      oldEndTime: bookingData.old_slot_end_time,
      meetingLink: bookingData.new_meeting_link,
      sessionType: bookingData.session_type,
    });

    if (result.success) {
      console.log(`✅ Reschedule notification sent to ${bookingData.user.whatsapp_number}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending reschedule notification:', error);
    return { success: false, error };
  }
}

/**
 * Example: Send WhatsApp cancellation notification
 * Add this to your booking cancellation endpoint
 */
export async function integrateCancellationNotificationWhatsApp(
  userPhoneNumber: string,
  userName: string,
  sessionDate: string,
  sessionStartTime: string
) {
  if (!userPhoneNumber) {
    console.log(`⚠️ No WhatsApp number available.`);
    return { success: false, reason: 'No WhatsApp number provided' };
  }

  try {
    const result = await sendCancellationNotificationWhatsApp(
      userPhoneNumber,
      userName,
      sessionDate,
      sessionStartTime
    );

    if (result.success) {
      console.log(`✅ Cancellation notification sent to ${userPhoneNumber}`);
    }

    return result;
  } catch (error) {
    console.error('Error sending cancellation notification:', error);
    return { success: false, error };
  }
}

/**
 * SETUP INSTRUCTIONS:
 *
 * 1. TWILIO ACCOUNT SETUP:
 *    - Sign up at https://www.twilio.com
 *    - Get WhatsApp Sandbox or approved business number
 *    - Copy your Account SID and Auth Token
 *
 * 2. ENVIRONMENT VARIABLES (add to .env.local):
 *    TWILIO_ACCOUNT_SID=<your_account_sid>
 *    TWILIO_AUTH_TOKEN=<your_auth_token>
 *    TWILIO_WHATSAPP_NUMBER=+<your_whatsapp_number>
 *    CRON_SECRET=<random_secret_for_reminders>
 *
 * 3. DATABASE MIGRATION (run this in Supabase):
 *    Already created in /scripts/migrations/add-whatsapp.sql
 *    - Adds 'whatsapp_number' column to profiles table
 *    - Adds 'reminder_sent_at' column to bookings table
 *
 * 4. INTEGRATION POINTS:
 *    A. After booking creation:
 *       - Fetch user WhatsApp number from profiles
 *       - Call integrateBookingConfirmationWhatsApp()
 *       - Log result, don't fail booking on WhatsApp error
 *
 *    B. After rescheduling:
 *       - Call integrateRescheduleNotificationWhatsApp()
 *       - Include old and new session times
 *
 *    C. On cancellation:
 *       - Call integrateCancellationNotificationWhatsApp()
 *
 *    D. SCHEDULED REMINDERS (24 hours before):
 *       - Set up Vercel Cron: POST /api/bookings/send-reminders
 *       - Or use external service (AWS Lambda, Google Cloud Scheduler)
 *
 * 5. USER PROFILE:
 *    - Users can add/update WhatsApp in Profile > Edit Profile
 *    - Optional field with E.164 format validation
 *    - API: POST /api/user/whatsapp with { whatsapp_number }
 *
 * 6. EXAMPLE BOOK CREATION CODE:
 *    ```typescript
 *    // After saving booking to database
 *    const booking = await supabase.from('bookings').insert([...]).select().single();
 *    
 *    // Get user details with WhatsApp number
 *    const user = await supabase.from('profiles')
 *      .select('*').eq('id', userId).single();
 *    
 *    // Send WhatsApp confirmation
 *    if (user.whatsapp_number) {
 *      await integrateBookingConfirmationWhatsApp({
 *        user: { ...session.user, whatsapp_number: user.whatsapp_number },
 *        therapist: { id: therapistId, name: therapistName, email: therapistEmail },
 *        session_type: booking.session_type,
 *        slot_date: booking.slot_date,
 *        slot_start_time: booking.slot_start_time,
 *        slot_end_time: booking.slot_end_time,
 *        meeting_link: booking.meeting_link,
 *      });
 *    }
 *    ```
 *
 * 7. TESTING:
 *    - Use Twilio test credentials initially
 *    - Test with sandbox WhatsApp number
 *    - Check /api/bookings/send-reminders endpoint manually
 *    - Monitor server logs for WhatsApp message status
 *
 * 8. PRODUCTION:
 *    - Request WhatsApp Business number from Twilio
 *    - Update TWILIO_WHATSAPP_NUMBER in production env
 *    - Set up cron job for reminders (daily at specific time)
 *    - Monitor message delivery rates
 */
