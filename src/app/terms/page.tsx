import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';
import { privacyContacts } from '@/lib/compliance-config';

const sections = [
  { title: '1. Eligibility and availability', paragraphs: ['You must be 18 years of age or older to book through Mannosaar. The online platform accepts bookings worldwide, subject to payment availability, professional availability, and any laws that apply where you are located. You must provide accurate booking and contact information.'] },
  { title: '2. Nature of the service', paragraphs: ['Mannosaar facilitates scheduled online counselling or therapy sessions with listed professionals. Professional categories and credentials must be represented accurately. Outcomes vary and are not guaranteed. The platform is not a substitute for emergency or crisis services.'] },
  { title: '3. Online consultations', paragraphs: ['Sessions are delivered using Google Meet. Availability depends on the patient’s and professional’s internet, device and environment. Mannosaar uses generic calendar titles and does not automatically enable recording, transcription, AI summaries or automated meeting notes. Neither participant should record a session without a lawful basis and the required explicit agreement.'] },
  { title: '4. Booking and payment', paragraphs: ['A booking is confirmed only after the applicable workflow completes and confirmation is issued. Prices are shown before payment. PayU processes payment credentials under its own terms. Attempts to manipulate prices, slots, payments or access controls are prohibited.'] },
  { title: '5. Cancellation, rescheduling and refunds', paragraphs: ['The Cancellation, Rescheduling and Refund Policy forms part of these terms. Eligibility depends on timing, provider cancellation, verified duplicate payment or other circumstances described in that policy.'] },
  { title: '6. Privacy and consent', paragraphs: ['Required service consent and optional marketing consent are separate. Mannosaar records the version you accepted. Read the Privacy Policy and Online Therapy Consent before booking. You may submit a privacy request from your account.'] },
  { title: '7. Appropriate use', bullets: ['Do not harass users or professionals.', 'Do not attempt unauthorized access or interfere with the platform.', 'Do not submit unlawful, malicious or misleading material.', 'Do not misuse meeting links, session content or another person’s identity.'] },
  { title: '8. Third-party services', paragraphs: ['Google, PayU, Meta and other providers may be used to deliver parts of the service. Their availability and processing are governed by their respective terms and applicable arrangements.'] },
  { title: '9. Changes and governing law', paragraphs: ['Material changes will be published with a new version and effective date. Where fresh consent is required, Mannosaar will request it rather than treating silence as agreement. These terms are governed by applicable Indian law and disputes are subject to competent courts in India, subject to mandatory rights and procedures.'] },
  { title: '10. Contact', paragraphs: [`Support: ${privacyContacts.support}`, `Privacy: ${privacyContacts.privacy}`, `Grievance: ${privacyContacts.grievance}`] },
] as const;

export default function TermsPage() {
  return <LegalPage title="Terms of Service" version={POLICY_VERSIONS.terms} summary="These terms describe eligibility, booking, payment and responsible use of Mannosaar’s online counselling platform." sections={sections} />;
}
