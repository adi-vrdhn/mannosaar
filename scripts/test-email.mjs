import nodemailer from 'nodemailer';

function isPlaceholder(value) {
  return !value || value.includes('your-email@gmail.com') || value.includes('your-app-password');
}

const emailUser = process.env.EMAIL_USER;
const emailPassword = process.env.EMAIL_PASSWORD;
const clientRecipient = process.env.EMAIL_TEST_TO || emailUser;
const therapistRecipient = process.env.THERAPIST_EMAIL || emailUser;
const emailFrom = process.env.EMAIL_FROM || emailUser;
const emailHost = process.env.EMAIL_HOST;
const emailPort = Number(process.env.EMAIL_PORT || '587');
const emailSecure = process.env.EMAIL_SECURE === 'true';

if (isPlaceholder(emailUser) || isPlaceholder(emailPassword)) {
  console.error('❌ EMAIL_USER / EMAIL_PASSWORD are not set to real values.');
  process.exit(1);
}

const transporter = nodemailer.createTransport(
  emailHost
    ? {
        host: emailHost,
        port: Number.isFinite(emailPort) ? emailPort : 587,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      }
    : {
        service: (process.env.EMAIL_SERVICE || 'gmail').toLowerCase(),
        port: Number.isFinite(emailPort) ? emailPort : 587,
        secure: emailSecure,
        auth: {
          user: emailUser,
          pass: emailPassword,
        },
      }
);

async function sendTestMail(to, subject, body) {
  await transporter.sendMail({
    from: emailFrom,
    to,
    subject,
    html: body,
  });
}

async function main() {
  console.log('Testing SMTP config...');

  await transporter.verify();
  console.log('✅ SMTP verified');

  await sendTestMail(
    clientRecipient,
    'Test: Patient confirmation email',
    '<p>This is a test of the patient confirmation email.</p>'
  );
  console.log(`✅ Sent test email to patient recipient: ${clientRecipient}`);

  if (therapistRecipient && therapistRecipient !== clientRecipient) {
    await sendTestMail(
      therapistRecipient,
      'Test: Therapist confirmation email',
      '<p>This is a test of the therapist confirmation email.</p>'
    );
    console.log(`✅ Sent test email to therapist recipient: ${therapistRecipient}`);
  }

  console.log('✅ Email test completed successfully');
}

main().catch((error) => {
  console.error('❌ Email test failed:', error);
  process.exit(1);
});
