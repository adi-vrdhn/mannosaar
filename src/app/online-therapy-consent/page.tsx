import LegalPage from '@/components/legal/LegalPage';
import { POLICY_VERSIONS } from '@/lib/compliance';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'Online Therapy Consent',
  description: 'Understand the nature, benefits, limitations, privacy considerations and emergency limits of Mannosaar online counselling.',
  path: '/online-therapy-consent',
});

const sections = [
  { title: 'Voluntary participation', paragraphs: ['Online counselling or therapy is voluntary. Before paying, you are asked to expressly confirm that you wish to receive the selected service through video consultation. You may ask questions before the session and may withdraw from a session, subject to the published cancellation and refund policy.'] },
  { title: 'What online sessions involve', paragraphs: ['Sessions take place by Google Meet. You are responsible for using a suitable device, reliable connection and a private environment where possible. Technology may fail or communications may be interrupted. If a session cannot continue, the professional or support team will determine an appropriate next step.'] },
  { title: 'Benefits, limits and alternatives', paragraphs: ['Online sessions can improve convenience and access, but may not provide every benefit of in-person assessment or care. A professional may recommend another format, specialist, in-person service or emergency support where online counselling is not appropriate. Outcomes cannot be guaranteed.'] },
  { title: 'Privacy during video sessions', paragraphs: ['Calendar titles are generic. Mannosaar does not automatically enable recording, transcription, AI summaries or automatic notes. You should not record or share session content without the required lawful permission. Privacy can also be affected by your surroundings, device and network.'] },
  { title: 'Emergency limitation', notice: 'Mannosaar is not an emergency or crisis-response service. If you believe you or another person is in immediate danger, contact local emergency services or appropriate crisis support.' },
] as const;

export default function OnlineTherapyConsentPage() {
  return <LegalPage title="Online Therapy Consent" version={POLICY_VERSIONS.onlineTherapyConsent} summary="Information to help you make an informed and voluntary choice about receiving counselling or therapy by video consultation." sections={sections} />;
}
