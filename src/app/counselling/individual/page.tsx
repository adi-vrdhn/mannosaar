import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Individual Counselling Online in India',
  description: 'Private one-to-one online counselling with Neetu Rathore for stress, relationships, overthinking, confidence and personal concerns.',
  alternates: { canonical: '/counselling/individual' },
  openGraph: {
    title: 'Individual Counselling Online in India | Mannosaar',
    description: 'A private, structured space to talk through personal and emotional concerns online.',
    url: '/counselling/individual',
  },
};

const concerns = ['Stress and emotional overwhelm', 'Overthinking and difficult thoughts', 'Relationships and life transitions', 'Confidence, self-esteem and boundaries', 'Work, study and career-related concerns', 'Breakups, grief and loneliness'];

export default function IndividualCounsellingPage() {
  return (
    <main className="bg-[#cbb7df] text-[#34213f]">
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">Individual counselling</p>
          <h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">Private one-to-one counselling for life&apos;s difficult moments.</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c4052]">Online personal counselling gives you a confidential space to slow down, make sense of what you are carrying and consider practical next steps with Neetu Rathore.</p>
          <div className="mt-8 flex flex-wrap gap-3"><Link href="/book-session?service=personal" className="rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white">Book an individual session</Link><Link href="/services" className="rounded-full border border-[#5b267a]/40 px-6 py-3.5 text-sm font-bold text-[#5b267a]">View duration and price</Link></div>
        </div>
      </section>
      <section className="border-y border-white/50 bg-white/35 px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-[0.8fr_1.2fr]">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#5b267a]">A place to begin</p><h2 className="mt-3 font-playfair text-3xl font-bold sm:text-4xl">You do not need a perfect explanation before you talk.</h2></div>
          <div><p className="text-base leading-8 text-[#4c4052]">People seek individual counselling for many reasons. You might be navigating a change, feeling stuck in a pattern, or wanting an experienced person to listen without judgement. Sessions are shaped around your concerns and pace; they are not a promise of a particular outcome or a substitute for emergency or medical care.</p><h3 className="mt-8 text-lg font-bold">People commonly bring conversations about</h3><ul className="mt-4 grid gap-3 sm:grid-cols-2">{concerns.map((concern) => <li key={concern} className="border-b border-[#6f4b88]/20 pb-3 text-sm leading-6 text-[#4c4052]">{concern}</li>)}</ul></div>
        </div>
      </section>
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-5xl"><h2 className="font-playfair text-3xl font-bold sm:text-4xl">What an online session may look like</h2><div className="mt-8 grid gap-5 md:grid-cols-3">{[['01', 'Arrive and share', 'Begin with what feels most important to you today.'], ['02', 'Explore together', 'Notice the thoughts, emotions, situations or patterns behind the concern.'], ['03', 'Choose a next step', 'End with a clearer understanding and practical direction where useful.']].map(([number, title, text]) => <article key={number} className="border-t border-[#6f4b88]/30 pt-5"><span className="font-playfair text-2xl font-bold text-[#5b267a]">{number}</span><h3 className="mt-4 text-lg font-bold">{title}</h3><p className="mt-2 text-sm leading-7 text-[#4c4052]">{text}</p></article>)}</div><div className="mt-12 border-t border-[#6f4b88]/25 pt-7 text-sm leading-7 text-[#4c4052]"><p>Sessions are conducted online in Hindi or English. The current session duration and fee are shown on the <Link href="/services" className="font-bold text-[#5b267a] underline underline-offset-4">services and pricing page</Link> before you book.</p><p className="mt-3">Meet the person behind Mannosaar on the <Link href="/about" className="font-bold text-[#5b267a] underline underline-offset-4">Neetu Rathore profile</Link>.</p></div></div></section>
      <section className="border-t border-white/50 bg-white/35 px-4 py-14 text-center sm:px-6 lg:px-8"><h2 className="font-playfair text-3xl font-bold">Start with one conversation.</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-[#4c4052]">Mannosaar is not an emergency service. If you are in immediate danger, contact local emergency services or an appropriate crisis-support service.</p><Link href="/book-session?service=personal" className="mt-6 inline-flex rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white">Book a session</Link></section>
    </main>
  );
}
