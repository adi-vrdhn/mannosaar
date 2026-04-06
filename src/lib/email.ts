import nodemailer from 'nodemailer';

// Create email transport (using Gmail SMTP - you can change this)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface BookingEmailData {
  clientEmail: string;
  clientName: string;
  therapistEmail: string;
  therapistName: string;
  sessionType: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  meetingPassword?: string;
}

export async function sendBookingConfirmationEmail(data: BookingEmailData) {
  const {
    clientEmail,
    clientName,
    therapistEmail,
    therapistName,
    sessionType,
    date,
    startTime,
    endTime,
    meetingLink,
    meetingPassword,
  } = data;

  try {
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const timeRange = `${startTime} - ${endTime}`;

    // Email to client
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">✅ Booking Confirmed!</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your therapy session has been successfully booked. Here are the details:
          </p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0; color: #333;"><strong>Session Type:</strong> ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Time:</strong> ${timeRange}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Therapist:</strong> ${therapistName}</p>
            ${meetingPassword ? `<p style="margin: 10px 0; color: #333;"><strong>Password:</strong> ${meetingPassword}</p>` : ''}
          </div>

          ${meetingLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${meetingLink}" style="display: inline-block; background-color: #4285f4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🎥 Join Google Meet
              </a>
            </div>
          ` : ''}

          <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            If you need to cancel or reschedule, please visit your profile on our platform.
          </p>
        </div>
      </div>
    `;

    // Email to therapist
    const therapistEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #333; margin-bottom: 20px;">📅 New Booking</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${therapistName},</p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            You have a new therapy session booking. Here are the details:
          </p>

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 10px 0; color: #333;"><strong>Client Name:</strong> ${clientName}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Client Email:</strong> ${clientEmail}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Session Type:</strong> ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Date:</strong> ${formattedDate}</p>
            <p style="margin: 10px 0; color: #333;"><strong>Time:</strong> ${timeRange}</p>
            ${meetingPassword ? `<p style="margin: 10px 0; color: #333;"><strong>Password:</strong> ${meetingPassword}</p>` : ''}
          </div>

          ${meetingLink ? `
            <div style="text-align: center; margin: 20px 0;">
              <a href="${meetingLink}" style="display: inline-block; background-color: #4285f4; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                🎥 Join Google Meet
              </a>
            </div>
          ` : ''}

          <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            You can manage this booking in your admin dashboard.
          </p>
        </div>
      </div>
    `;

    // Send email to client
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: '✅ Your Therapy Session is Confirmed',
      html: clientEmailHtml,
    });

    // Send email to therapist
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: therapistEmail,
      subject: `📅 New Booking from ${clientName}`,
      html: therapistEmailHtml,
    });

    console.log('✅ Booking confirmation emails sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking emails:', error);
    // Don't throw - let booking succeed even if email fails
    return false;
  }
}

interface BookingPostponeEmailData {
  clientEmail: string;
  clientName: string;
  therapistName: string;
  sessionType: string;
  oldDate: string;
  oldStartTime: string;
  oldEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
  reason?: string;
}

export async function sendBookingPostponedEmail(data: BookingPostponeEmailData) {
  const {
    clientEmail,
    clientName,
    therapistName,
    sessionType,
    oldDate,
    oldStartTime,
    oldEndTime,
    newDate,
    newStartTime,
    newEndTime,
    reason,
  } = data;

  try {
    // Format dates for display
    const oldFormattedDate = new Date(oldDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const newFormattedDate = new Date(newDate).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const oldTimeRange = `${oldStartTime} - ${oldEndTime}`;
    const newTimeRange = `${newStartTime} - ${newEndTime}`;

    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
        <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="color: #9333ea; margin-bottom: 20px;">📅 Session Rescheduled</h2>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">Hi ${clientName},</p>
          
          <p style="color: #666; font-size: 16px; line-height: 1.6;">
            Your therapy session with <strong>${therapistName}</strong> has been rescheduled. Please see the updated details below:
          </p>

          ${reason ? `
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p style="color: #92400e; margin: 0; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
            </div>
          ` : ''}

          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p style="margin: 15px 0 10px 0; color: #333;"><strong style="color: #d32f2f;">Old Session Time:</strong></p>
            <p style="margin: 5px 0; color: #666; text-decoration: line-through;">
              ${oldFormattedDate} at ${oldTimeRange}
            </p>
            
            <p style="margin: 20px 0 10px 0; color: #333;"><strong style="color: #388e3c;">New Session Time:</strong></p>
            <p style="margin: 5px 0; color: #388e3c; font-weight: bold;">
              ${newFormattedDate} at ${newTimeRange}
            </p>

            <p style="margin: 15px 0 5px 0; color: #333;"><strong>Session Type:</strong> ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</p>
            <p style="margin: 5px 0; color: #333;"><strong>Therapist:</strong> ${therapistName}</p>
          </div>

          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; border-radius: 5px; margin: 20px 0;">
            <p style="color: #1565c0; margin: 0; font-size: 14px;">
              ℹ️ Make sure to update your calendar and set a reminder for the new session time.
            </p>
          </div>

          <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            If you have any questions about this rescheduling, please contact ${therapistName} directly.
          </p>
        </div>
      </div>
    `;

    // Send email to client
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: '📅 Your Therapy Session Has Been Rescheduled',
      html: emailHtml,
    });

    console.log('✅ Booking postponed email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking postponed email:', error);
    return false;
  }
}
