import { sendBookingConfirmationEmail } from '../src/lib/email';

function isPlaceholder(value?: string) {
  if (!value) return true;
  return value.includes('your-email@gmail.com') || value.includes('your-app-password');
}

async function testEmailConfiguration() {
  console.log('Testing booking confirmation email...\n');

  const emailUser = process.env.EMAIL_USER;
  const emailPassword = process.env.EMAIL_PASSWORD;
  const testTo = process.env.EMAIL_TEST_TO;

  if (isPlaceholder(emailUser) || isPlaceholder(emailPassword)) {
    console.error('❌ EMAIL_USER / EMAIL_PASSWORD are still placeholders in .env.local');
    console.error('   Set them to a real Gmail address and Gmail app password first.');
    process.exit(1);
  }

  const recipient = testTo || emailUser!;

  try {
    const result = await sendBookingConfirmationEmail({
      clientEmail: recipient,
      clientName: 'Email Test Client',
      therapistEmail: recipient,
      therapistName: 'Email Test Therapist',
      sessionType: 'personal',
      date: new Date().toISOString(),
      startTime: '10:00 AM',
      endTime: '10:45 AM',
      meetingLink: 'https://meet.google.com/test-link',
      meetingPassword: '123456',
    });

    if (!result) {
      console.error('❌ Email send returned false. Check the server console for SMTP errors.');
      process.exit(1);
    }

    console.log(`✅ Test email sent to ${recipient}`);
    console.log('   Check inbox and spam/promotions folders for both messages.');
  } catch (error) {
    console.error('❌ Email test failed:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  testEmailConfiguration().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { testEmailConfiguration };
