import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Couples Counselling and Relationship Guidance Online',
  description: 'Online couples counselling with Neetu Rathore for communication difficulties, recurring conflict, emotional distance and relationship transitions.',
  alternates: { canonical: '/counselling/couples' },
  openGraph: {
    title: 'Couples Counselling Online | Mannosaar',
    description: 'A structured conversation for couples who want support with communication, conflict and connection.',
    url: '/counselling/couples',
  },
};

const reasons = ['The same argument keeps returning', 'Conversations become difficult or quickly escalate', 'You feel emotionally distant from one another', 'Trust or a relationship transition needs careful discussion', 'You are making a significant decision together'];

export default function CouplesCounsellingPage() {
  return (
    <main className="bg-[#cbb7df] text-[#34213f]">
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">Relationship support</p><h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">Online couples counselling for clearer, more respectful conversations.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c4052]">A shared online session can give couples a structured space to listen, understand recurring patterns and talk about what matters with support.</p><div className="mt-8 flex flex-wrap gap-3"><Link href="/book-session?service=couple" className="rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white">Book a couples session</Link><Link href="/services" className="rounded-full border border-[#5b267a]/40 px-6 py-3.5 text-sm font-bold text-[#5b267a]">View duration and price</Link></div></div></section>
      <section className="border-y border-white/50 bg-white/35 px-4 py-16 sm:px-6 lg:px-8"><div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr]"><div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b267a]">Why couples seek support</p><h2 className="mt-3 font-playfair text-3xl font-bold sm:text-4xl">The goal is a better conversation, not a promise about the outcome.</h2></div><div><p className="text-base leading-8 text-[#4c4052]">Couples counselling can help partners pause and look at communication, conflict and connection with more care. Both people do not have to describe the situation in exactly the same way. The session is a place to understand each perspective and consider what can happen next.</p><ul className="mt-7 grid gap-3 sm:grid-cols-2">{reasons.map((reason) => <li key={reason} className="border-b border-[#6f4b88]/20 pb-3 text-sm leading-6 text-[#4c4052]">{reason}</li>)}</ul></div></div></section>
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-5xl"><h2 className="font-playfair text-3xl font-bold sm:text-4xl">What to expect</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{[['Share the context', 'Both partners can describe what has been happening and what they hope to understand.'], ['Slow the pattern down', 'The conversation can make room for listening, clarification and less reactive discussion.'], ['Discuss next steps', 'You can identify a practical direction that feels relevant to your relationship.']].map(([title, text]) => <article key={title} className="border-t border-[#6f4b88]/30 pt-5"><h3 className="text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#4c4052]">{text}</p></article>)}</div><p className="mt-10 border-l-2 border-[#5b267a] pl-4 text-sm leading-7 text-[#4c4052]">Sessions are online and available in Hindi or English. Counselling cannot guarantee reconciliation or a particular relationship outcome. If there is immediate danger or violence, seek local emergency or specialist support rather than relying on an online counselling appointment.</p><p className="mt-6 text-sm leading-7 text-[#4c4052]">Learn more about <Link href="/about" className="font-bold text-[#5b267a] underline underline-offset-4">Neetu Rathore</Link> and the <Link href="/services" className="font-bold text-[#5b267a] underline underline-offset-4">available session options</Link>.</p></div></section>
      <section className="border-t border-white/50 bg-white/35 px-4 py-14 text-center sm:px-6 lg:px-8"><h2 className="font-playfair text-3xl font-bold">Make room for a useful conversation.</h2><Link href="/book-session?service=couple" className="mt-6 inline-flex rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white">Book a couples session</Link></section>
    </main>
  );
}
