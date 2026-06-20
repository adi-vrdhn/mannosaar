function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function parseEmailList(value?: string | null) {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((email) => email.trim())
    .filter(Boolean);
}

export function getTherapistNotificationRecipients(primaryEmail?: string | null) {
  const recipients = new Map<string, string>();

  for (const email of parseEmailList(primaryEmail)) {
    recipients.set(normalizeEmail(email), email.trim());
  }

  for (const email of parseEmailList(process.env.THERAPIST_EMAIL)) {
    recipients.set(normalizeEmail(email), email.trim());
  }

  if (recipients.size === 0) {
    const fallbackEmail = process.env.EMAIL_USER?.trim();

    if (fallbackEmail) {
      recipients.set(normalizeEmail(fallbackEmail), fallbackEmail);
    }
  }

  return Array.from(recipients.values());
}
