# Email System Integration Guide

This guide explains how to integrate the email system with your application features.

## Table of Contents
1. [Booking Confirmation Workflow](#booking-confirmation-workflow)
2. [Booking Cancellation Workflow](#booking-cancellation-workflow)
3. [User Registration Workflow](#user-registration-workflow)
4. [API Integration Examples](#api-integration-examples)

## Booking Confirmation Workflow

When a user creates a booking, follow these steps:

### Step 1: Create Booking in Database

```typescript
// src/app/api/bookings/create/route.ts
import { sendEmail } from '@/lib/email';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const supabase = createClient();

    // Create booking
    const { data: booking, error } = await supabase
      .from('bookings')
      .insert([{
        user_id: body.userId,
        therapist_id: body.therapistId,
        booking_date: body.date,
        start_time: body.time,
        duration: body.duration,
        notes: body.notes,
      }])
      .select()
      .single();

    if (error) throw error;

    // Send confirmation emails
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/send-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId: booking.id }),
    });

    return NextResponse.json({
      success: true,
      bookingId: booking.id,
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
```

### Step 2: Send Confirmation Emails

The `/api/bookings/send-confirmation` route (already created) automatically:
- Sends confirmation to the client
- Sends notification to the therapist

## Booking Cancellation Workflow

When a user cancels a booking:

### Step 1: Update Booking Status

```typescript
// src/app/api/bookings/cancel/route.ts
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { bookingId } = await request.json();
    const supabase = createClient();

    // Update booking status
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
      .eq('id', bookingId);

    if (error) throw error;

    // Send cancellation email
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/bookings/send-cancellation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bookingId }),
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return NextResponse.json(
      { error: 'Failed to cancel booking' },
      { status: 500 }
    );
  }
}
```

### Step 2: Automated Email Sent

The cancellation email is automatically sent to the client.

## User Registration Workflow

When a new user registers, send a welcome email:

### Step 1: Send Welcome Email

```typescript
// src/app/api/auth/register/route.ts
import { sendWelcomeEmail } from '@/lib/email';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { email, fullName } = await request.json();

    // Create user in auth system (using your auth provider)
    // ...

    // Send welcome email
    await sendWelcomeEmail(email, fullName);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Registration error:', error);
    return NextResponse.json(
      { error: 'Registration failed' },
      { status: 500 }
    );
  }
}
```

## API Integration Examples

### Example 1: Send Custom Email

```typescript
import { sendEmail } from '@/lib/email';

// Send custom email
await sendEmail({
  to: 'user@example.com',
  subject: 'Custom Subject',
  html: '<h1>Custom HTML Content</h1>',
});
```

### Example 2: Send Email from Client Component

```typescript
// components/BookingConfirmation.tsx
'use client';

import { useRouter } from 'next/navigation';

export function BookingConfirmation({ bookingId }: { bookingId: string }) {
  const router = useRouter();

  const sendConfirmation = async () => {
    try {
      const response = await fetch('/api/bookings/send-confirmation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      if (response.ok) {
        alert('Confirmation email sent!');
      }
    } catch (error) {
      console.error('Error sending confirmation:', error);
      alert('Failed to send confirmation email');
    }
  };

  return (
    <div>
      <h2>Booking Confirmed</h2>
      <button onClick={sendConfirmation}>
        Resend Confirmation Email
      </button>
    </div>
  );
}
```

### Example 3: Send Email from Server Action

```typescript
// lib/actions/sendEmails.ts
'use server';

import { sendBookingConfirmation } from '@/lib/email';

export async function sendConfirmationEmail(
  email: string,
  bookingDetails: any
) {
  try {
    await sendBookingConfirmation(email, bookingDetails);
    return { success: true };
  } catch (error) {
    console.error('Error:', error);
    return { success: false, error: 'Failed to send email' };
  }
}
```

Usage in client component:

```typescript
'use client';

import { sendConfirmationEmail } from '@/lib/actions/sendEmails';

export function ConfirmationButton() {
  const handleSend = async () => {
    const result = await sendConfirmationEmail('user@example.com', {
      bookingId: 'BOOK-123',
      therapistName: 'Dr. Smith',
      date: '2024-04-15',
      time: '2:00 PM',
      duration: '60',
    });

    if (result.success) {
      alert('Email sent!');
    }
  };

  return <button onClick={handleSend}>Send Email</button>;
}
```

## Environment Variables

Ensure these are set in `.env.local`:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=your-email@gmail.com

# For testing
EMAIL_TEST_TO=test@example.com

# App URL for email links
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Testing

Run the email test suite:

```bash
node lib/email.test.ts
```

Or using npm script (if configured):

```bash
npm run test:email
```

## Error Handling

All email functions are async and may throw errors:

```typescript
try {
  await sendBookingConfirmation('user@example.com', bookingDetails);
} catch (error) {
  // Handle error
  console.error('Email failed:', error);
  // Optionally retry or notify admin
}
```

## Retry Logic (Optional)

For production, implement retry logic:

```typescript
async function sendEmailWithRetry(
  emailFn: () => Promise<any>,
  maxRetries = 3
) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await emailFn();
    } catch (error) {
      lastError = error;
      // Wait before retry (exponential backoff)
      await new Promise(resolve =>
        setTimeout(resolve, Math.pow(2, i) * 1000)
      );
    }
  }

  throw lastError;
}

// Usage
await sendEmailWithRetry(() =>
  sendBookingConfirmation('user@example.com', details)
);
```

## Email Queue (Optional for Production)

For high-volume applications, implement email queuing:

```bash
npm install bull redis
```

```typescript
import Queue from 'bull';

const emailQueue = new Queue('emails', {
  redis: { host: '127.0.0.1', port: 6379 },
});

// Add email job
await emailQueue.add({
  type: 'booking-confirmation',
  email: 'user@example.com',
  bookingDetails: {...},
});

// Process jobs
emailQueue.process(async (job) => {
  const { type, ...data } = job.data;

  switch (type) {
    case 'booking-confirmation':
      return await sendBookingConfirmation(data.email, data.bookingDetails);
    // ... handle other types
  }
});
```

## Monitoring & Logging

Track email sending:

```typescript
async function sendEmailWithLogging(options: EmailOptions) {
  const startTime = Date.now();

  try {
    const result = await sendEmail(options);
    const duration = Date.now() - startTime;

    console.log(`Email sent: ${options.to} (${duration}ms)`);
    // Log to monitoring service (Sentry, LogRocket, etc.)

    return result;
  } catch (error) {
    console.error(`Email failed: ${options.to}`, error);
    // Log error to monitoring service
    throw error;
  }
}
```

## Best Practices

1. **Always validate email addresses** before sending
2. **Use try-catch** for all email operations
3. **Log email sends** for debugging and monitoring
4. **Implement rate limiting** to prevent abuse
5. **Use email templates** for consistency
6. **Test in development** using services like Mailtrap
7. **Monitor delivery rates** and bounce rates
8. **Set up SPF/DKIM** for production domains
9. **Handle failures gracefully** with user-friendly messages
10. **Consider user preferences** for email frequency

## Troubleshooting

See [EMAIL_SETUP.md](./EMAIL_SETUP.md) for troubleshooting common issues.
