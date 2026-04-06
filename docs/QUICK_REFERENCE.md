# Email System - Quick Reference

## Installation & Setup (5 minutes)

```bash
# 1. Dependencies are already installed
npm ls nodemailer

# 2. Create .env.local file in project root
cp .env.example .env.local

# 3. Add email configuration (choose one option below)
```

## Gmail Configuration (Recommended for Development)

```bash
# 1. Enable 2FA: https://myaccount.google.com → Security
# 2. Create app password: https://myaccount.google.com/apppasswords
# 3. Add to .env.local:

EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_TEST_TO=your-email@gmail.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## SendGrid Configuration

```env
EMAIL_SERVICE=SendGrid
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your-api-key...
EMAIL_FROM=noreply@yourdomain.com
```

## AWS SES Configuration

```env
EMAIL_SERVICE=SES
EMAIL_HOST=email-smtp.region.amazonaws.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-smtp-username
EMAIL_PASSWORD=your-smtp-password
EMAIL_FROM=verified-email@domain.com
```

## Testing & Verification

```bash
# Test email configuration (sends 6 test emails)
npm run test:email

# Run development server
npm run dev

# Check if emails are working
# 1. Watch your email inbox
# 2. Check spam/junk folder
# 3. Check email service logs
```

## Using Email Functions

### Send Booking Confirmation
```typescript
import { sendBookingConfirmation } from '@/lib/email';

await sendBookingConfirmation('user@example.com', {
  bookingId: 'BOOK-123',
  therapistName: 'Dr. Smith',
  date: 'Monday, April 15, 2024',
  time: '2:00 PM',
  duration: '60',
  meetingLink: 'https://zoom.us/j/...',
});
```

### Send Booking Cancellation
```typescript
import { sendBookingCancellation } from '@/lib/email';

await sendBookingCancellation('user@example.com', {
  bookingId: 'BOOK-123',
  therapistName: 'Dr. Smith',
  date: 'Monday, April 15, 2024',
  time: '2:00 PM',
});
```

### Send Password Reset Email
```typescript
import { sendPasswordResetEmail } from '@/lib/email';

const resetLink = `${process.env.NEXT_PUBLIC_APP_URL}/reset?token=abc123`;
await sendPasswordResetEmail('user@example.com', resetLink);
```

### Send Welcome Email
```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail('newuser@example.com', 'John Doe');
```

### Send Custom Email
```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<p>Your content here</p>',
});
```

## API Routes

### Send Booking Confirmation
```bash
curl -X POST http://localhost:3000/api/bookings/send-confirmation \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "BOOK-123"}'
```

### Send Booking Cancellation
```bash
curl -X POST http://localhost:3000/api/bookings/send-cancellation \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "BOOK-123"}'
```

## Integration with Booking System

### In booking create route:
```typescript
// After creating booking in database
await fetch('/api/bookings/send-confirmation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId: booking.id }),
});
```

### In booking cancel route:
```typescript
// After updating booking status
await fetch('/api/bookings/send-cancellation', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ bookingId }),
});
```

## Troubleshooting

### Emails not sending?
```bash
# 1. Check .env.local exists and has correct values
cat .env.local

# 2. Test configuration
npm run test:email

# 3. Check email service credentials
# - Gmail: Verify app password (not account password)
# - SendGrid: Check API key format
# - AWS SES: Verify SMTP credentials

# 4. Check inbox and spam folder
# 5. Check email service logs
```

### "Authentication failed" error?
```bash
# For Gmail:
# 1. Enable 2FA: https://myaccount.google.com
# 2. Create app password: https://myaccount.google.com/apppasswords
# 3. Use 16-char password (not your account password)

# For SendGrid:
# 1. Copy API key exactly (starting with SG.)
# 2. Use as EMAIL_PASSWORD

# For AWS SES:
# 1. Verify SMTP credentials in AWS Console
# 2. Check region is correct
```

### "Connection timeout" error?
```bash
# Check SMTP host and port:
# Gmail: smtp.gmail.com:587
# SendGrid: smtp.sendgrid.net:587
# AWS SES: email-smtp.REGION.amazonaws.com:587

# If still failing:
# - Check firewall (port 587 or 465 may be blocked)
# - Try different port (465 with EMAIL_SECURE=true)
# - Verify internet connection
```

### Emails in spam folder?
1. Mark as "Not Spam" in your email client
2. Add sender to contacts
3. Check SPF/DKIM setup (production only)
4. Use recognized email service (SendGrid, AWS SES)

## Files Created

```
lib/
├── email.ts                          # Email functions
└── email.test.ts                     # Test utility

src/app/api/bookings/
├── send-confirmation/route.ts        # Confirmation endpoint
└── send-cancellation/route.ts        # Cancellation endpoint

Documentation/
├── EMAIL_SETUP.md                   # Full setup guide
├── EMAIL_INTEGRATION.md              # Integration guide  
├── SETUP_CHECKLIST.md               # Step-by-step checklist
├── EMAIL_SYSTEM_SUMMARY.md          # Implementation summary
├── ARCHITECTURE.md                  # Architecture diagrams
└── QUICK_REFERENCE.md              # This file
```

## Environment Variables Checklist

```env
# Required for email sending
EMAIL_SERVICE=gmail                    ✓ Choose service
EMAIL_USER=your-email@gmail.com        ✓ Your email account
EMAIL_PASSWORD=your-app-password       ✓ App password (Gmail)
EMAIL_FROM=your-email@gmail.com        ✓ From address

# Optional but recommended
EMAIL_HOST=smtp.gmail.com              ✓ SMTP host
EMAIL_PORT=587                         ✓ SMTP port
EMAIL_SECURE=false                     ✓ TLS flag

# For testing
EMAIL_TEST_TO=your-email@gmail.com     ✓ Your test inbox
NEXT_PUBLIC_APP_URL=http://localhost:3000  ✓ App URL
```

## Common Tasks

### Test email is configured correctly
```bash
npm run test:email
# Should send 6 test emails
```

### Send test email manually
```typescript
// In browser console or Node REPL
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'test@example.com',
  subject: 'Test',
  html: '<p>Test</p>'
});
```

### Resend confirmation email
```typescript
await fetch('/api/bookings/send-confirmation', {
  method: 'POST',
  body: JSON.stringify({ bookingId: 'BOOK-123' })
});
```

### Check email service status
- **Gmail:** Sign in to https://myaccount.google.com → Check activity
- **SendGrid:** https://app.sendgrid.com → Email Activity
- **AWS SES:** AWS Console → CloudWatch Logs

## Email Template Examples

### Booking Confirmation Email
```
Subject: Booking Confirmation - Dr. Smith
To: client@example.com

Hello Client,

Your booking has been confirmed!

Booking Details:
- Booking ID: BOOK-123
- Therapist: Dr. Jane Smith
- Date: Monday, April 15, 2024
- Time: 2:00 PM
- Duration: 60 minutes
- Meeting Link: [Zoom Link]

Please arrive 5 minutes early.

Thank you!
```

### Booking Cancellation Email
```
Subject: Booking Cancellation - BOOK-123
To: client@example.com

Hello Client,

Your booking has been cancelled.

Cancelled Booking:
- Booking ID: BOOK-123
- Therapist: Dr. Jane Smith
- Date: Monday, April 15, 2024
- Time: 2:00 PM

If you have questions, please contact us.
```

## Performance Tips

1. **Use async/await properly** - Don't block user requests
2. **Implement retry logic** - For failed sends
3. **Queue emails for high volume** - Use Bull/BullMQ
4. **Monitor delivery rates** - Track bounces and failures
5. **Cache frequently sent emails** - For templates

## Security Tips

✅ Store credentials in .env.local (never commit)
✅ Validate email addresses before sending
✅ Use HTTPS for email links
✅ Don't expose email addresses in responses
✅ Implement rate limiting on email endpoints
✅ Log errors securely (don't log passwords)

## Next Steps

1. ✅ Add .env.local with email configuration
2. ✅ Run `npm run test:email` to verify setup
3. ✅ Integrate with booking system
4. ✅ Test end-to-end booking with email
5. ✅ Monitor email delivery
6. ✅ Deploy to production

## Support

- **Setup issues?** → See EMAIL_SETUP.md
- **Integration help?** → See EMAIL_INTEGRATION.md
- **Need checklist?** → See SETUP_CHECKLIST.md
- **Architecture details?** → See ARCHITECTURE.md

---

**Status:** ✅ Ready to use
**Dependencies:** nodemailer (installed)
**Configuration:** Requires .env.local setup
**Testing:** `npm run test:email`
**Time to implement:** 5 minutes
