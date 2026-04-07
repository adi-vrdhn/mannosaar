# WhatsApp Integration Setup Guide

## 📋 Overview

Your therapy booking platform now supports WhatsApp notifications for:
- ✅ **Session Booking Confirmation** - Sent immediately after booking
- ✅ **Session Reminders** - Sent 24 hours before appointment
- ✅ **Reschedule Notifications** - Sent when session is rescheduled
- ✅ **Cancellation Alerts** - Sent when session is cancelled

---

## 📦 What's Been Created

### 1. Backend Services
- **`src/lib/whatsapp.ts`** - Core WhatsApp messaging functions
  - `sendBookingConfirmationWhatsApp()` - Booking confirmation
  - `sendSessionReminderWhatsApp()` - 24-hour reminder
  - `sendRescheduleNotificationWhatsApp()` - Reschedule notification
  - `sendCancellationNotificationWhatsApp()` - Cancellation alert

### 2. API Endpoints
- **`/api/user/whatsapp`** (GET/POST)
  - GET: Fetch user's WhatsApp number
  - POST: Save/update WhatsApp number
  
- **`/api/bookings/send-reminders`** (POST)
  - Retrieve bookings with 24-hour window
  - Send reminders to users with WhatsApp linked
  - Mark reminders as sent

### 3. Database Migrations
- **`scripts/migrations/add-whatsapp.sql`**
  - Adds `whatsapp_number` column to `profiles` table
  - Adds `reminder_sent_at` column to `bookings` table
  - Creates indexes for faster queries

### 4. User Interface
- **Profile Edit Modal**
  - New WhatsApp field (optional)
  - E.164 format validation
  - Clear instructions for user

### 5. Integration Guide
- **`src/lib/whatsapp-integration.ts`** - Examples and best practices

---

## 🚀 Step-by-Step Setup

### Step 1: Set Up Twilio Account

1. **Create Twilio Account**
   - Go to https://www.twilio.com/try-twilio
   - Sign up with your email
   - Verify your email and phone number

2. **Get WhatsApp Credentials**
   - In Twilio Console, go to **Messaging → Channels → WhatsApp**
   - Select "Try WhatsApp"
   - Accept sandbox invitation via WhatsApp
   - Copy your **Twilio Phone Number** (format: +1234567890)

3. **Get API Credentials**
   - Go to **Account** in Twilio Console
   - Copy **Account SID** and **Auth Token**

### Step 2: Update Database Schema

**In Supabase:**

1. Go to SQL Editor
2. Run the migration:
   ```sql
   -- Add whatsapp_number column to profiles table
   ALTER TABLE profiles
   ADD COLUMN IF NOT EXISTS whatsapp_number VARCHAR(20);

   -- Add reminder_sent_at column to bookings table
   ALTER TABLE bookings
   ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMP;

   -- Create indexes
   CREATE INDEX IF NOT EXISTS idx_bookings_reminder_sent ON bookings(reminder_sent_at);
   CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON profiles(whatsapp_number);
   ```

### Step 3: Add Environment Variables

**In `.env.local`:**

```bash
# Twilio WhatsApp Credentials
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_WHATSAPP_NUMBER=+1xxxxxxxxxx

# For scheduling reminders
CRON_SECRET=your_random_secret_key_here
```

**In Vercel (if deploying):**
1. Go to Project Settings → Environment Variables
2. Add the same 3 variables
3. Redeploy your project

### Step 4: Install Twilio Package

If not already installed:
```bash
npm install twilio
```

### Step 5: Enable WhatsApp in Your Booking APIs

Now integrate WhatsApp sending into your existing booking endpoints.

#### A. **After Booking Creation** (`/api/bookings/create`)

```typescript
import { integrateBookingConfirmationWhatsApp } from '@/lib/whatsapp-integration';

// ... After creating booking in database ...

// Fetch user with WhatsApp number
const { data: userProfile } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single();

// Send WhatsApp confirmation (don't fail booking if WhatsApp fails)
if (userProfile?.whatsapp_number) {
  await integrateBookingConfirmationWhatsApp({
    user: { 
      id: userId, 
      name: session.user.name,
      email: session.user.email,
      whatsapp_number: userProfile.whatsapp_number 
    },
    therapist: { 
      id: therapistId, 
      name: therapistName, 
      email: therapistEmail 
    },
    session_type: booking.session_type,
    slot_date: booking.slot_date,
    slot_start_time: booking.slot_start_time,
    slot_end_time: booking.slot_end_time,
    meeting_link: booking.meeting_link,
  }).catch(err => console.error('WhatsApp error:', err));
}
```

#### B. **After Rescheduling** (`/api/bookings/reschedule`)

```typescript
import { integrateRescheduleNotificationWhatsApp } from '@/lib/whatsapp-integration';

// ... After updating booking dates ...

if (userProfile?.whatsapp_number) {
  await integrateRescheduleNotificationWhatsApp({
    user: { 
      id: userId, 
      name: userProfile.name, 
      email: userProfile.email,
      whatsapp_number: userProfile.whatsapp_number 
    },
    therapist: { 
      id: therapistId, 
      name: therapistName 
    },
    session_type: booking.session_type,
    old_slot_date: oldBooking.slot_date,
    old_slot_start_time: oldBooking.slot_start_time,
    old_slot_end_time: oldBooking.slot_end_time,
    new_slot_date: newBooking.slot_date,
    new_slot_start_time: newBooking.slot_start_time,
    new_slot_end_time: newBooking.slot_end_time,
    new_meeting_link: newBooking.meeting_link,
  }).catch(err => console.error('WhatsApp error:', err));
}
```

#### C. **On Cancellation**

```typescript
import { integrateCancellationNotificationWhatsApp } from '@/lib/whatsapp-integration';

// ... After cancelling booking ...

await integrateCancellationNotificationWhatsApp(
  userProfile.whatsapp_number,
  userProfile.name,
  booking.slot_date,
  booking.slot_start_time
).catch(err => console.error('WhatsApp error:', err));
```

### Step 6: Set Up Automated Reminders

**Option A: Vercel Cron (Recommended)**

1. Create `vercel.json` in project root:
```json
{
  "crons": [{
    "path": "/api/bookings/send-reminders",
    "schedule": "0 9 * * *"
  }]
}
```

2. This runs the reminder endpoint daily at 9 AM UTC

**Option B: External Scheduler** (AWS Lambda, Google Cloud, etc.)

Set up a scheduled POST request to:
```
https://your-domain.com/api/bookings/send-reminders
Headers: Authorization: Bearer <CRON_SECRET>
```

---

## 📱 User Flow

### For Users:
1. User signs up and creates profile
2. Goes to **Profile → Edit Profile**
3. Adds WhatsApp number (optional) in E.164 format
   - Example: `+1 (234) 567-8900` → `+12345678900`
4. Saves profile
5. **WhatsApp messages now enabled for this user** ✅

### For Your Platform:
1. When booking created → WhatsApp confirmation sent
2. 24 hours before session → Reminder sent
3. When rescheduled → Notification sent
4. If cancelled → Cancellation alert sent

---

## ✅ Testing

### 1. **Test WhatsApp Connection**

Create a test file `/test-whatsapp.ts`:

```typescript
import { sendBookingConfirmationWhatsApp } from '@/src/lib/whatsapp';

const result = await sendBookingConfirmationWhatsApp({
  toPhoneNumber: '+1234567890', // Your test number
  clientName: 'Test User',
  therapistName: 'Test Therapist',
  date: new Date().toISOString(),
  startTime: '10:00 AM',
  endTime: '11:00 AM',
  sessionType: 'Consultation',
});

console.log('Test result:', result);
```

Run: `npx ts-node test-whatsapp.ts`

### 2. **Test Reminder Endpoint**

```bash
curl -X POST http://localhost:3000/api/bookings/send-reminders \
  -H "Authorization: Bearer your_cron_secret" \
  -H "Content-Type: application/json"
```

### 3. **Check Message Logs**

- **Server logs** show WhatsApp message details
- **Twilio Console → Programmable Messaging** shows delivery status
- Check `reminder_sent_at` in database to see which reminders were sent

---

## 📊 Message Templates

### Booking Confirmation
```
✅ *Booking Confirmed!*

Hi [Client Name],

Your Therapy Session session is confirmed:

📅 Date: Mon, Apr 7, 2026
⏰ Time: 10:00 AM - 11:00 AM
👤 Therapist: [Therapist Name]

🎥 Meeting Link: [Google Meet Link]

If you need to reschedule or cancel, visit your profile on the platform.
```

### Session Reminder
```
⏰ *Session Reminder!*

Hi [Client Name],

Reminder: Your Therapy Session session is in approximately 24 hours.

📅 Date: Monday, April 7, 2026
⏰ Time: 10:00 AM - 11:00 AM
👤 Therapist: [Therapist Name]

🎥 Join here: [Google Meet Link]

Make sure you're in a quiet, comfortable space for the session.
```

### Reschedule Notification
```
🔄 *Session Rescheduled!*

Hi [Client Name],

Your Therapy Session session has been rescheduled.

❌ Old Time:
📅 Mon, Apr 5 at 10:00 AM - 11:00 AM

✅ New Time:
📅 Mon, Apr 12 at 2:00 PM - 3:00 PM
👤 Therapist: [Therapist Name]

🎥 Meeting Link: [Google Meet Link]

Please confirm you received this update.
```

---

## 🚨 Troubleshooting

### "Message failed to send"
- ✅ Check Twilio credentials in `.env.local`
- ✅ Verify WhatsApp number has country code
- ✅ Check Twilio account balance (sandbox is free)
- ✅ Verify number is added to WhatsApp sandbox

### "Unauthorized" on reminder endpoint
- ✅ Check `CRON_SECRET` matches Authorization header
- ✅ Format: `Authorization: Bearer your_secret`

### User not receiving messages
- ✅ Verify WhatsApp number format: `+1234567890`
- ✅ Check user has WhatsApp installed
- ✅ Verify user added Twilio number as contact
- ✅ Check message was sent (view Twilio logs)

### Messages not marking as sent
- ✅ Verify `reminder_sent_at` column exists
- ✅ Check database permissions
- ✅ Review server logs for Supabase errors

---

## 🔄 From Test to Production

### When Ready for Production:

1. **Request WhatsApp Business Number**
   - In Twilio Console → Programmable Messaging
   - Request approval (takes 1-2 days)
   - Once approved, update `TWILIO_WHATSAPP_NUMBER`

2. **Increase Rate Limits**
   - Default: 60 messages/hour
   - Request increase in Twilio Console

3. **Monitor Delivery**
   - Set up alerts in Twilio
   - Monitor message failure rates
   - Review user feedback

4. **Compliance**
   - Ensure opt-in consent from users
   - Provide opt-out mechanism
   - Include privacy disclaimers

---

## 📞 Support

For issues:
1. Check [Twilio WhatsApp Docs](https://www.twilio.com/docs/whatsapp)
2. Review Twilio logs in Console
3. Check server error logs
4. Verify database migrations ran successfully

---

## ✨ Features Enabled

✅ Automatic WhatsApp confirmation on booking  
✅ 24-hour reminder before session  
✅ Reschedule notifications  
✅ Cancellation alerts  
✅ Optional user preference (can disable in profile)  
✅ E.164 phone validation  
✅ Database tracking (reminder_sent_at)  
✅ Error handling (doesn't fail bookings)  
✅ Server logging for debugging  

---

**Last Updated:** April 7, 2026  
**Version:** 1.0.0
