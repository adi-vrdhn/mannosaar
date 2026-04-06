# Supabase Setup Verification & Troubleshooting

## 🔍 Check Your Supabase Setup

### Step 1: Verify the `users` Table Has the Right Columns

1. Go to **Supabase Dashboard**
2. Click **SQL Editor** (left sidebar)
3. Run this query:

```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users'
ORDER BY ordinal_position;
```

**You should see these columns:**
- ✅ `id` (uuid)
- ✅ `email` (text)
- ✅ `name` (text)
- ✅ `role` (text)
- ✅ `phone_number` (text) ← **REQUIRED**
- ✅ `updated_at` (timestamp with time zone)

### Step 2: If Missing `phone_number`, Run This Migration

In SQL Editor, run:

```sql
-- Add missing columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Verify they were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'users';
```

### Step 3: Check RLS (Row Level Security) Policies

1. Go to **Authentication** > **Policies** (in Supabase)
2. Look for the `users` table policies
3. Make sure you have policies that allow:
   - ✅ Users to read their own row: `auth.uid() = user_id`
   - ✅ Users to update their own row: `auth.uid() = user_id`
   - ✅ Service role or anon role to insert users

If you don't have these, RLS might be blocking user creation.

### Step 4: Disable RLS for testing (Optional)

If RLS is causing issues:

1. Go to **Authentication** > **Policies**
2. Click the `users` table
3. Temporarily disable RLS (click "Disable RLS")
4. Test if users can be created now
5. Re-enable and set proper policies

---

## 🚀 Quick Fix Checklist

- [ ] Run the SQL migration above to add `phone_number` column
- [ ] Verify the phone_number column exists in your users table
- [ ] Check RLS policies are not blocking inserts
- [ ] Refresh your browser (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] Log out and log back in
- [ ] Try accessing `/profile` again

---

## ✅ Testing After Fix

1. **Clear browser cache** (or use incognito window)
2. **Log in with Google** at http://localhost:3000
3. **Go to `/profile`** - user should be created automatically
4. **Click "Edit Profile"** and add phone number
5. **Try booking** - phone modal should not appear if number is saved

---

## 🛠️ Troubleshooting Steps

### If you see "Could not initialize profile"

**Likely cause**: phone_number column doesn't exist

**Fix**: Run the SQL migration in Supabase SQL Editor to add the column

### If you see "Could not create user profile"

**Likely causes**:
1. RLS policies blocking inserts
2. Missing columns in users table
3. Wrong Supabase credentials

**Fix**:
- Verify columns exist
- Check RLS policies
- Verify `.env.local` has correct Supabase keys

### If users aren't showing up in database

**Likely cause**: Users created but can't query them due to RLS

**Fix**: 
- Check RLS policies
- Make sure phone_number SELECT is allowed
- Verify service role key has permissions

---

## 📋 Required Columns Reference

Here's what your `users` table should look like:

| Column | Type | Nullable | Default |
|--------|------|----------|---------|
| id | uuid | No | gen_random_uuid() |
| email | text | No | |
| name | text | Yes | |
| role | text | No | 'user' |
| phone_number | text | Yes | |
| updated_at | timestamp | Yes | CURRENT_TIMESTAMP |
| created_at | timestamp | Yes | CURRENT_TIMESTAMP |

---

## 🔑 Environment Variables Check

Verify your `.env.local` has:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJa...
SUPABASE_SERVICE_ROLE_KEY=eyJa...
```

All 3 are required for user creation to work.

---

## 📞 Still Having Issues?

1. Check browser console (F12) for error details
2. Check server console (terminal running `npm run dev`)
3. Go to Supabase Dashboard > Logs to see database errors
4. Verify all columns exist in users table
5. Make sure phone_number column was added successfully

Let me know what you see in the browser console when the error occurs!
