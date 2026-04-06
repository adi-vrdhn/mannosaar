# Email System Implementation Checklist

Complete the following steps to fully implement the email system in the MH Platform.

## Setup Checklist

### ✅ 1. Email Library & Dependencies
- [x] Install nodemailer: `npm install nodemailer --legacy-peer-deps`
- [x] Install @types/nodemailer: `npm install --save-dev @types/nodemailer --legacy-peer-deps`
- [x] Email utilities created: `lib/email.ts`
- [x] Test utilities created: `lib/email.test.ts`

### ✅ 2. Configuration
- [ ] Copy `.env.example` to `.env.local`
- [ ] Add email environment variables to `.env.local`:
  ```env
  EMAIL_SERVICE=gmail
  EMAIL_USER=your-email@gmail.com
  EMAIL_PASSWORD=your-app-password
  EMAIL_FROM=your-email@gmail.com
  EMAIL_TEST_TO=your-test-email@gmail.com
  NEXT_PUBLIC_APP_URL=http://localhost:3000
  ```
- [ ] Update environment variables for your chosen email service
- [ ] Verify environment is loaded in development

### ✅ 3. API Routes
- [x] Booking confirmation route: `src/app/api/bookings/send-confirmation/route.ts`
- [x] Booking cancellation route: `src/app/api/bookings/send-cancellation/route.ts`
- [ ] Integrate with booking creation flow
- [ ] Integrate with booking cancellation flow
- [ ] Test API routes manually

### ✅ 4. Documentation
- [x] `EMAIL_SETUP.md` - Configuration guide for different email services
- [x] `EMAIL_INTEGRATION.md` - How to use email system in your app
- [x] Check configuration examples match your setup

### 5. Testing
- [ ] Test email configuration: `npm run test:email`
- [ ] Check `.env.local` EMAIL_TEST_TO is set correctly
- [ ] Verify test emails arrive in your inbox
- [ ] Check email formatting and content
- [ ] Test with different email templates

### 6. Database Integration
- [ ] Verify `users` table has `email` column
- [ ] Verify `therapists` table has `email` and `full_name` columns
- [ ] Verify `bookings` table has:
  - `id` (booking ID)
  - `booking_date` (appointment date)
  - `start_time` (appointment time)
  - `duration` (session duration)
  - `therapist_id` (foreign key)
  - `user_id` (foreign key)
  - `zoom_link` (optional, for meeting link)
  - `notes` (optional, session notes)
  - `status` (for cancellation tracking)
  - `cancelled_at` (optional, cancellation timestamp)

### 7. Application Integration
- [ ] Update booking creation flow to send confirmation emails
- [ ] Update booking cancellation flow to send cancellation emails
- [ ] Add "Resend Email" buttons to booking pages (if needed)
- [ ] Update user registration to send welcome emails
- [ ] Add email preferences/settings to user profile (optional)

### 8. Error Handling & Logging
- [ ] Add try-catch blocks around email sending
- [ ] Log email sends to monitoring service (optional)
- [ ] Set up error notifications for failed emails (optional)
- [ ] Create admin dashboard for email logs (optional)

### 9. Production Setup
- [ ] Update to production email service (SendGrid/SES/etc.)
- [ ] Set production environment variables
- [ ] Enable SPF/DKIM for domain
- [ ] Set up email delivery monitoring
- [ ] Configure bounce/complaint handling
- [ ] Test production email flow
- [ ] Set up email rate limiting (optional)
- [ ] Implement email queue system (Bull/BullMQ) (optional)

### 10. Security & Compliance
- [ ] Verify email credentials are not committed to git
- [ ] Use environment variables for all sensitive data
- [ ] Review privacy policy for email usage disclosures
- [ ] Ensure GDPR compliance (if applicable)
- [ ] Verify CAN-SPAM compliance (if applicable)
- [ ] Set up unsubscribe functionality (if doing marketing emails)

### 11. Monitoring & Maintenance
- [ ] Set up alerts for email delivery failures
- [ ] Monitor email bounce rates
- [ ] Review email logs regularly
- [ ] Test email sending periodically
- [ ] Update email templates as needed
- [ ] Check for deprecated email service features

## Quick Start

### For Development (Gmail):

1. **Enable 2-Factor Authentication**
   - Go to https://myaccount.google.com
   - Select Security
   - Enable 2-Step Verification

2. **Create App Password**
   - Go to https://myaccount.google.com/apppasswords
   - Create 16-character app password

3. **Set Environment Variables**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=your-16-char-app-password
   EMAIL_FROM=your-email@gmail.com
   EMAIL_TEST_TO=your-email@gmail.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Test Configuration**
   ```bash
   npm run test:email
   ```

## File Structure

```
mh-platform/
├── lib/
│   ├── email.ts              # Email utilities & functions
│   └── email.test.ts         # Email testing utilities
├── src/app/api/
│   └── bookings/
│       ├── send-confirmation/ # Confirmation email endpoint
│       └── send-cancellation/ # Cancellation email endpoint
├── EMAIL_SETUP.md            # Configuration guide
├── EMAIL_INTEGRATION.md       # Integration guide
├── SETUP_CHECKLIST.md        # This file
└── .env.local                # Environment variables (not in git)
```

## Email Templates

The system includes templates for:

1. **Booking Confirmation** - Sent to client and therapist
2. **Booking Cancellation** - Sent when booking is cancelled
3. **Password Reset** - For password reset flows
4. **Welcome Email** - For new user registration
5. **Custom Emails** - Using sendEmail() function

## Troubleshooting

### Tests not sending emails?
- Check `.env.local` exists and has correct values
- Verify EMAIL_TEST_TO is set to your email
- Check email service credentials are correct

### Emails not arriving?
- Check spam/junk folder
- Verify recipient email is correct
- Check email service logs
- Verify firewall isn't blocking SMTP

### Environment variables not loading?
- Ensure `.env.local` is in project root
- Restart development server after adding variables
- Check for syntax errors in .env.local

### Type errors?
- Ensure @types/nodemailer is installed
- Run `npm install --save-dev @types/nodemailer --legacy-peer-deps`
- TypeScript should recognize nodemailer types

## Next Steps

1. Complete all items in the checklist
2. Run `npm run test:email` to verify setup
3. Integrate email sending with booking creation
4. Test end-to-end booking flow with emails
5. Monitor email delivery in production

## Support Resources

- **Nodemailer Docs**: https://nodemailer.com/
- **Gmail Setup**: https://support.google.com/accounts/
- **SendGrid Docs**: https://docs.sendgrid.com/ (if using SendGrid)
- **AWS SES Docs**: https://docs.aws.amazon.com/ses/ (if using SES)

## Notes

- Email system is fully functional but requires configuration
- Test emails before going to production
- Monitor email delivery rates and handle bounces
- Keep email service credentials secure
- Review email templates regularly for improvements
