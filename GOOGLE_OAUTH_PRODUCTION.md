# Moving Google OAuth to Production

Your OAuth app is currently in **Testing** mode. Here's how to move it to **Production**:

## Current Status Check

**In Google Cloud Console:**

1. Go to **APIs & Services → OAuth consent screen**
2. Look for the badge showing **TESTING** or **PRODUCTION**

## Step 1: Understand the Difference

| Aspect | Testing | Production |
|--------|---------|-----------|
| Access | Only test users you specify | Anyone can use |
| Token Expiry | Tokens refresh frequently | Tokens last longer |
| User Limit | Max 100 test users | Unlimited users |
| Visibility | Not listed in Google's app directory | Listed publicly |
| Compliance | Basic | Requires OAuth compliance review |

## Step 2: Prepare OAuth Consent Screen

**In Google Cloud Console → APIs & Services → OAuth consent screen:**

### For EXTERNAL (Recommended as "Production")

1. Click **EDIT APP**
2. Update these fields:

#### App Information:
- **App name**: MH Platform Therapy Booking
- **User support email**: your-support@example.com
- **Developer contact**: your-email@example.com

#### Scopes (Keep minimal):
- ✅ `auth/userinfo.email`
- ✅ `auth/userinfo.profile`
- ✅ `calendar` (if using Google Calendar)
- ❌ Remove any unnecessary scopes

#### Branding:
- **Logo**: Upload your platform logo (512x512 px)
- **Homepage link**: `https://your-domain.vercel.app`
- **Privacy policy URL**: `https://your-domain.vercel.app/privacy` (create this page)
- **Terms of service**: `https://your-domain.vercel.app/terms` (create this page)

#### Sensitive Scopes:
- If using calendar data, add justification:
  ```
  "We use this to display your Google Calendar availability for 
   booking appointments. No data is stored or shared."
  ```

### Save Changes

Click **Save and Continue** through all sections

## Step 3: Verify Authorized Domains

**Still in OAuth consent screen:**

Scroll to **Authorized domains** and verify:

```
your-domain.vercel.app
your-custom-domain.com (if you have one)
```

These are the domains where users can sign in.

## Step 4: Update OAuth Credentials

**In APIs & Services → Credentials:**

1. Find your **OAuth 2.0 Client ID**
2. Click to edit it
3. Update **Authorized JavaScript origins**:
   ```
   https://your-domain.vercel.app
   https://your-custom-domain.com (if applicable)
   ```

4. Update **Authorized redirect URIs**:
   ```
   https://your-domain.vercel.app/api/auth/callback/google
   https://your-custom-domain.com/api/auth/callback/google (if applicable)
   ```

5. Click **Save**

## Step 5: Request Production Status

**In Google Cloud Console → APIs & Services → OAuth consent screen:**

1. Scroll to top - you should see **USER TYPE** section
2. Look for your app status indicator

### If Status is "TESTING":

**Option A: Automatic Production (Recommended)**
- Just deploy to Vercel with production domain
- Make sure registered domains match
- Google automatically moves to EXTERNAL after deployment

**Option B: Manual Request**
1. Click **"Publish App"** button (if visible)
2. Agree to compliance requirements
3. Submit for review (takes ~24 hours)

## Step 6: Create Privacy & Terms Pages

Since you're going to production, create these pages:

### Privacy Policy Page (`/privacy`)
```markdown
# Privacy Policy

We respect your privacy. Here's how we handle your data:

## Google OAuth Data
- Email: Used for account identification
- Name: Displayed in your profile
- Profile picture: Displayed in your profile

## We do NOT:
- Share your email with third parties
- Store passwords
- Sell your data
- Track across other websites

## Data Storage
- Securely stored in Supabase
- Encrypted in transit (HTTPS)
- You can request deletion anytime

For questions: contact your-email@example.com
```

### Terms of Service Page (`/terms`)
```markdown
# Terms of Service

By using MH Platform, you agree to:

## User Responsibilities
- Maintain confidentiality of your account
- Use platform lawfully
- Respect other users' privacy
- Not share credentials with others

## Our Responsibilities
- Maintain service availability (best effort)
- Protect your data with encryption
- Comply with privacy laws

## Limitation of Liability
MH Platform is provided "as-is" without warranties.

For questions: contact your-email@example.com
```

## Step 7: Enable Verification (Optional but Recommended)

**For Enhanced Security:**

In APIs & Services → Credentials:

1. Find your OAuth 2.0 Client ID
2. Note the **Client ID**
3. Later, you can add domain verification for enhanced trust

## Step 8: Monitor OAuth Activity

Once in production, monitor in:

**Google Cloud Console → APIs & Services → Quota:**

Check if:
- ✅ OAuth logins are succeeding
- ⚠️ Any quota limits hit
- ❌ Any errors appearing

## Step 9: Test Production OAuth Flow

1. **Clear browser cookies**
2. **Visit your live Vercel domain**
3. **Click "Sign in with Google"**
4. **Verify:**
   - ✅ Consent screen appears
   - ✅ Login succeeds
   - ✅ Redirected back to dashboard
   - ✅ User profile loads

## Compliance Checklist

Before going fully public:

- [ ] Privacy policy created and linked
- [ ] Terms of service created and linked
- [ ] Support email configured
- [ ] Logo uploaded
- [ ] Authorized domains verified
- [ ] Redirect URIs updated
- [ ] App name is clear and professional
- [ ] Sensitive scope explanation provided
- [ ] Only necessary scopes requested
- [ ] Testing completed on production domain

## Troubleshooting Production OAuth

### "redirect_uri_mismatch" Error
**Fix**: Ensure Vercel redirect URI exactly matches:
```
https://your-domain.vercel.app/api/auth/callback/google
```
(Note the exact path and HTTPS)

### Consent Screen Still Says "Testing"
**Solution**: 
1. Make sure app credentials match your domain
2. Deploy to production Vercel domain
3. Access from that domain
4. Wait 24-48 hours for Google to update

### Users Can't Sign In
**Check**:
1. Client ID and Secret are correct in `.env`
2. Redirect URI is in Cloud Console
3. OAuth 2.0 enabled in Cloud Console
4. NEXTAUTH_URL set correctly in `.env`

## Production Environment Variables

Make sure these are set in Vercel **exactly**:

```
GOOGLE_CLIENT_ID = 46795443233-7lqj0qlk6rr380eh0e88reuljnqng53q.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your_actual_secret_here
NEXTAUTH_URL = https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET = your_secure_random_string
NEXT_PUBLIC_APP_URL = https://your-vercel-domain.vercel.app
```

## Understanding OAuth Status

### TESTING Mode
- Up to 100 test users
- Tokens expire quickly (1 hour)
- No public access
- Best for development

### PRODUCTION Mode
- unlimited users
- Longer token expiry
- Public access available
- Requires privacy/terms pages

Your current setup can run as **TESTING** in production (Vercel), but ideally upgrade to full production compliance.

## Quick Status Check

**Run this to verify your OAuth setup:**

```bash
echo "Client ID: $GOOGLE_CLIENT_ID"
echo "App URL: $NEXT_PUBLIC_APP_URL"
echo "NextAuth URL: $NEXTAUTH_URL"
```

If these show your Vercel domain, you're ready! ✅

---

**Next Action**: Deploy to Vercel first, then follow the compliance steps above.
