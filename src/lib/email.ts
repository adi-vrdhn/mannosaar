import nodemailer from 'nodemailer';

type EmailTransport = ReturnType<typeof nodemailer.createTransport>;

function getEmailPort() {
  const port = Number(process.env.EMAIL_PORT || '587');
  return Number.isFinite(port) ? port : 587;
}

function createTransportConfig() {
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASSWORD;

  if (!user || !pass) {
    throw new Error('EMAIL_USER and EMAIL_PASSWORD must be set before sending email');
  }

  const secure = process.env.EMAIL_SECURE === 'true';
  const host = process.env.EMAIL_HOST?.trim();

  if (host) {
    return {
      host,
      port: getEmailPort(),
      secure,
      auth: {
        user,
        pass,
      },
    };
  }

  return {
    service: (process.env.EMAIL_SERVICE || 'gmail').toLowerCase(),
    port: getEmailPort(),
    secure,
    auth: {
      user,
      pass,
    },
  };
}

let transporter: EmailTransport | null = null;
let transporterVerifyPromise: Promise<void> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport(createTransportConfig());
  }

  return transporter;
}

async function ensureTransporterReady() {
  if (!transporterVerifyPromise) {
    transporterVerifyPromise = getTransporter().verify().then(() => undefined);
  }

  return transporterVerifyPromise;
}

function getFromAddress() {
  return process.env.EMAIL_FROM || process.env.EMAIL_USER || '';
}

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function transactionalHtml(title: string, intro: string, rows: Array<[string, string]>, action?: { label: string; href: string }) {
  return `<div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#faf7fc">
    <div style="background:#fff;padding:28px;border:1px solid #e9e2ed;border-radius:16px">
      <p style="margin:0 0 8px;color:#6b2a86;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase">Mannosaar</p>
      <h2 style="margin:0 0 16px;color:#25152e;font-size:26px">${escapeHtml(title)}</h2>
      <p style="color:#475569;font-size:16px;line-height:1.65">${escapeHtml(intro)}</p>
      ${rows.length ? `<div style="margin-top:20px;padding:16px 18px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px">${rows.map(([label, value]) => `<p style="margin:8px 0;color:#334155"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(value)}</p>`).join('')}</div>` : ''}
      ${action ? `<p style="margin:24px 0 4px"><a href="${escapeHtml(action.href)}" style="display:inline-block;padding:12px 20px;border-radius:10px;background:#5b267a;color:#fff;text-decoration:none;font-weight:700">${escapeHtml(action.label)}</a></p>` : ''}
      <p style="margin:24px 0 0;padding-top:16px;border-top:1px solid #e2e8f0;color:#64748b;font-size:13px">Need help? Email care@mannosaar.com.</p>
    </div>
  </div>`;
}

async function sendTransactional(to: string | string[], subject: string, html: string) {
  try {
    await ensureTransporterReady();
    await getTransporter().sendMail({ from: getFromAddress(), to, subject, html });
    return true;
  } catch (error) {
    console.error(`Failed to send transactional email (${subject}):`, error);
    return false;
  }
}

export async function sendPaymentReceiptEmail(data: {
  clientEmail: string; clientName: string; amount: number; currency?: string; reference: string;
  provider: string; method?: string | null; sessionType: string;
}) {
  const amount = new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.currency || 'INR' }).format(data.amount);
  return sendTransactional(
    data.clientEmail,
    'Payment receipt for your Mannosaar booking',
    transactionalHtml('Payment received', `Hi ${data.clientName}, your payment has been received successfully.`, [
      ['Amount paid', amount], ['Session', data.sessionType], ['Provider', data.provider],
      ['Payment method', data.method || 'Not recorded'], ['Reference', data.reference],
    ])
  );
}

export async function sendRefundStatusEmail(data: {
  clientEmail: string; clientName: string; amount?: number | null; currency?: string; reference: string; status: string; reason?: string;
}) {
  const amount = data.amount == null ? 'Not available' : new Intl.NumberFormat('en-IN', { style: 'currency', currency: data.currency || 'INR' }).format(data.amount);
  const status = data.status.replaceAll('_', ' ').toLowerCase();
  return sendTransactional(
    data.clientEmail,
    `Refund ${status} – Mannosaar`,
    transactionalHtml(`Refund ${status}`, `Hi ${data.clientName}, here is the latest update on your refund.`, [
      ['Status', status], ['Refund amount', amount], ['Payment reference', data.reference],
      ...(data.reason ? [['Reason', data.reason] as [string, string]] : []),
    ])
  );
}

export async function sendTherapistNoteNotificationEmail(data: {
  clientEmail: string; clientName: string; therapistName: string; profileUrl: string;
}) {
  return sendTransactional(
    data.clientEmail,
    'A note from your therapist is available',
    transactionalHtml('New therapist note', `Hi ${data.clientName}, ${data.therapistName} added a note to your session. For privacy, the note is available only after you sign in.`, [], { label: 'View note securely', href: data.profileUrl })
  );
}

export async function sendPrivacyRequestAcknowledgementEmail(data: {
  clientEmail: string; clientName: string; requestType: string; requestId: string;
}) {
  return sendTransactional(
    data.clientEmail,
    'We received your privacy request',
    transactionalHtml('Privacy request received', `Hi ${data.clientName}, we have recorded your request and will review it.`, [
      ['Request type', data.requestType.replaceAll('_', ' ').toLowerCase()], ['Request ID', data.requestId], ['Status', 'Submitted'],
    ])
  );
}

export async function sendSupportRequestEmails(data: {
  clientEmail: string; clientName: string; subject: string; message: string; requestId: string; supportEmail: string;
}) {
  const acknowledgement = await sendTransactional(
    data.clientEmail,
    'We received your Mannosaar support request',
    transactionalHtml('Support request received', `Hi ${data.clientName}, our team has received your message.`, [
      ['Subject', data.subject], ['Request ID', data.requestId],
    ])
  );
  const notification = await sendTransactional(
    data.supportEmail,
    `Support request: ${data.subject}`,
    transactionalHtml('New support request', 'A user submitted a support request from their account.', [
      ['Name', data.clientName], ['Email', data.clientEmail], ['Request ID', data.requestId], ['Subject', data.subject], ['Message', data.message],
    ])
  );
  return acknowledgement && notification;
}

export async function sendWelcomeEmail(email: string, name: string, profileUrl: string) {
  return sendTransactional(
    email,
    'Welcome to Mannosaar',
    transactionalHtml('Welcome to Mannosaar', `Hi ${name}, your account is ready. You can book sessions and manage appointments from your private profile.`, [], { label: 'Open your account', href: profileUrl })
  );
}


interface BookingEmailData {
  clientEmail: string;
  clientName: string;
  therapistEmail: string | string[];
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
  clientNote?: string | null;
}

interface SessionReminderEmailData {
  recipientType: 'client' | 'therapist';
  recipientEmail: string | string[];
  clientName: string;
  therapistName: string;
  sessionType: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  sessionNumber?: number;
  totalSessions?: number;
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
    clientNote,
  } = data;

  try {
    await ensureTransporterReady();

    // Format date for display
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
            ${clientNote ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0;"><p style="${detailStyle}"><strong>Client note:</strong></p><p style="margin:6px 0 0;color:#475569;white-space:pre-wrap;">${escapeHtml(clientNote)}</p></div>` : ''}
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
            ${clientNote ? `<div style="margin-top:16px;padding-top:14px;border-top:1px solid #e2e8f0;"><p style="${detailStyle}"><strong>Client note:</strong></p><p style="margin:6px 0 0;color:#475569;white-space:pre-wrap;">${escapeHtml(clientNote)}</p></div>` : ''}
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
    await getTransporter().sendMail({
      from: getFromAddress(),
      to: clientEmail,
      subject: '✅ Your therapy session is confirmed',
      html: clientEmailHtml,
    });

    // Send email to therapist
    await getTransporter().sendMail({
      from: getFromAddress(),
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

export async function sendSessionReminderEmail(data: SessionReminderEmailData) {
  const {
    recipientType,
    recipientEmail,
    clientName,
    therapistName,
    sessionType,
    date,
    startTime,
    endTime,
    meetingLink,
    sessionNumber,
    totalSessions,
  } = data;

  try {
    await ensureTransporterReady();

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const sessionLabel =
      sessionNumber && totalSessions
        ? `Session ${sessionNumber} of ${totalSessions}`
        : 'Upcoming session';

    const greeting = recipientType === 'client' ? `Hi ${clientName},` : `Hi ${therapistName},`;
    const title =
      recipientType === 'client'
        ? 'Your session starts in 1 hour'
        : `Upcoming session with ${clientName} starts in 1 hour`;
    const intro =
      recipientType === 'client'
        ? `This is a reminder that your ${sessionType.toLowerCase()} session is coming up soon.`
        : `This is a reminder for your ${sessionType.toLowerCase()} session with ${clientName}.`;

    const details =
      recipientType === 'client'
        ? `
          <p style="margin:10px 0;color:#0f172a;"><strong>Therapist:</strong> ${therapistName}</p>
          <p style="margin:10px 0;color:#0f172a;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin:10px 0;color:#0f172a;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        `
        : `
          <p style="margin:10px 0;color:#0f172a;"><strong>Client:</strong> ${clientName}</p>
          <p style="margin:10px 0;color:#0f172a;"><strong>Date:</strong> ${formattedDate}</p>
          <p style="margin:10px 0;color:#0f172a;"><strong>Time:</strong> ${startTime} - ${endTime}</p>
        `;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:linear-gradient(180deg,#f8fafc 0%,#ffffff 100%);">
        <div style="background:#ffffff;padding:28px;border-radius:18px;border:1px solid #e2e8f0;box-shadow:0 12px 30px rgba(15,23,42,0.06);">
          <div style="display:inline-block;background:${recipientType === 'client' ? '#ede9fe' : '#dbeafe'};color:${recipientType === 'client' ? '#6d28d9' : '#1d4ed8'};padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">
            Session reminder
          </div>
          <h2 style="color:#111827;margin:18px 0 10px 0;font-size:28px;line-height:1.2;">${title}</h2>
          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 14px 0;">${greeting}</p>
          <p style="color:#475569;font-size:16px;line-height:1.7;margin:0 0 18px 0;">${intro}</p>

          <div style="background:#f8fafc;padding:18px 20px;border-radius:14px;border:1px solid #e2e8f0;">
            <p style="margin:0 0 14px 0;color:#6b7280;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${sessionLabel}</p>
            ${details}
            <p style="margin:10px 0;color:#0f172a;"><strong>Therapist:</strong> ${therapistName}</p>
            ${meetingLink ? `<p style="margin:10px 0;color:#0f172a;word-break:break-all;"><strong>Meeting link:</strong> <a href="${meetingLink}" style="color:#2563eb;">${meetingLink}</a></p>` : ''}
          </div>

          <p style="color:#64748b;font-size:14px;line-height:1.6;margin:22px 0 0 0;border-top:1px solid #e2e8f0;padding-top:16px;">
            Please join a few minutes early so we can start on time.
          </p>
        </div>
      </div>
    `;

    await getTransporter().sendMail({
      from: getFromAddress(),
      to: recipientEmail,
      subject:
        recipientType === 'client'
          ? `⏰ Reminder: Your session is in 1 hour`
          : `⏰ Reminder: Session with ${clientName} is in 1 hour`,
      html,
    });

    console.log(
      `✅ Session reminder email sent to ${
        Array.isArray(recipientEmail) ? recipientEmail.join(', ') : recipientEmail
      } (${recipientType})`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to send session reminder email:', error);
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
  meetingLink?: string;
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
    meetingLink,
  } = data;

  try {
    await ensureTransporterReady();

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

          ${meetingLink ? `
            <div style="margin: 20px 0; text-align: center;">
              <a href="${meetingLink}" style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 22px;border-radius:10px;font-weight:700;">
                Join New Meeting
              </a>
              <p style="margin:10px 0 0 0;color:#666;font-size:13px;word-break:break-all;">
                ${meetingLink}
              </p>
            </div>
          ` : ''}

          <p style="color: #999; font-size: 14px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            If you have any questions about this rescheduling, please contact ${therapistName} directly.
          </p>
        </div>
      </div>
    `;

    // Send email to client
    await getTransporter().sendMail({
      from: getFromAddress(),
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

export async function sendAdminRescheduleNotificationEmail(data: {
  recipients: string | string[];
  bookingId: string;
  clientName: string;
  clientEmail: string;
  sessionType: string;
  oldDate: string;
  oldStartTime: string;
  oldEndTime: string;
  newDate: string;
  newStartTime: string;
  newEndTime: string;
}) {
  return sendTransactional(
    data.recipients,
    `Session rescheduled by ${data.clientName}`,
    transactionalHtml(
      'A client rescheduled a session',
      `${data.clientName} changed an existing booking. The same booking record has been updated.`,
      [
        ['Client', `${data.clientName} (${data.clientEmail})`],
        ['Session', data.sessionType],
        ['Previous time', `${data.oldDate}, ${data.oldStartTime}–${data.oldEndTime}`],
        ['New time', `${data.newDate}, ${data.newStartTime}–${data.newEndTime}`],
        ['Booking ID', data.bookingId],
      ],
    ),
  );
}

interface BookingCancellationEmailData {
  clientEmail: string;
  clientName: string;
  therapistName: string;
  date: string;
  time: string;
}

export async function sendBookingCancellationEmail(data: BookingCancellationEmailData) {
  const { clientEmail, clientName, therapistName, date, time } = data;

  try {
    await ensureTransporterReady();

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;padding:24px;background:#f8fafc;">
        <div style="background:#ffffff;padding:28px;border-radius:16px;border:1px solid #e2e8f0;">
          <div style="display:inline-block;background:#fee2e2;color:#b91c1c;padding:8px 12px;border-radius:999px;font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;">
            Booking cancelled
          </div>
          <h2 style="color:#111827;margin:18px 0 12px 0;font-size:28px;line-height:1.2;">Your session has been cancelled</h2>

          <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 16px 0;">Hi ${clientName},</p>
          <p style="color:#374151;font-size:16px;line-height:1.7;margin:0 0 20px 0;">
            Your therapy session with ${therapistName} scheduled for ${formattedDate} at ${time} has been cancelled.
          </p>

          <p style="color:#6b7280;font-size:14px;line-height:1.6;margin:24px 0 0 0;border-top:1px solid #e5e7eb;padding-top:18px;">
            If you have any questions or would like to reschedule, please contact us on the platform.
          </p>
        </div>
      </div>
    `;

    await getTransporter().sendMail({
      from: getFromAddress(),
      to: clientEmail,
      subject: 'Your therapy session has been cancelled',
      html,
    });

    console.log('✅ Booking cancellation email sent successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to send booking cancellation email:', error);
    return false;
  }
}
