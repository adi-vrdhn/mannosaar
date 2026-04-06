# Google Calendar & Google Meet Setup Guide

## Environment Variables Required

Add these to your `.env.local` file:

```env
# Google OAuth 2.0 Credentials
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
NEXT_PUBLIC_APP_URL=http://localhost:3000  # Change to your production URL in production

# Existing Supabase credentials (already configured)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## How to Get Google OAuth Credentials

### Step 1: Create a Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Create Project"
3. Name it "Therapy Booking Platform" (or your app name)
4. Click Create

### Step 2: Enable Google APIs
1. In the Google Cloud Console, go to "APIs & Services"
2. Click "Enable APIs and Services"
3. Search for and enable:
   - **Google Calendar API**
   - **Google Meet API** (or it's included with Calendar API)

### Step 3: Create OAuth 2.0 Credentials
1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth Client ID"
3. Choose **Web Application**
4. Add Authorized redirect URIs:
   - `http://localhost:3000/api/auth/google-callback` (for development)
   - `https://yourdomain.com/api/auth/google-callback` (for production)
5. Click Create
6. Copy the Client ID and Client Secret

### Step 4: Add to Environment Variables
```env
GOOGLE_CLIENT_ID=your_copied_client_id
GOOGLE_CLIENT_SECRET=your_copied_client_secret
```

## How It Works Now (Google Meet instead of Zoom)

### 1. **Therapist Connects Google Account**
   - Admin Dashboard shows "Connect Google Account" button
   - Therapist/Admin clicks it
   - Redirected to Google OAuth login
   - Grants permissions to create calendar events
   - System stores credentials securely in database

### 2. **Client Books a Session**
   - Client selects date, time, and session type
   - Clicks "Confirm Booking"
   
### 3. **System Automatically:**
   - Creates a Google Calendar event in therapist's calendar
   - Adds therapist + client as attendees
   - Google automatically generates a **Google Meet link**
   - **Sends confirmation emails to both** (therapist + client)
   - Meet link included in both emails

### 4. **Client Joins Session**
   - Client sees success page with "Join Google Meet" button
   - Clicks button to join (or uses link from email)
   - Can share the Meet link with others if needed

## Benefits Over Zoom

✅ **No Meeting Limits** - Zoom free plan has 40-minute limit  
✅ **Automatic Emails** - Google Calendar sends them, no extra code needed  
✅ **Calendar Integration** - Events in both therapist and client calendars  
✅ **Better Security** - Google handles authentication  
✅ **No Missing Links** - Always generated with calendar event  
✅ **Easy Sharing** - Clients can add more participants from Calendar

## Database Changes

A new table was created to store therapist Google credentials:

```sql
CREATE TABLE google_oauth_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMP,
  email VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

Run the migration:
```bash
psql -d your_database < database-schema.sql
```

## Testing

1. **Start dev server:**
   ```bash
   npm run dev
   ```

2. **As Admin/Therapist:**
   - Go to `/admin`
   - Click "Connect Google Account"
   - Authorize the app
   - Should see success message

3. **As Client:**
   - Book a therapy session
   - Go to success page
   - Should see "🎥 Join Google Meet" button
   - Email should be received

## Troubleshooting

**"Google credentials not found" error:**
- Admin hasn't connected Google account yet
- Go to Admin Dashboard and click "Connect Google Account"

**"Failed to create Google Calendar event" error:**
- Check that Google OAuth credentials are valid
- Make sure GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are set correctly in .env.local
- Verify Google Calendar API is enabled in Google Cloud Console

**Meet link not appearing on success page:**
- It may take a few seconds to create the event
- Page auto-retries every 2 seconds (up to 3 times)
- Refresh the page manually if needed

**Token refresh failing:**
- Some Google accounts may have additional security requirements
- Try re-connecting the Google account from Admin Dashboard
