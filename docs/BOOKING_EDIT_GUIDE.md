# Booking Management - Postpone Sessions Feature

## Overview
Admin (therapist) can now postpone/reschedule any confirmed booking. When a booking is postponed, the client receives an email notification with the new session time.

## Features Implemented

### 1. **Booking Edit Interface** 
- "Reschedule Booking" button appears in the booking details modal
- Only visible for confirmed bookings
- Only accessible to admin users

### 2. **Slot Selection**
- Browse 30 days of available time slots
- Radio button selection for easy switching
- Shows date and time for each available slot
- Automatically excludes booked and blocked slots

### 3. **Postponement Note**
- Optional reason field for rescheduling
- Helps client understand why session was moved
- Examples: "Personal emergency", "Schedule conflict"

### 4. **Email Notification**
- Client receives beautifully formatted email when booking is postponed
- Shows:
  - Old session time (strikethrough)
  - New session time (highlighted in green)
  - Reason for postponement (if provided)
  - Therapist name
  - Session type

## How to Use

### Step 1: Access Admin Bookings
1. Go to http://localhost:3000/admin/bookings
2. View all client bookings with dates, times, and status

### Step 2: Open Booking Details
1. Click on a booking to see full details
2. Modal shows:
   - Client name, email, phone
   - Session type (personal/couple)
   - Current date and time
   - Meeting link (if video call)
   - Booking status

### Step 3: Click "Reschedule Booking"
1. Button appears after Session Information section
2. Modal switches to edit mode
3. Shows:
   - Current session time
   - List of available slots for next 30 days
   - Reason field (optional)
   - Update and Cancel buttons

### Step 4: Select New Time Slot
1. Scroll through available slots
2. Click the radio button next to desired slot
3. Slot shows: Date (e.g., "Apr 15, 2026") and Time (e.g., "10:00 - 10:45")

### Step 5: Add Optional Reason
1. Type reason in textarea field
2. Examples:
   - "I have a personal emergency"
   - "Need to reschedule due to unexpected commitment"
   - Leave blank if not needed

### Step 6: Confirm Reschedule
1. Click "Update Booking" button
2. System will:
   - Validate slot is still available
   - Free up the old slot
   - Book the new slot
   - Send email to client
   - Show success message
3. Click "Cancel" to abort changes

### Step 7: Client Gets Email
Client receives email with:
```
📅 Session Rescheduled

Hi [Client Name],

Your therapy session with [Therapist Name] has been rescheduled.

Old Session Time: April 10, 2026 at 3:00 PM - 3:45 PM [strikethrough]
New Session Time: April 15, 2026 at 10:00 AM - 10:45 AM [green highlight]

Reason: [If provided]

Session Type: Personal/Couple
Therapist: [Name]
```

## API Endpoints

### 1. **POST /api/bookings/update**
Reschedule a booking to a new time slot

**Request:**
```json
{
  "bookingId": "uuid",
  "newSlotId": "uuid",
  "reason": "Personal emergency (optional)"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Booking updated and email notification sent to client",
  "booking": {
    "id": "uuid",
    "slot_id": "new_slot_uuid",
    "updated_at": "2024-04-08T10:30:00Z"
  }
}
```

**Authorization:**
- Requires admin authentication
- Only admin users can reschedule bookings

### 2. **GET /api/therapist/available-slots**
Get list of available slots for the next 30 days

**Response:**
```json
{
  "slots": [
    {
      "id": "uuid",
      "date": "2024-04-15",
      "start_time": "10:00:00",
      "end_time": "10:45:00"
    },
    ...
  ]
}
```

**Authorization:**
- Requires admin authentication

## Backend Components

### 1. **Email Function** (`/lib/email.ts`)
- `sendBookingPostponedEmail()` - Sends formatted HTML email to client
- Includes old/new times, reason, and session details
- Handles email sending failures gracefully

### 2. **API Endpoint** (`/api/bookings/update/route.ts`)
- Validates admin authentication
- Checks new slot availability
- Updates therapy_slots table (marks old as available, new as unavailable)
- Updates bookings table with new slot_id
- Sends email notification
- Returns success/error response

### 3. **Available Slots Endpoint** (`/api/therapist/available-slots/route.ts`)
- Returns slots for next 30 days
- Excludes blocked and booked slots
- Sorted by date and time
- Admin-only access

## Frontend Components

### 1. **BookingDetailsModal** (Enhanced)
- Added edit mode state management
- Slot selection with radio buttons
- Reason input textarea
- Loading/error message display
- Smooth transitions between view and edit modes
- Success/error notifications
- Auto-refresh booking details after update

## Database Changes

No new tables required. Uses existing:
- `bookings` table - Updated `slot_id` on reschedule
- `therapy_slots` table - Availability flags updated

## Error Handling

### Possible Errors:
1. **"New slot is not available"**
   - Selected slot was just booked by another user
   - Solution: Refresh and select different slot

2. **"Only admins can update bookings"**
   - Non-admin trying to reschedule
   - Solution: Login as admin/therapist

3. **"Booking not found"**
   - Booking ID doesn't exist
   - Solution: Ensure correct booking is selected

4. **Email sending failed**
   - Not critical - booking update succeeds
   - Email may retry automatically
   - Check email configuration if persistent

## Email Configuration

Emails are sent via Gmail SMTP using:
- `EMAIL_USER` - Gmail address
- `EMAIL_PASSWORD` - Gmail app password

Ensure configured in `.env.local`:
```
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## Testing Checklist

- ✅ Open bookings page
- ✅ Click booking to see details
- ✅ "Reschedule Booking" button visible
- ✅ Click edit - modal switches to edit mode
- ✅ Available slots load (next 30 days)
- ✅ Select a slot
- ✅ Add optional reason
- ✅ Click "Update Booking"
- ✅ Success message appears
- ✅ Check client email for notification
- ✅ Old slot shows as available again
- ✅ New slot shows as booked

## Customization Options

### 1. Change Time Range
Edit `/api/therapist/available-slots/route.ts`:
```typescript
const thirtyDaysLater = addDays(today, 60); // Change to 60 days
```

### 2. Modify Email Template
Edit `sendBookingPostponedEmail()` in `/lib/email.ts`:
- Change colors, styling, wording
- Add therapist contact info
- Include meeting link in email

### 3. Change Form Fields
Edit `BookingDetailsModal.tsx`:
- Add phone number field
- Add notes field
- Add confirmation checkbox

## Known Limitations

1. Cannot edit past bookings (only confirmed ones)
2. Must select from available slots only
3. Cannot edit session type (personal ↔ couple)
4. Cannot edit payment for rescheduled session
5. Email sending won't block booking update if it fails

## Future Enhancements

- [ ] Bulk reschedule multiple bookings
- [ ] Cancel with refund option
- [ ] Client self-reschedule option
- [ ] SMS notification option
- [ ] Calendar invitation in email
- [ ] Automated conflict detection
- [ ] Waitlist for popular time slots
