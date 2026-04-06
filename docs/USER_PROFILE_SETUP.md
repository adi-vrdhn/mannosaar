# User Profile & Phone Number Setup Guide

## 📋 Overview
This guide explains how to set up the user profile system with phone number support that's now required for booking sessions.

## 🔧 Database Changes Required

### 1. Add `phone_number` Column to `users` Table

If you're using Supabase, you need to add a `phone_number` column to your `users` table:

#### Option A: Via Supabase Dashboard
1. Go to Supabase Dashboard → Select your project
2. Click on "SQL Editor"
3. Create a new query
4. Run this SQL:

```sql
-- Add phone_number column if it doesn't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;

-- Add updated_at column if it doesn't exist (for tracking updates)
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Create an index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
```

#### Option B: Via SQL Migration File
Create a new file: `supabase/migrations/[timestamp]_add_phone_number.sql`

```sql
-- Migration: Add phone_number to users table
-- Description: Adds phone number field for user contact and notifications

BEGIN;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone_number ON users(phone_number);

-- Update existing users to have updated_at timestamp
UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL;

COMMIT;
```

### 2. Verify the Column Exists
In Supabase dashboard:
1. Go to SQL Editor
2. Run this query to verify:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

You should see:
- `phone_number` (text, nullable)
- `updated_at` (timestamp with time zone, nullable)

## 🚀 How It Works

### User Profile Page (`/profile`)

The profile page now includes:

1. **Profile Information Display**
   - Name (from Google OAuth or editable)
   - Email (read-only, from Google OAuth)
   - Phone Number (required for bookings)

2. **Edit Profile Feature**
   - Users can click "Edit Profile" button
   - Modal form appears
   - Update name and phone number
   - Validation: Phone must have at least 10 digits
   - Success message on save

3. **My Bookings**
   - Upcoming Sessions: Shows next scheduled sessions
   - Past Sessions: Shows completed sessions
   - Each booking shows:
     - Session Type (personal/couple)
     - Date & Time
     - Duration
     - Status (Confirmed/Cancelled/Completed)
     - Meeting Link (for upcoming sessions)
     - Booking ID

### Booking Confirmation (`/appointment/confirm`)

When confirming a booking:

1. **Phone Number Check**
   - System checks if user has phone number
   - If missing: Shows modal to add phone number
   - User must add phone before proceeding
   - Phone stored in `users` table

2. **Booking Creation**
   - Creates booking record with:
     - `user_id` (from session)
     - `slot_id` (selected slot)
     - `session_type` (personal/couple)
     - `status` (confirmed)
     - `created_at` (timestamp)

3. **Success**
   - Booking appears in user profile
   - Email sent to user and therapist
   - Booking appears in admin analytics

## 📱 API Endpoints

### Get/Update User Profile
**GET** `/api/user/update-profile`
- Returns current user profile
- Response: `{ id, name, email, phone_number }`

**POST** `/api/user/update-profile`
- Updates user profile
- Body: `{ name, phone_number }`
- Validation:
  - Name: Required, non-empty
  - Phone: Required, min 10 digits
- Response: `{ success: true, user: {...} }`

## 🧪 Testing the Feature

### Test 1: Add Phone Number to Existing User
1. Go to `/profile`
2. Click "Edit Profile"
3. Enter phone number (e.g., +91 98765 43210)
4. Click "Save Changes"
5. ✅ Should see success message
6. Phone number should display in profile

### Test 2: Ensure Phone Required for Booking
1. Create new account (or clear phone number from test user)
2. Start booking process
3. Go to `/appointment/type` → Select type → Select slot
4. On confirmation page, should see phone modal
5. Cannot proceed without phone number
6. ✅ Enter phone → Can complete booking

### Test 3: Booking Appears in Profile
1. User books session successfully
2. Go to `/profile`
3. Click "Upcoming Sessions" tab
4. ✅ Should see newly booked session with:
   - Session type
   - Date & time
   - Duration
   - Status
   - Meeting link (if available)

### Test 4: Past Sessions Filter
1. Manually update booking date to past (for testing)
2. Go to `/profile`
3. Click "Past Sessions" tab
4. ✅ Should see past session there

## 🔐 Security Notes

1. **Phone Number Validation**
   - Server-side validation on all endpoints
   - Minimum 10 digits enforced
   - Invalid formats rejected

2. **User Data Protection**
   - Users can only edit their own profile
   - Email is read-only (from Google OAuth)
   - Phone numbers not shared with other users

3. **Privacy**
   - Phone number not displayed to other users
   - Only used for booking confirmations and session reminders

## 📧 Email Integration

When a booking is confirmed:

1. **Client Email**
   - Confirmation of booking
   - Session details
   - Meeting link
   - Sent to: user's email

2. **Therapist Email**
   - Notification of new booking
   - Client details
   - Session information
   - Sent to: therapist's email (from slot.therapist_id)

## 🎯 Next Steps

### Immediate
1. Run database migration (see above)
2. Test user profile with phone number
3. Test booking with phone validation

### Soon
1. Add SMS reminders (Twilio)
2. Add payment integration
3. Add session feedback/ratings
4. Add recurring bookings

### Future
1. Google Calendar sync enhancements
2. Zoom integration for video sessions
3. Therapist availability calendar
4. Client session history analytics

## 📚 Related Files

- `src/app/profile/page.tsx` - User profile page
- `src/app/api/user/update-profile/route.ts` - User profile API
- `src/components/booking/BookingConfirmation.tsx` - Booking confirmation
- `src/lib/auth.ts` - Authentication and user creation
- `src/lib/bookings.ts` - Booking operations

## ❓ Troubleshooting

### Issue: "Column phone_number does not exist"
**Solution**: Run the SQL migration above to add the column

### Issue: Phone modal appears repeatedly
**Solution**: 
- Clear browser cache
- Ensure phone_number is saved correctly
- Check browser console for errors

### Issue: Booking not appearing in profile
**Solution**:
- Verify booking was created (check admin bookings)
- Check user_id matches in bookings table
- Refresh page or clear cache
- Check browser console for JS errors

### Issue: Email not sending
**Solution**:
- Check .env.local has EMAIL_USER and EMAIL_PASSWORD
- Verify email credentials are correct
- Check server logs for ERROR messages
- Run `npm run test:email` to verify setup

## 📞 Support

For issues or questions:
1. Check browser console for error messages
2. Check server logs: `npm run dev`
3. Review email test guide: `README_EMAIL.md`
4. Check database: Supabase dashboard SQL editor
