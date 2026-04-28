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
  sessionSchedule?: Array<{
    date: string;
    startTime: string;
    endTime: string;
  }>;
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
    sessionSchedule,
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
    const schedule = sessionSchedule && sessionSchedule.length > 0
      ? sessionSchedule
      : [{ date, startTime, endTime }];

    const formatDisplayDate = (value: string) => {
      const parsed = new Date(value);
      if (Number.isNaN(parsed.getTime())) {
        return value;
      }

      return parsed.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    // Shared layout pieces for both emails
    const cardStyle =
      'background-color:#ffffff;padding:28px;border-radius:16px;box-shadow:0 12px 30px rgba(15,23,42,0.08);border:1px solid #eee;';
    const labelStyle = 'margin:10px 0;color:#334155;';
    const detailStyle = 'margin:8px 0;color:#0f172a;';

    // Email to client
    const clientEmailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:linear-gradient(180deg,#faf5ff 0%,#ffffff 100%);">
        <div style="${cardStyle}">
          <div style="display:inline-block;background:#ede9fe;color:#6d28d9;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">
            Booking confirmed
          </div>
          <h2 style="color:#1f2937;margin:18px 0 12px 0;font-size:28px;line-height:1.2;">Your session is booked</h2>

          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hi ${clientName},</p>
          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px 0;">
            Your therapy session has been successfully booked. Here is your appointment summary:
          </p>

          <div style="background:#f8fafc;padding:18px 20px;border-radius:14px;border:1px solid #e2e8f0;">
            <p style="${labelStyle}"><strong>Session type:</strong> ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</p>
            ${schedule.length > 1 ? `
              <div style="margin-top:12px;">
                <p style="${detailStyle}"><strong>Session schedule:</strong></p>
                <ul style="margin:0;padding-left:20px;color:#0f172a;">
                  ${schedule.map((entry) => `
                    <li style="margin:8px 0;">
                      ${formatDisplayDate(entry.date)} at ${entry.startTime} - ${entry.endTime}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : `
              <p style="${detailStyle}"><strong>Date:</strong> ${formatDisplayDate(schedule[0].date)}</p>
              <p style="${detailStyle}"><strong>Time:</strong> ${schedule[0].startTime} - ${schedule[0].endTime}</p>
            `}
            <p style="${detailStyle}"><strong>Therapist:</strong> ${therapistName}</p>
            ${meetingPassword ? `<p style="${detailStyle}"><strong>Meeting password:</strong> ${meetingPassword}</p>` : ''}
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:24px 0 10px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#7c3aed;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:700;">
                Join Google Meet
              </a>
            </div>
          ` : ''}

          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:24px 0 0 0;border-top:1px solid #e2e8f0;padding-top:18px;">
            If you need to cancel or reschedule, please visit your profile on our platform.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:12px 0 0 0;">
            If you face any problem, contact: +91 70806 33396
          </p>
        </div>
      </div>
    `;

    // Email to therapist
    const therapistEmailHtml = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:linear-gradient(180deg,#eff6ff 0%,#ffffff 100%);">
        <div style="${cardStyle}">
          <div style="display:inline-block;background:#dbeafe;color:#1d4ed8;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">
            New booking received
          </div>
          <h2 style="color:#1f2937;margin:18px 0 12px 0;font-size:28px;line-height:1.2;">A new session has been booked</h2>

          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hi ${therapistName},</p>
          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 20px 0;">
            You have a new therapy session booking. Here are the details:
          </p>

          <div style="background:#f8fafc;padding:18px 20px;border-radius:14px;border:1px solid #e2e8f0;">
            <p style="${detailStyle}"><strong>Client name:</strong> ${clientName}</p>
            <p style="${detailStyle}"><strong>Client email:</strong> ${clientEmail}</p>
            <p style="${detailStyle}"><strong>Session type:</strong> ${sessionType.charAt(0).toUpperCase() + sessionType.slice(1)}</p>
            ${schedule.length > 1 ? `
              <div style="margin-top:12px;">
                <p style="${detailStyle}"><strong>Session schedule:</strong></p>
                <ul style="margin:0;padding-left:20px;color:#0f172a;">
                  ${schedule.map((entry) => `
                    <li style="margin:8px 0;">
                      ${formatDisplayDate(entry.date)} at ${entry.startTime} - ${entry.endTime}
                    </li>
                  `).join('')}
                </ul>
              </div>
            ` : `
              <p style="${detailStyle}"><strong>Date:</strong> ${formatDisplayDate(schedule[0].date)}</p>
              <p style="${detailStyle}"><strong>Time:</strong> ${schedule[0].startTime} - ${schedule[0].endTime}</p>
            `}
            ${meetingPassword ? `<p style="${detailStyle}"><strong>Meeting password:</strong> ${meetingPassword}</p>` : ''}
          </div>

          ${meetingLink ? `
            <div style="text-align:center;margin:24px 0 10px 0;">
              <a href="${meetingLink}" style="display:inline-block;background:#2563eb;color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:12px;font-weight:700;">
                Open Google Meet
              </a>
            </div>
          ` : ''}

          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:24px 0 0 0;border-top:1px solid #e2e8f0;padding-top:18px;">
            You can manage this booking in your admin dashboard.
          </p>
          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:12px 0 0 0;">
            If you face any problem, contact: +91 70806 33396
          </p>
        </div>
      </div>
    `;

    // Send email to client
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: clientEmail,
      subject: '✅ Your therapy session is confirmed',
      html: clientEmailHtml,
    });

    // Send email to therapist
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: therapistEmail,
      subject: `📅 New booking from ${clientName}`,
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
