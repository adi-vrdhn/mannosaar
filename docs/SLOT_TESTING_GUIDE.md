# Slot Management - Quick Testing Guide

## 🧪 Test Scenario 1: Book a Slot (Client View)

**Goal:** Verify booked slots disappear from available slots

### Steps:
1. **Open browser (user profile):**
   - Go to http://localhost:3000/appointment/slots
   - Select a future date (e.g., April 10, 2026)

2. **View available slots:**
   - You should see multiple green slots (9:00, 10:00, 11:00, etc.)
   - Each slot should show "40 minutes"

3. **Book a slot:**
   - Click "Book" on "9:00 AM - 9:40 AM" slot
   - Complete the booking process
   - See confirmation

4. **Refresh and check again:**
   - Go back to `/appointment/slots`
   - Select same date (April 10)
   - **EXPECTED:** 9:00 AM slot is GONE ❌ (should not appear)
   - Other slots still available ✅

5. **Check other users:**
   - Open private/incognito window
   - Go to `/appointment/slots`
   - Same slot should also be GONE for them too ✅

---

## 🧪 Test Scenario 2: Admin View of Booked Slots

**Goal:** Verify admin sees booked slots with client info

### Steps:
1. **Go to admin slots management:**
   - http://localhost:3000/admin/slots
   - Select same date (April 10, 2026)

2. **View all slots:**
   - 🟢 Green slots = Available
   - 🟦 Blue slots = Booked ← Should see your booked 9:00 slot here
   - 🔴 Red slots = Blocked

3. **Check booked slot details:**
   - Blue "9:00 AM - 9:40 AM" slot shows:
     - Client name you booked under
     - Client email
     - "Booked" status

4. **Try to delete/block booked slot:**
   - Click "Delete" button on blue slot
   - Should be DISABLED (grayed out)
   - Click "Block" button
   - Should be DISABLED (grayed out)
   - ✅ Cannot modify booked slots

5. **Available slots should work normally:**
   - Delete/Block buttons ENABLED for green slots
   - ✅ Admin can manage available slots

---

## 🧪 Test Scenario 3: Therapist Sees Upcoming Sessions

**Goal:** Verify therapist dashboard shows their upcoming sessions

### Steps:
1. **Go to admin dashboard:**
   - http://localhost:3000/admin

2. **Find "Your Upcoming Sessions" widget:**
   - Should appear below Google Connect button
   - Shows next 5 upcoming sessions for this therapist

3. **Check session details:**
   - Session you just booked should appear
   - Shows:
     - ✅ Client name
     - ✅ Client email
     - ✅ Client phone (if available)
     - ✅ Date: Apr 10, 2026
     - ✅ Time: 9:00 - 9:40
     - ✅ Duration: 40 mins
     - ✅ Session type: Personal/Couple
     - ✅ "Join Meeting" button (if video link added)

4. **Session updates in real-time:**
   - Book another slot in another browser
   - Come back to this page
   - New session appears in the list ✅

---

## 🧪 Test Scenario 4: Analytics Dashboard

**Goal:** Verify analytics show session statistics and upcoming sessions

### Steps:
1. **Go to analytics:**
   - http://localhost:3000/admin/analytics

2. **Check stats cards:**
   - Total Bookings: Shows count
   - Completed Sessions: Count of finished sessions
   - Upcoming Sessions: Count of future sessions

3. **Check upcoming sessions list:**
   - Shows up to 10 upcoming sessions
   - Each session shows:
     - 📅 Date & time (Apr 10)
     - 👤 Client name & email
     - 🎯 Session type (Personal/Couple)
     - ⏱️ Duration (40 mins)
     - 📹 Meeting link (if available)

4. **Test sorting:**
   - Sessions should be sorted by date & time ascending
   - Most recent sessions first

---

## 📧 Test Scenario 5: Email Notifications

**Goal:** Verify emails are sent to client and therapist

### Setup:
1. Add to `.env.local`:
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_TEST_TO=your-email@gmail.com
   ```

### Test emails:
1. **Test email configuration:**
   ```bash
   npm run test:email
   ```
   - Should send 6 test emails
   - You should receive them in your inbox

2. **Book a real appointment:**
   - You should receive 2 emails:
     - 📧 Confirmation email (to your inbox)
     - 📧 Therapist notification (also to your inbox if same email)
   
3. **Check email content:**
   - ✅ Booking ID
   - ✅ Client name
   - ✅ Therapist name
   - ✅ Session date & time
   - ✅ Duration
   - ✅ Meeting link (if available)

---

## 🔍 Test Scenario 6: Slot Filtering Across Views

**Goal:** Verify booked slots are consistently hidden/shown

### Database Check:
Open Supabase console and check:

```sql
-- Check slots for a date
SELECT id, start_time, is_available FROM therapy_slots 
WHERE date = '2026-04-10'
ORDER BY start_time;

-- Check bookings
SELECT slot_id, status FROM bookings 
WHERE status = 'confirmed'
LIMIT 5;

-- Find booked slot IDs
SELECT slot_id FROM bookings 
WHERE status = 'confirmed' 
AND slot_id IN (
  SELECT id FROM therapy_slots WHERE date = '2026-04-10'
);
```

### Expected:
- ✅ Booked slot_id appears in bookings table
- ✅ Same slot_id's is_available = false
- ✅ SlotSelection filters out this slot_id
- ✅ SlotManagement shows it as blue/booked
- ✅ UpcomingSessionsWidget lists the booking

---

## ❌ Test Scenario 7: Error Cases

### Case 1: Try to book already booked slot
1. User A books 9:00 slot
2. User B tries to book same 9:00 slot
3. **Expected:** Error message or slot gone from list

### Case 2: Admin tries to delete booked slot
1. Slot is booked (blue color)
2. Click delete
3. **Expected:** Button disabled, cannot delete

### Case 3: Missing email config
1. Remove EMAIL_USER from .env.local
2. Try to book
3. **Expected:** Error handling, doesn't crash

---

## ✅ Test Checklist

- [ ] Booked slots hidden from client booking view
- [ ] Booked slots visible in admin as blue with client info
- [ ] Cannot delete booked slots
- [ ] Cannot block booked slots
- [ ] Therapist sees upcoming sessions in dashboard
- [ ] Analytics shows session counts and list
- [ ] Confirmation email sent to client
- [ ] Notification email sent to therapist
- [ ] Slots update in real-time across views
- [ ] Multiple users see correct availability
- [ ] Admin sees all slots regardless of status
- [ ] Database shows correct data

---

## 🚀 Summary

**Key Points to Verify:**
1. ✅ **Booked slots are removed from available** - Client can't see them
2. ✅ **Booked slots show client info** - Admin sees who booked
3. ✅ **Therapist dashboard updated** - Shows upcoming sessions
4. ✅ **Analytics working** - Shows stats and session list
5. ✅ **Emails sent** - Both client and therapist notified

**If all tests pass:** System is working correctly! 🎉

---

## 🆘 Troubleshooting

### Booked slot still visible to client
```bash
# Check slots.ts getAvailableSlots function
# Verify it's filtering bookedSlotIds correctly
# Check database: is_available should be false
```

### Admin doesn't see upcoming sessions
```bash
# Check UpcomingSessionsWidget.tsx
# Verify therapist_id from slot matches user ID
# Check database: bookings.slot_id should exist
# Check status is 'confirmed'
```

### Emails not sent
```bash
# Check .env.local has EMAIL_SERVICE set
# Run: npm run test:email
# Check email service logs (Gmail, SendGrid, etc.)
# Verify EMAIL_USER and EMAIL_PASSWORD are correct
```

### Slots not filtering correctly
```bash
# SQL to check booked slots:
SELECT COUNT(*) FROM bookings 
WHERE status = 'confirmed';

# SQL to check available:
SELECT COUNT(*) FROM therapy_slots 
WHERE is_available = true AND is_blocked = false;
```
