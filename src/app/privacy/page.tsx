import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';
import { privacyContacts } from '@/lib/compliance-config';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Privacy Policy',
  description: 'Learn how Mannosaar collects, uses, protects and retains personal information for accounts, bookings, payments and online counselling.',
  path: '/privacy',
});

const sections = [
  { title: '1. Scope and our role', paragraphs: ['This policy explains how Mannosaar LLP handles digital personal data when you use our website, account, booking, payment and online counselling services from anywhere in the world. Mannosaar determines the purposes described below and uses selected service providers to operate the platform.'] },
  { title: '2. Information we collect', bullets: ['Account and contact information: name, email address and phone number.', 'Booking information: selected service, therapist, date, time, booking status and meeting link.', 'Optional booking context that you choose to provide. Detailed clinical information should be shared only through an approved secure clinical process.', 'Consent evidence: consent type, version, time, limited request metadata, and the booking linked to that consent.', 'Payment records: amount, status and provider transaction identifiers. Mannosaar does not intend to store full card or bank credentials.', 'Security and operational information: IP address where appropriate, browser/user-agent information, authentication events and audit records.', 'Privacy requests and support communications you submit.'] },
  { title: '3. Why we use information', bullets: ['Create and secure your account.', 'Show availability, process bookings and payments, and deliver the selected service.', 'Create a generic Google Calendar event and Google Meet link.', 'Send booking confirmations, service messages and reminders.', 'Maintain consent evidence, respond to privacy requests, prevent abuse and meet applicable record-keeping duties.', 'Send marketing only where you made a separate optional choice.'] },
  { title: '4. Service providers and disclosures', paragraphs: ['We may use Google for sign-in, Calendar and Meet; PayU for payment processing; Meta for WhatsApp messaging when you use that channel; hosting, database and email providers for platform operations; and professional advisers or authorities where disclosure is legally required. Each provider processes information under its own terms and applicable arrangements. We do not intentionally send therapy notes, diagnoses, symptoms, medication information, or person-linked therapist-specialty information to advertising analytics.'] },
  { title: '5. Analytics and URL privacy', paragraphs: ['Analytics is limited to public informational pages and generic events. It is disabled on booking, payment, profile, authentication and administration routes. Booking context and sensitive health information must not be placed in analytics events or public URLs.'] },
  { title: '6. Security and confidentiality', paragraphs: ['We implement privacy and security safeguards designed to protect personal information, including access controls, server-side validation, restricted service credentials, audit records and transport encryption in production. No internet service can promise absolute security or confidentiality. Therapy confidentiality may be limited by applicable law, valid legal process, or a serious and immediate safety concern.'] },
  { title: '7. Retention', paragraphs: ['Different records have different operational and legal purposes. Account, booking, payment, consent, clinical, support and audit records are assigned configurable retention categories. A deletion request may therefore result in deletion, de-identification, restriction, or lawful retention rather than immediate removal of every record. Final retention periods must be approved by Mannosaar’s legal and clinical governance advisers.'] },
  { title: '8. Your choices and requests', bullets: ['Request access to or export of personal information.', 'Request correction of inaccurate information.', 'Request account deletion, subject to lawful retention.', 'Withdraw a consent for future processing where consent is the basis.', 'Raise a privacy complaint.'], paragraphs: ['Authenticated users may submit and track these requests from their account. Withdrawing consent does not undo processing already lawfully completed and may prevent Mannosaar from continuing a service that requires that information.'] },
  { title: '9. Adults and location', paragraphs: ['Mannosaar accepts bookings worldwide from people who confirm that they are at least 18 years old. Service availability may still depend on professional availability, payment support, and legal requirements applicable to the professional and the person booking.'] },
  { title: '10. Contact', paragraphs: [`Privacy: ${privacyContacts.privacy}`, `Grievance: ${privacyContacts.grievance}`, `Support: ${privacyContacts.support}`] },
] as const;

export default function PrivacyPage() {
  return <LegalPage title="Privacy Policy" version={POLICY_VERSIONS.privacy} summary="A plain-language explanation of the information Mannosaar needs, why it is used, and how you can exercise your privacy choices." sections={sections} />;
}
