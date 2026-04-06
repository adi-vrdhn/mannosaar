# Database Migration: Add Meeting Password Column

To complete the booking system with password support, you need to add a `meeting_password` column to the `bookings` table.

## Steps:

1. **Go to Supabase Dashboard**
   - Open https://supabase.com/dashboard
   - Select your project "mh-platform"

2. **Open SQL Editor**
   - Click "SQL" in the left sidebar
   - Click "New Query"

3. **Run this SQL command:**

```sql
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meeting_password VARCHAR(50);
```

4. **Click "Run"** (or press Cmd+Enter)

Once complete, the booking system will:
- ✓ Generate a 6-digit password when creating bookings
- ✓ Store the password in the database
- ✓ Display it on the success page alongside the Google Meet link

## What Changed:

- **`/api/user/get-id/route.ts`** - Now auto-creates users if they don't exist
- **`/api/bookings/create/route.ts`** - Now generates and stores a 6-digit password
- **Success Page** - Now displays the meeting password for users
- **Database Schema** - Added `meeting_password` column to `bookings` table
