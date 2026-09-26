import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';

const sections = [
  { title: 'Not an emergency service', notice: 'Mannosaar does not provide emergency response, crisis dispatch, emergency psychiatric care or continuous monitoring.' },
  { title: 'If danger is immediate', paragraphs: ['If you believe you or another person is in immediate danger, contact your local emergency services or go to the nearest appropriate emergency facility. If possible, involve a trusted person who is physically nearby. Do not wait for a scheduled Mannosaar session or website response.'] },
  { title: 'Location matters', paragraphs: ['Emergency and crisis resources vary by location. Use the official emergency or crisis resources for the place where the person at risk is physically located. Mannosaar does not present a global directory as a substitute for local emergency services.'] },
] as const;

export default function EmergencyPage() {
  return <LegalPage title="Emergency & Crisis Disclaimer" version={POLICY_VERSIONS.emergencyDisclaimer} summary="Please use appropriate local emergency resources when there is immediate danger or urgent risk." sections={sections} />;
}
