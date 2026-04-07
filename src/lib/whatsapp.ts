import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_WHATSAPP_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

interface WhatsAppMessageData {
  toPhoneNumber: string;
  clientName: string;
  therapistName: string;
  date: string;
  startTime: string;
  endTime: string;
  meetingLink?: string;
  sessionType?: string;
}

interface RescheduleMessageData extends WhatsAppMessageData {
  oldDate: string;
  oldStartTime: string;
  oldEndTime: string;
}

interface ReminderMessageData extends WhatsAppMessageData {
  hoursUntil: number;
}

/**
 * Send booking confirmation via WhatsApp
 */
export async function sendBookingConfirmationWhatsApp(data: WhatsAppMessageData) {
  const {
    toPhoneNumber,
    clientName,
    therapistName,
    date,
    startTime,
    endTime,
    meetingLink,
    sessionType = 'Therapy Session',
  } = data;

  if (!client || !twilioPhoneNumber) {
    console.log('⚠️ Twilio not configured. Skipping WhatsApp message.');
    return { success: false, message: 'Twilio not configured' };
  }

  try {
    // Format date for display
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    let messageBody = `✅ *Booking Confirmed!*\n\n`;
    messageBody += `Hi ${clientName},\n\n`;
    messageBody += `Your ${sessionType} session is confirmed:\n\n`;
    messageBody += `📅 Date: ${formattedDate}\n`;
    messageBody += `⏰ Time: ${startTime} - ${endTime}\n`;
    messageBody += `👤 Therapist: ${therapistName}\n`;
    
    if (meetingLink) {
      messageBody += `\n🎥 Meeting Link: ${meetingLink}\n`;
    }

    messageBody += `\nIf you need to reschedule or cancel, visit your profile on the platform.`;

    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      body: messageBody,
      to: `whatsapp:${toPhoneNumber}`,
    });

    console.log(`✅ Booking confirmation WhatsApp sent to ${toPhoneNumber}:`, message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('❌ Error sending booking confirmation WhatsApp:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send reschedule notification via WhatsApp
 */
export async function sendRescheduleNotificationWhatsApp(data: RescheduleMessageData) {
  const {
    toPhoneNumber,
    clientName,
    therapistName,
    date,
    startTime,
    endTime,
    oldDate,
    oldStartTime,
    oldEndTime,
    meetingLink,
    sessionType = 'Therapy Session',
  } = data;

  if (!client || !twilioPhoneNumber) {
    console.log('⚠️ Twilio not configured. Skipping WhatsApp message.');
    return { success: false, message: 'Twilio not configured' };
  }

  try {
    const formattedOldDate = new Date(oldDate).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const formattedNewDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    let messageBody = `🔄 *Session Rescheduled!*\n\n`;
    messageBody += `Hi ${clientName},\n\n`;
    messageBody += `Your ${sessionType} session has been rescheduled.\n\n`;
    messageBody += `❌ Old Time:\n`;
    messageBody += `📅 ${formattedOldDate} at ${oldStartTime} - ${oldEndTime}\n\n`;
    messageBody += `✅ New Time:\n`;
    messageBody += `📅 ${formattedNewDate} at ${startTime} - ${endTime}\n`;
    messageBody += `👤 Therapist: ${therapistName}\n`;
    
    if (meetingLink) {
      messageBody += `\n🎥 Meeting Link: ${meetingLink}\n`;
    }

    messageBody += `\nPlease confirm you received this update.`;

    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      body: messageBody,
      to: `whatsapp:${toPhoneNumber}`,
    });

    console.log(`✅ Reschedule notification WhatsApp sent to ${toPhoneNumber}:`, message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('❌ Error sending reschedule notification WhatsApp:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send session reminder via WhatsApp
 */
export async function sendSessionReminderWhatsApp(data: ReminderMessageData) {
  const {
    toPhoneNumber,
    clientName,
    therapistName,
    date,
    startTime,
    endTime,
    meetingLink,
    hoursUntil,
    sessionType = 'Therapy Session',
  } = data;

  if (!client || !twilioPhoneNumber) {
    console.log('⚠️ Twilio not configured. Skipping WhatsApp message.');
    return { success: false, message: 'Twilio not configured' };
  }

  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });

    let messageBody = `⏰ *Session Reminder!*\n\n`;
    messageBody += `Hi ${clientName},\n\n`;
    messageBody += `Reminder: Your ${sessionType} session is in approximately ${hoursUntil} hours.\n\n`;
    messageBody += `📅 Date: ${formattedDate}\n`;
    messageBody += `⏰ Time: ${startTime} - ${endTime}\n`;
    messageBody += `👤 Therapist: ${therapistName}\n`;
    
    if (meetingLink) {
      messageBody += `\n🎥 Join here: ${meetingLink}\n`;
    }

    messageBody += `\nMake sure you're in a quiet, comfortable space for the session.`;

    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      body: messageBody,
      to: `whatsapp:${toPhoneNumber}`,
    });

    console.log(`✅ Session reminder WhatsApp sent to ${toPhoneNumber}:`, message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('❌ Error sending session reminder WhatsApp:', error);
    return { success: false, error: (error as Error).message };
  }
}

/**
 * Send cancellation notification via WhatsApp
 */
export async function sendCancellationNotificationWhatsApp(
  toPhoneNumber: string,
  clientName: string,
  date: string,
  startTime: string
) {
  if (!client || !twilioPhoneNumber) {
    console.log('⚠️ Twilio not configured. Skipping WhatsApp message.');
    return { success: false, message: 'Twilio not configured' };
  }

  try {
    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });

    const messageBody = `❌ *Session Cancelled*\n\nHi ${clientName},\n\nYour therapy session scheduled for ${formattedDate} at ${startTime} has been cancelled.\n\nIf you'd like to reschedule, please visit your profile on the platform.`;

    const message = await client.messages.create({
      from: `whatsapp:${twilioPhoneNumber}`,
      body: messageBody,
      to: `whatsapp:${toPhoneNumber}`,
    });

    console.log(`✅ Cancellation notification WhatsApp sent to ${toPhoneNumber}:`, message.sid);
    return { success: true, messageSid: message.sid };
  } catch (error) {
    console.error('❌ Error sending cancellation notification WhatsApp:', error);
    return { success: false, error: (error as Error).message };
  }
}
