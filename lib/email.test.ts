import {
  sendEmail,
  sendBookingConfirmation,
  sendBookingCancellation,
  sendTherapistNotification,
  sendPasswordResetEmail,
  sendWelcomeEmail,
} from './email';

/**
 * Test email configuration
 * Run this to verify your email setup works
 */
async function testEmailConfiguration() {
  console.log('Testing email configuration...\n');

  try {
    // Test 1: Basic email send
    console.log('1. Testing basic email send...');
    await sendEmail({
      to: process.env.EMAIL_TEST_TO || 'test@example.com',
      subject: 'Email Configuration Test',
      html: '<p>If you see this, your email configuration is working!</p>',
    });
    console.log('✓ Basic email sent successfully\n');

    // Test 2: Booking confirmation
    console.log('2. Testing booking confirmation email...');
    await sendBookingConfirmation(
      process.env.EMAIL_TEST_TO || 'test@example.com',
      {
        bookingId: 'TEST-001',
        therapistName: 'Dr. Jane Smith',
        date: 'Monday, April 15, 2024',
        time: '2:00 PM',
        duration: '60',
        meetingLink: 'https://zoom.us/j/test123',
      }
    );
    console.log('✓ Booking confirmation sent successfully\n');

    // Test 3: Booking cancellation
    console.log('3. Testing booking cancellation email...');
    await sendBookingCancellation(
      process.env.EMAIL_TEST_TO || 'test@example.com',
      {
        bookingId: 'TEST-001',
        therapistName: 'Dr. Jane Smith',
        date: 'Monday, April 15, 2024',
        time: '2:00 PM',
      }
    );
    console.log('✓ Booking cancellation sent successfully\n');

    // Test 4: Therapist notification
    console.log('4. Testing therapist notification email...');
    await sendTherapistNotification(
      process.env.EMAIL_TEST_TO || 'test@example.com',
      {
        bookingId: 'TEST-001',
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        date: 'Monday, April 15, 2024',
        time: '2:00 PM',
        duration: '60',
        notes: 'First-time client',
      }
    );
    console.log('✓ Therapist notification sent successfully\n');

    // Test 5: Password reset email
    console.log('5. Testing password reset email...');
    await sendPasswordResetEmail(
      process.env.EMAIL_TEST_TO || 'test@example.com',
      'https://yourapp.com/reset?token=abc123def456'
    );
    console.log('✓ Password reset email sent successfully\n');

    // Test 6: Welcome email
    console.log('6. Testing welcome email...');
    await sendWelcomeEmail(
      process.env.EMAIL_TEST_TO || 'test@example.com',
      'John Doe'
    );
    console.log('✓ Welcome email sent successfully\n');

    console.log('✅ All email tests passed! Your email configuration is working correctly.');
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

// Run the test
if (require.main === module) {
  testEmailConfiguration().catch(console.error);
}

export { testEmailConfiguration };
