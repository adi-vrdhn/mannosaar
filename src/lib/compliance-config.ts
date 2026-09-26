import 'server-only';

export const privacyContacts = {
  privacy: process.env.PRIVACY_CONTACT_EMAIL || 'care@mannosaar.com',
  grievance: process.env.GRIEVANCE_CONTACT_EMAIL || 'care@mannosaar.com',
  support: process.env.SUPPORT_CONTACT_EMAIL || 'care@mannosaar.com',
};
