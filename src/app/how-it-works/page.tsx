import Link from 'next/link';
import { createPageMetadata } from '@/lib/seo';

export const metadata = createPageMetadata({
  title: 'How Online Counselling Works',
  description: 'See how to choose, book and attend a private online counselling session with Mannosaar from anywhere in India.',
  path: '/how-it-works',
});

const steps = [
  ['Choose a session', 'Read about personal or couples counselling and decide which conversation fits what you want support with.'],
  ['Select a time', 'Choose an available appointment time that works for you. The session duration and price are shown before booking.'],
  ['Complete your booking', 'Follow the secure booking and payment steps. You will receive confirmation and the details needed for your session.'],
  ['Join online', 'Find a quiet, private place and join remotely at the scheduled time. Sessions are available in Hindi and English.'],
];

export default function HowItWorksPage() {
  return <main className="bg-[#cbb7df] text-[#34213f]"><section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24 lg:px-8"><div className="mx-auto max-w-5xl"><p className="text-xs font-bold uppercase tracking-[0.2em] text-[#5b267a]">A clear first step</p><h1 className="mt-4 max-w-4xl font-playfair text-4xl font-bold leading-tight tracking-[-0.04em] sm:text-5xl lg:text-6xl">How online counselling with Mannosaar works.</h1><p className="mt-6 max-w-2xl text-lg leading-8 text-[#4c4052]">You can understand the service, see the price and choose a time before you book. No diagnosis is required to begin a conversation.</p></div></section><section className="border-y border-white/50 bg-white/35 px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto max-w-5xl"><ol className="grid gap-10 md:grid-cols-2">{steps.map(([title, text], index) => <li key={title} className="border-t border-[#6f4b88]/30 pt-5"><span className="font-playfair text-3xl font-bold text-[#5b267a]">0{index + 1}</span><h2 className="mt-4 text-xl font-bold">{title}</h2><p className="mt-2 max-w-md text-sm leading-7 text-[#4c4052]">{text}</p></li>)}</ol></div></section><section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8"><div className="mx-auto grid max-w-5xl gap-8 lg:grid-cols-2"><div><h2 className="font-playfair text-3xl font-bold">Before your first session</h2><p className="mt-4 text-base leading-8 text-[#4c4052]">Think about what brought you here, but do not worry about preparing a perfect explanation. You can ask questions about the process and share only what you feel ready to discuss.</p></div><div className="border-l-2 border-[#5b267a] pl-5 text-sm leading-7 text-[#4c4052]"><p>Mannosaar provides scheduled online counselling, not emergency or crisis care. If you or someone else is in immediate danger, contact local emergency services or an appropriate crisis-support service.</p><p className="mt-4">Review the <Link href="/refund-policy" className="font-bold text-[#5b267a] underline underline-offset-4">cancellation and refund policy</Link> before payment.</p></div></div></section><section className="border-t border-white/50 bg-white/35 px-4 py-14 text-center sm:px-6 lg:px-8"><h2 className="font-playfair text-3xl font-bold">Ready to choose a time?</h2><div className="mt-6 flex flex-wrap justify-center gap-3"><Link href="/services" className="rounded-full border border-[#5b267a]/40 px-6 py-3.5 text-sm font-bold text-[#5b267a]">View services and pricing</Link><Link href="/book-session" className="rounded-full bg-[#5b267a] px-6 py-3.5 text-sm font-bold text-white">Book a session</Link></div></section></main>;
}
