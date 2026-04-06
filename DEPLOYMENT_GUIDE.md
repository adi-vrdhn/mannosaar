# Vercel Deployment Guide

## Prerequisites
✅ Git repository (already set up)
✅ All changes committed
❓ GitHub account
❓ Vercel account

## Step 1: Push to GitHub

If you haven't pushed to GitHub yet:

```bash
# Add your GitHub remote
git remote add origin https://github.com/YOUR_USERNAME/mh-platform.git

# Push to main branch
git branch -M main
git push -u origin main
```

**If you already have a remote:**
```bash
git push origin main
```

## Step 2: Create Vercel Account

1. Go to **https://vercel.com**
2. Click **Sign Up**
3. Choose **GitHub** to sign in
4. Authorize Vercel to access your GitHub account

## Step 3: Import Project to Vercel

### Option A: Using Vercel Dashboard (Easiest)

1. Go to **https://vercel.com/new**
2. Click **Import Git Repository**
3. Paste your GitHub repo URL or select from list:
   ```
   https://github.com/YOUR_USERNAME/mh-platform
   ```
4. Click **Import**

### Option B: Using Vercel CLI

```bash
npm i -g vercel
cd /Users/aditya/Desktop/mh-platform
vercel
```

## Step 4: Configure Environment Variables

**In Vercel Dashboard:**

1. After importing, you'll see **Environment Variables** section
2. Add all these variables from your `.env.local`:

### Required Variables:

```
NEXT_PUBLIC_SUPABASE_URL = https://nkpjnbiyewdjxzhxjdvu.supabase.co
SUPABASE_SERVICE_ROLE_KEY = your_service_role_key

NEXTAUTH_URL = https://your-vercel-domain.vercel.app
NEXTAUTH_SECRET = generate_new_random_string

GOOGLE_CLIENT_ID = 46795443233-7lqj0qlk6rr380eh0e88reuljnqng53q.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET = your_google_client_secret

NEXT_PUBLIC_APP_URL = https://your-vercel-domain.vercel.app
GOOGLE_CALENDAR_SERVICE_ACCOUNT_EMAIL = mh-platform-calendar-service@omega-palace-492210-h0.iam.gserviceaccount.com
GOOGLE_CALENDAR_PRIVATE_KEY = your_private_key

EMAIL_USER = your-email@gmail.com
EMAIL_PASSWORD = your_app_password
```

## Step 5: Update Google OAuth

Your Google OAuth credentials need your Vercel domain added.

In **Google Cloud Console**:

1. Go to **APIs & Services → Credentials**
2. Find your OAuth 2.0 Client ID
3. Edit it and add to **Authorized redirect URIs**:
   ```
   https://your-vercel-domain.vercel.app/api/auth/callback/google
   ```

## Step 6: Deploy!

**In Vercel Dashboard:**

1. Click the **Deploy** button
2. Wait for build to complete (2-5 minutes)
3. Get your live URL when deployment finishes ✅

## Important Notes

### NEXTAUTH_SECRET
Generate a secure random string:
```bash
openssl rand -base64 32
```

Then add to Vercel environment variables.

### Custom Domain (Optional)

In Vercel Dashboard → Settings → Domains:
1. Add your custom domain
2. Update DNS records according to Vercel instructions
3. Wait for DNS propagation (15-30 mins)

### Environment Variables by Environment

Set different values for:
- **Production**: Live database & email
- **Preview**: Same or test database
- **Development**: Your local `.env.local`

## Testing After Deployment

1. Visit your live URL: `https://your-vercel-domain.vercel.app`
2. Test sign in with Google
3. Test booking a session
4. Test reschedule feature (admin)
5. Check email notifications

## Troubleshooting

### Build Fails
```bash
# Check build locally first
npm run build
```

### Environment Variables Not Working
- Verify they're added in Vercel Dashboard
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)

### Google OAuth Error
- Verify redirect URI in Google Cloud Console
- Check NEXTAUTH_SECRET is set
- Clear cookies and try again

### Email Not Sending
- Verify EMAIL_USER and EMAIL_PASSWORD
- Check Gmail app password (not regular password)
- Check email logs in Supabase

## Need Help?

Check these resources:
- **Vercel Docs**: https://vercel.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **NextAuth Docs**: https://next-auth.js.org

## Quick Checklist

- [ ] Pushed code to GitHub
- [ ] Created Vercel account
- [ ] Connected GitHub repo to Vercel
- [ ] Added all environment variables
- [ ] Updated Google OAuth redirect URI
- [ ] Generated NEXTAUTH_SECRET
- [ ] Clicked Deploy
- [ ] Tested live website
- [ ] Set up custom domain (optional)

---

**Your deployment domain will be something like:**
```
mh-platform-xyz123.vercel.app
```

Vercel will assign you a unique domain automatically!
