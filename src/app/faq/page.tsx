import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions About Online Counselling',
  description: 'Answers about Mannosaar online counselling, session format, privacy, languages, pricing, booking and emergency support.',
  alternates: { canonical: '/faq' },
};

const faqs = [
  ['What is Mannosaar?', 'Mannosaar is a practitioner-led website for private online counselling and emotional-wellness conversations with Neetu Rathore.'],
  ['Who provides the sessions?', 'Sessions are provided by Neetu Rathore. You can read about her experience, approach and education on the About page.'],
  ['How does online counselling work?', 'Choose a session, select an available time, complete the booking and join remotely from a private space. See the full process on How It Works.'],
  ['Are sessions private?', 'Privacy is an important part of a counselling conversation. Information is handled according to the published privacy policy and applicable responsibilities.'],
  ['What languages are available?', 'Sessions are available in Hindi and English.'],
  ['How long are sessions and how much do they cost?', 'The current duration and fee for personal and couple sessions are listed on the Services and Pricing page before booking.'],
  ['Can couples attend together?', 'Yes. The Couple Session is intended for partners who want support with communication, conflict, connection or a relationship transition.'],
  ['Can I book from anywhere in India?', 'Mannosaar offers online sessions. You should make sure you can attend privately and that online counselling is appropriate for your circumstances.'],
  ['What happens in the first session?', 'You can share what brought you to the session, ask questions and begin to understand what kind of support may be useful. You do not need to arrive with a diagnosis.'],
  ['Is Mannosaar an emergency mental-health service?', 'No. Mannosaar is not an emergency or crisis service. If you are in immediate danger, contact local emergency services or an appropriate crisis-support service.'],
];

export default function FAQPage() {
  const schema = { '@context': 'https://schema.org', '@type': 'FAQPage', mainEntity: faqs.map(([name, text]) => ({ '@type': 'Question', name, acceptedAnswer: { '@type': 'Answer', text } })) };
  return <main className="bg-[#cbb7df] px-4 py-16 text-[#34213f] sm:px-6 sm:py-24 lg:px-8"><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} /><div className="mx-auto max-w-4xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">Questions, answered</p><h1 className="mt-4 font-playfair text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl">Frequently asked questions about online counselling.</h1><p className="mt-5 max-w-2xl text-lg leading-8 text-[#4c4052]">Clear information about sessions, privacy, pricing and what to expect before you decide.</p><div className="mt-12 border-t border-[#6f4b88]/30">{faqs.map(([question, answer]) => <details key={question} className="group border-b border-[#6f4b88]/30 py-5"><summary className="cursor-pointer list-none text-lg font-bold marker:content-none">{question}</summary><p className="max-w-3xl pt-3 text-sm leading-7 text-[#4c4052]">{answer}</p></details>)}</div><div className="mt-10 flex flex-wrap gap-4 text-sm"><Link href="/services" className="font-bold text-[#5b267a] underline underline-offset-4">See services and pricing</Link><Link href="/how-it-works" className="font-bold text-[#5b267a] underline underline-offset-4">Learn how booking works</Link></div></div></main>;
}
