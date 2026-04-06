# Mental Health Therapist Booking System - Setup Guide

## ✅ COMPLETED: Phase 1 & 2 - Admin Panel & Authentication

### What Was Built:

#### 1. **Database Schema (Supabase)**
- `users` table with admin role support
- `therapy_slots` table for managing available sessions
- `bookings` table for storing user appointments
- `block_schedules` table for admins to block time periods
- Row-Level Security (RLS) policies for data protection

#### 2. **Authentication System (NextAuth.js)**
- Google OAuth integration configured
- User auto-registration on first login
- Admin role detection for access control
- Session management with JWT
- Logout functionality

#### 3. **Admin Panel** (`/admin`)
Dashboard with pages:
- **Admin Dashboard** - Overview of options
- **Manage Slots** (`/admin/slots`) - Create, view, block/unblock therapy slots
- **View Bookings** (`/admin/bookings`) - View all user bookings with filtering
- **Block Schedule** (`/admin/block-schedule`) - Block full days or time ranges
- **Analytics** (`/admin/analytics`) - Placeholder for future stats

#### 4. **Core Features Implemented**

**Slot Management:**
- ✅ Admins can create therapy slots (45min minimum)
- ✅ View slots by date
- ✅ Enable/disable individual slots
- ✅ Delete slots
- ✅ Block multiple slots via block schedules (full day or time range)

**Admin Protection:**
- ✅ Role-based access control (must be admin to access `/admin`)
- ✅ Automatic redirect to home if unauthorized
- ✅ Session-based authentication

**Navbar Updates:**
- ✅ Login button replaced with user dropdown after login
- ✅ Logout functionality
- ✅ Link to Profile & Bookings pages
- ✅ Admin Panel link appears only for admins

---

## 📋 NEXT STEPS: Phase 3 & 4 (User Booking + Google Integration)

### What Needs to be Built:

#### **Phase 3: User Booking Flow**
1. **Booking Type Selection** (`/appointment/type`)
   - Personal Therapy card
   - Couple Therapy card
   - Smooth animations

2. **Slot Selection** (`/appointment/slots`)
   - Calendar view with date picker
   - Display available slots for selected date
   - Real-time availability (disable booked/blocked slots)
   - Timezone conversion for multi-timezone support

3. **Booking Confirmation** (`/appointment/confirm`)
   - Review: Type, Date, Time, Therapist Name
   - Confirm & Continue button
   - Create booking in database
   - Generate Google Calendar event

#### **Phase 4: User Profile & Google Integration**
1. **Profile Page** (`/profile`)
   - User info (name, email)
   - Upcoming bookings section
   - Past bookings section
   - Booking details with meeting links

2. **Google Calendar Integration**
   - Auto-create calendar events when booking confirmed
   - Add therapist & user as attendees
   - Generate Google Meet links (auto-embedded in event)
   - Send calendar invites via Gmail

3. **Booking Management**
   - Cancel bookings (24-hour notice required)
   - View meeting links
   - Reschedule appointments

---

## 🔧 SETUP INSTRUCTIONS

### Step 1: Create Supabase Project
1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to SQL Editor and run the SQL from `database-schema.sql`
4. Copy your project URL and API keys

### Step 2: Set Up Environment Variables
Create/update `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# NextAuth
NEXTAUTH_SECRET=generate_with: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000

# Google OAuth
GOOGLE_CLIENT_ID=your_google_oauth_client_id
GOOGLE_CLIENT_SECRET=your_google_oauth_secret

# Google Calendar API (for Phase 4)
GOOGLE_CALENDAR_API_KEY=your_api_key
GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_CALENDAR_SERVICE_ACCOUNT_PRIVATE_KEY=your_private_key

# Therapist Email
THERAPIST_EMAIL=neetu.rathore@example.com
```

### Step 3: Get Google OAuth Credentials
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project
3. Enable OAuth 2.0 Consent Screen
4. Create OAuth 2.0 credentials (Web Application)
5. Add authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://yourdomain.com/api/auth/callback/google` (production)

### Step 4: Create Admin Users
To make a user an admin:
1. Sign in with Google
2. Go to Supabase dashboard → Tables → users
3. Update the `role` column from 'user' to 'admin' for the desired email

### Step 5: Run the Application
```bash
npm install  # Already done
npm run dev
```

Visit: http://localhost:3000

---

## 📁 Project Structure

```
src/
├── app/
│   ├── admin/                 # Admin pages
│   │   ├── page.tsx          # Admin dashboard
│   │   ├── slots/page.tsx    # Slot management
│   │   ├── bookings/page.tsx # View bookings
│   │   ├── block-schedule/   # Block scheduling
│   │   └── analytics/page.tsx
│   ├── auth/
│   │   └── login/page.tsx    # Login page
│   ├── api/
│   │   └── auth/[...nextauth].ts  # NextAuth API routes
│   ├── layout.tsx            # Root layout with Providers
│   └── page.tsx              # Home page
├── components/
│   ├── admin/                # Admin components
│   │   ├── AdminDashboard.tsx
│   │   ├── SlotManagement.tsx
│   │   ├── BookingsView.tsx
│   │   ├── BlockScheduleManagement.tsx
│   │   └── Analytics.tsx
│   ├── shared/               # Shared components
│   │   ├── Navbar.tsx        # Updated with auth
│   │   └── WhatsAppButton.tsx
│   └── Providers.tsx         # NextAuth SessionProvider wrapper
├── lib/
│   ├── auth.ts              # NextAuth config
│   ├── slots.ts             # Slot management functions
│   ├── bookings.ts          # Booking management functions
│   └── supabase/
│       ├── client.ts        # Client-side Supabase
│       └── server.ts        # Server-side Supabase
└── types/                   # TypeScript types (to be added)
```

---

## 🧪 Testing the Admin Panel

### Test Admin Access:
1. Sign in with Google using an admin email
2. Navigate to `/admin`
3. You should see the admin dashboard

### Test Slot Management:
1. Go to `/admin/slots`
2. Select a date
3. Click "Create Slot"
4. Fill in start/end times
5. Create multiple slots
6. Test Block/Unblock buttons

### Test Block Schedules:
1. Go to `/admin/block-schedule`
2. Select a date range
3. Choose "Full Day" or "Time Range"
4. Create and manage blocks

---

## 🔑 Key Technologies

- **Next.js 16** (App Router)
- **NextAuth.js v5** (Authentication)
- **Supabase** (Database & Auth)
- **Framer Motion** (Animations)
- **Tailwind CSS** (Styling)
- **TypeScript** (Type Safety)

---

## 🚀 Ready for Phase 3?

Once you're ready, I'll build:
1. User booking flow (type selection → slot selection → confirmation)
2. Google Calendar API integration
3. User profile page with booking history
4. Real-time slot blocking for booked sessions

**Next meeting:** User booking flow implementation!
