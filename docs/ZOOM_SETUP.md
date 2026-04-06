# Zoom Meeting Setup Guide

## Issue
Your Zoom OAuth app is currently disabled. The error occurs because the app status is not "Active" in the Zoom Developer Console.

## Steps to Fix

### 1. Go to Zoom Developer Console
- Visit: https://marketplace.zoom.us/develop/create
- or: https://marketplace.zoom.us/apps

### 2. Find Your App
- Look for your app: **Mannosaar Booking System** (or similar)
- Click on the app name to open its details

### 3. Check App Status
You should see your app with the following credentials (already in your .env.local):
```
Client ID: 0YT37X4NRaaGSyRT4sjpCw
Client Secret: LGu01GvnbXJibS5Da4FKnxahd6pnxbeu
Account ID: yTOgSzuHQ-m5WaZYuT4SSg
```

### 4. Activate/Enable Your App
- Go to **App Credentials** tab
- Scroll down to find **App Status** section
- Make sure the toggle is **ENABLED** (turned ON)
- Status should show: ✓ Active

### 5. Configure OAuth Redirect URL
- In **OAuth Redirect URL**, make sure you have:
  ```
  http://localhost:3000/api/zoom/callback
  ```
  (for development)
  
- For production, add:
  ```
  https://yourdomain.com/api/zoom/callback
  ```

### 6. Verify Scopes
Make sure these OAuth scopes are enabled:
- ✓ meeting:read
- ✓ meeting:write
- ✓ user:read

### 7. Test the Connection
Once enabled:
1. Clear your browser cache (or open in incognito)
2. Try booking an appointment again
3. Check browser console and server logs for the Zoom link

## Credentials in .env.local
Your current setup:
```
ZOOM_CLIENT_ID=0YT37X4NRaaGSyRT4sjpCw
ZOOM_CLIENT_SECRET=LGu01GvnbXJibS5Da4FKnxahd6pnxbeu
ZOOM_ACCOUNT_ID=yTOgSzuHQ-m5WaZYuT4SSg
```

These are already configured and correct.

## If You Can't Find the App
1. Go to https://marketplace.zoom.us/develop/create
2. Click **"Create"** 
3. Select **"Server-to-Server OAuth"**
4. Fill in app name: "Mannosaar Booking System"
5. Click **"Create**"
6. Copy the **Client ID**, **Client Secret**, and **Account ID**
7. Replace the values in `.env.local`
8. Enable the app (toggle switch)
9. Add OAuth Redirect URLs
10. Publish the app

## Common Issues

### "invalid_client"
- App is disabled or credentials are wrong
- **Solution**: Enable the app in Developer Console, restart the dev server

### "invalid_grant"
- Account ID might be wrong
- **Solution**: Copy the exact Account ID from Developer Console

### "The app has not been authorized"
- Scopes not enabled
- **Solution**: Add the required OAuth scopes and republish

## After Enabling
If you still get the error after enabling:
1. Kill the dev server: `killall node`
2. Wait 30 seconds
3. Restart: `npm run dev`
4. Try booking again

---
Need help? The Zoom Developer Console is at: https://marketplace.zoom.us/develop/apps
