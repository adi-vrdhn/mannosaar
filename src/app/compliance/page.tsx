import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';
import { privacyContacts } from '@/lib/compliance-config';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Privacy and Compliance Contacts',
  description: 'Find Mannosaar contact details for privacy requests, grievances, support and information about platform safeguards.',
  path: '/compliance',
});

const sections = [
  { title: 'Privacy contact', paragraphs: [privacyContacts.privacy] },
  { title: 'Grievance contact', paragraphs: [privacyContacts.grievance] },
  { title: 'Support contact', paragraphs: [privacyContacts.support] },
  { title: 'Platform safeguards', paragraphs: ['Mannosaar implements privacy and security safeguards designed to protect personal information. This page does not claim government approval, legal certification, HIPAA certification, GDPR certification, absolute security or absolute confidentiality.'] },
] as const;

export default function CompliancePage() {
  return <LegalPage title="Privacy & Compliance Contacts" version={POLICY_VERSIONS.privacy} summary="Contact points for privacy, grievances and service support." sections={sections} />;
}
