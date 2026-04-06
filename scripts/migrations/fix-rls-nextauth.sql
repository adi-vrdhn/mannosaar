-- Fix RLS policy issues with NextAuth
-- NextAuth uses session-based auth, not Supabase auth
-- So auth.uid() won't work - we need to disable RLS for these tables

-- Drop problematic RLS policies
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can view available slots" ON therapy_slots;
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can view own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage slots" ON therapy_slots;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;

-- Disable RLS on tables that conflict with NextAuth
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_slots DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE block_schedules DISABLE ROW LEVEL SECURITY;

-- Security is handled by NextAuth session validation in API routes
-- And server-side checks for admin/user roles
