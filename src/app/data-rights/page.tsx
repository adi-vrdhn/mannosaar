import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';
import { privacyContacts } from '@/lib/compliance-config';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Data Rights and Privacy Requests',
  description: 'Learn how to request access, correction, export, consent withdrawal or deletion of personal information held by Mannosaar.',
  path: '/data-rights',
});

const sections = [
  { title: 'Requests you can submit', bullets: ['Access to personal information', 'Correction of inaccurate information', 'Account deletion', 'Withdrawal of consent for future processing', 'Data export', 'Privacy complaint'], paragraphs: ['Sign in and use the Privacy Requests section in your profile so Mannosaar can authenticate and track the request.'] },
  { title: 'How requests are handled', paragraphs: ['Requests move through Submitted, Under Review, Approved, Rejected and Completed statuses. Mannosaar may ask for reasonable verification or clarification. A request may be limited or rejected where applicable law requires or permits records to be retained, or where fulfilling it would adversely affect another person’s rights. A reason should be recorded when a request is rejected.'] },
  { title: 'Deletion is reviewed', paragraphs: ['Submitting a deletion request does not instantly erase booking, consent, payment, clinical or audit records. Mannosaar will determine which information can be deleted, de-identified, restricted or must be retained under an approved retention schedule.'] },
  { title: 'Contact', paragraphs: [`Privacy: ${privacyContacts.privacy}`, `Grievance: ${privacyContacts.grievance}`, `Support: ${privacyContacts.support}`] },
] as const;

export default function DataRightsPage() {
  return <LegalPage title="Data Rights & Privacy Requests" version={POLICY_VERSIONS.privacy} summary="Submit and track privacy requests without bypassing records Mannosaar may need to preserve." sections={sections} />;
}
