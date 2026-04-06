# Email Configuration Guide

This guide explains how to set up email functionality in the MH Platform using different email services.

## Overview

The email system uses nodemailer to send transactional emails for:
- Booking confirmations
- Booking cancellations
- Therapist notifications
- Password reset requests
- Welcome emails

## Setup Options

### Option 1: Gmail (Recommended for Development)

1. **Enable 2-Factor Authentication:**
   - Go to your Google Account (myaccount.google.com)
   - Select "Security" from the left menu
   - Enable 2-Step Verification

2. **Create an App Password:**
   - Go to [Google App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and "Windows Computer" (or your device)
   - Google will generate a 16-character password
   - Copy this password

3. **Set Environment Variables:**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-character-app-password
   EMAIL_FROM=your-email@gmail.com
   ```

### Option 2: SendGrid

1. **Create a SendGrid Account:**
   - Sign up at [SendGrid](https://sendgrid.com)
   - Verify your sender identity
   - Create an API key

2. **Set Environment Variables:**
   ```env
   EMAIL_SERVICE=SendGrid
   EMAIL_HOST=smtp.sendgrid.net
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=apikey
   EMAIL_PASSWORD=your-sendgrid-api-key
   EMAIL_FROM=your-verified-email@domain.com
   ```

### Option 3: AWS SES (Simple Email Service)

1. **Create AWS Account and Set Up SES:**
   - Go to AWS Console
   - Navigate to SES service
   - Verify your email address or domain
   - Create SMTP credentials

2. **Set Environment Variables:**
   ```env
   EMAIL_SERVICE=SES
   EMAIL_HOST=email-smtp.region.amazonaws.com
   EMAIL_PORT=587
   EMAIL_SECURE=false
   EMAIL_USER=your-smtp-username
   EMAIL_PASSWORD=your-smtp-password
   EMAIL_FROM=your-verified-email@domain.com
   ```

### Option 4: Custom SMTP Server

```env
EMAIL_SERVICE=custom
EMAIL_HOST=your-smtp-host.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-username
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@yourdomain.com
```

## Environment Variables

Add these to your `.env.local` file:

```env
# Email Configuration
EMAIL_SERVICE=gmail                    # Service provider: gmail, SendGrid, SES, etc.
EMAIL_HOST=smtp.gmail.com             # SMTP host (optional for gmail)
EMAIL_PORT=587                        # SMTP port (optional for gmail)
EMAIL_SECURE=false                    # Use TLS (false for port 587, true for port 465)
EMAIL_USER=your-email@gmail.com       # Email account or username
EMAIL_PASSWORD=your-app-password      # App password or SMTP password
EMAIL_FROM=your-email@gmail.com       # From address for emails
```

## Usage

### Sending a Booking Confirmation

```typescript
import { sendBookingConfirmation } from '@/lib/email';

await sendBookingConfirmation('client@example.com', {
  bookingId: 'BOOK-12345',
  therapistName: 'Dr. Jane Smith',
  date: '2024-04-15',
  time: '2:00 PM',
  duration: '60',
  meetingLink: 'https://zoom.us/j/...',
});
```

### Sending a Cancellation

```typescript
import { sendBookingCancellation } from '@/lib/email';

await sendBookingCancellation('client@example.com', {
  bookingId: 'BOOK-12345',
  therapistName: 'Dr. Jane Smith',
  date: '2024-04-15',
  time: '2:00 PM',
});
```

### Notifying Therapist

```typescript
import { sendTherapistNotification } from '@/lib/email';

await sendTherapistNotification('therapist@example.com', {
  bookingId: 'BOOK-12345',
  clientName: 'John Doe',
  clientEmail: 'john@example.com',
  date: '2024-04-15',
  time: '2:00 PM',
  duration: '60',
  notes: 'First-time client',
});
```

### Sending Password Reset Email

```typescript
import { sendPasswordResetEmail } from '@/lib/email';

await sendPasswordResetEmail('user@example.com', 'https://your-domain.com/reset?token=...');
```

### Sending Welcome Email

```typescript
import { sendWelcomeEmail } from '@/lib/email';

await sendWelcomeEmail('newuser@example.com', 'John Doe');
```

## Testing

### Test Email Configuration

To verify your email setup works:

```bash
npm run test:email
```

Or manually test in a Node script:

```typescript
import { sendEmail } from '@/lib/email';

await sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  html: '<p>This is a test email</p>',
});
```

### Email Testing Services

- **Mailtrap**: https://mailtrap.io (Intercept emails during testing)
- **MailHog**: Local email testing tool
- **Ethereal**: Temporary test email service

## Troubleshooting

### "Authentication failed"
- Check your email credentials are correct
- For Gmail, ensure you're using an App Password, not your account password
- Verify 2FA is enabled for Gmail

### "Certificate required for TLS"
- Try setting `EMAIL_SECURE=true` and `EMAIL_PORT=465`
- Some servers may require different port/security combinations

### "Connection timed out"
- Verify the SMTP host and port are correct
- Check your firewall isn't blocking outgoing SMTP connections
- Some networks block port 25 (use 587 or 465 instead)

### "Email not received"
- Check spam/junk folder
- Verify the recipient email is correct
- Check email logs in your email service dashboard

### "Rate limit exceeded"
- Check your email service's daily/hourly limits
- Gmail: ~500 emails per day for free accounts
- SendGrid: Check your plan limits
- Implement retry logic with exponential backoff

## Production Considerations

1. **Use dedicated email service** (SendGrid, AWS SES, etc.) instead of personal Gmail
2. **Implement rate limiting** to prevent abuse
3. **Add email queuing** for better reliability (Bull, BullMQ)
4. **Set up email templates** for consistency
5. **Track email delivery** (bounces, complaints)
6. **Enable DKIM/SPF** for better deliverability
7. **Monitor email service** for errors and failures
8. **Implement retry logic** for failed sends

## Email Queue Implementation (Optional)

For production, consider using Bull with Redis:

```bash
npm install bull redis
```

This allows async email sending without blocking requests.

## Privacy & Compliance

- **GDPR**: Ensure user consent before sending marketing emails
- **CAN-SPAM**: Include unsubscribe links in promotional emails
- **Privacy Policy**: Mention email usage in your privacy policy
- **Data Security**: Protect email addresses from unauthorized access

## Support

For issues or questions:
- Gmail: https://support.google.com/accounts
- SendGrid: https://support.sendgrid.com
- AWS SES: https://docs.aws.amazon.com/ses/
