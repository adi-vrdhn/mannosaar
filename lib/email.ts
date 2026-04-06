import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  service: process.env.EMAIL_SERVICE || 'gmail',
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
};

// Create transporter
const transporter = nodemailer.createTransport(emailConfig);

// Verify transporter connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

interface EmailOptions {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

export async function sendEmail(options: EmailOptions) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
      ...options,
    };

    const result = await transporter.sendMail(mailOptions);
    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}

// Send booking confirmation email
export async function sendBookingConfirmation(
  email: string,
  bookingDetails: {
    bookingId: string;
    therapistName: string;
    date: string;
    time: string;
    duration: string;
    meetingLink?: string;
  }
) {
  const { bookingId, therapistName, date, time, duration, meetingLink } = bookingDetails;

  const html = `
    <h2>Booking Confirmation</h2>
    <p>Hello,</p>
    <p>Your booking has been confirmed!</p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Booking Details</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Therapist:</strong> ${therapistName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Duration:</strong> ${duration} minutes</p>
      ${meetingLink ? `<p><strong>Meeting Link:</strong> <a href="${meetingLink}">${meetingLink}</a></p>` : ''}
    </div>
    <p>Please arrive 5 minutes early.</p>
    <p>Thank you for booking with us!</p>
  `;

  return sendEmail({
    to: email,
    subject: `Booking Confirmation - ${therapistName}`,
    html,
  });
}

// Send booking cancellation email
export async function sendBookingCancellation(
  email: string,
  bookingDetails: {
    bookingId: string;
    therapistName: string;
    date: string;
    time: string;
  }
) {
  const { bookingId, therapistName, date, time } = bookingDetails;

  const html = `
    <h2>Booking Cancellation</h2>
    <p>Hello,</p>
    <p>Your booking has been cancelled.</p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Cancelled Booking Details</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Therapist:</strong> ${therapistName}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
    </div>
    <p>If you have any questions, please contact us.</p>
  `;

  return sendEmail({
    to: email,
    subject: `Booking Cancellation - ${bookingId}`,
    html,
  });
}

// Send therapist notification email
export async function sendTherapistNotification(
  therapistEmail: string,
  bookingDetails: {
    bookingId: string;
    clientName: string;
    clientEmail: string;
    date: string;
    time: string;
    duration: string;
    notes?: string;
  }
) {
  const { bookingId, clientName, clientEmail, date, time, duration, notes } = bookingDetails;

  const html = `
    <h2>New Booking Notification</h2>
    <p>Hello,</p>
    <p>You have a new booking!</p>
    <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
      <h3>Booking Details</h3>
      <p><strong>Booking ID:</strong> ${bookingId}</p>
      <p><strong>Client Name:</strong> ${clientName}</p>
      <p><strong>Client Email:</strong> ${clientEmail}</p>
      <p><strong>Date:</strong> ${date}</p>
      <p><strong>Time:</strong> ${time}</p>
      <p><strong>Duration:</strong> ${duration} minutes</p>
      ${notes ? `<p><strong>Notes:</strong> ${notes}</p>` : ''}
    </div>
  `;

  return sendEmail({
    to: therapistEmail,
    subject: `New Booking - ${bookingId}`,
    html,
  });
}

// Send password reset email
export async function sendPasswordResetEmail(
  email: string,
  resetLink: string
) {
  const html = `
    <h2>Password Reset Request</h2>
    <p>Hello,</p>
    <p>We received a request to reset your password. Click the link below to proceed:</p>
    <p><a href="${resetLink}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
    <p>Or copy this link: ${resetLink}</p>
    <p>This link will expire in 24 hours.</p>
    <p>If you didn't request this, please ignore this email.</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Password Reset Request',
    html,
  });
}

// Send welcome email
export async function sendWelcomeEmail(
  email: string,
  name: string
) {
  const html = `
    <h2>Welcome!</h2>
    <p>Hello ${name},</p>
    <p>Thank you for joining us. We're excited to have you on board!</p>
    <p>You can now:</p>
    <ul>
      <li>Book appointments with our therapists</li>
      <li>View your booking history</li>
      <li>Update your profile</li>
      <li>Read our blog for wellness tips</li>
    </ul>
    <p>If you have any questions, feel free to contact us.</p>
    <p>Welcome to our community!</p>
  `;

  return sendEmail({
    to: email,
    subject: 'Welcome to MH Platform',
    html,
  });
}
