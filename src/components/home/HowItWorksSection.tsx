import Link from 'next/link';

const steps = [
  {
    title: 'CHOOSE',
    description: 'Choose a personal or couple session and see the duration and price before you book.',
    detail: 'Find the support that fits you.',
    background: '#eee5f3',
  },
  {
    title: 'BOOK',
    description: 'Pick an available time, share your details, and complete your booking securely.',
    detail: 'A time that works for your week.',
    background: '#e7d9ed',
  },
  {
    title: 'BEGIN',
    description: 'Receive your confirmation and join your private online session at the scheduled time.',
    detail: 'Come as you are.',
    background: '#dfcce9',
  },
];

export default function HowItWorksSection() {
  return (
    <section aria-labelledby="how-it-works-heading" className="bg-[#cbb7df] px-4 pb-20 pt-20 text-[#34213f] sm:px-6 sm:pb-28 sm:pt-28 lg:px-8">
      <div className="mx-auto max-w-[1360px]">
        <div className="mb-14 flex flex-col justify-between gap-6 border-t border-[#34213f] pt-5 sm:mb-20 sm:flex-row sm:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em]">The process</p>
            <h2 id="how-it-works-heading" className="mt-6 max-w-2xl text-4xl font-semibold leading-[0.95] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
              How it works.
            </h2>
          </div>
          <p className="max-w-xs text-sm leading-6 text-[#4c4052] sm:text-base">
            Three simple steps to your first conversation with Mannosaar.
          </p>
        </div>

        <ol className="relative">
          {steps.map((step, index) => (
            <li
              key={step.title}
              className="sticky flex min-h-[430px] flex-col border-t border-[#34213f] px-1 pb-8 pt-5 shadow-[0_-14px_24px_rgba(52,33,63,0.12)] sm:min-h-[480px] sm:px-2 sm:pt-7 lg:min-h-[540px]"
              style={{ top: `${88 + index * 14}px`, zIndex: index + 1, backgroundColor: step.background }}
            >
              <div className="grid gap-x-8 gap-y-4 sm:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[150px_minmax(0,1fr)_minmax(220px,340px)]">
                <span className="text-5xl font-semibold leading-none tracking-[-0.07em] sm:text-6xl lg:text-7xl">
                  0{index + 1}
                </span>
                <h3 className="text-5xl font-semibold leading-none tracking-[-0.065em] sm:text-6xl lg:text-7xl">
                  {step.title}
                </h3>
                <p className="max-w-sm pt-1 text-base leading-7 text-[#4c4052] sm:col-start-2 lg:col-start-3 lg:pt-2">
                  {step.description}
                </p>
              </div>

              <div className="mt-auto grid gap-5 border-t border-[#34213f]/20 pt-5 sm:grid-cols-[110px_minmax(0,1fr)] lg:grid-cols-[150px_minmax(0,1fr)_minmax(220px,340px)]">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-[#5b267a]">Mannosaar / 0{index + 1}</span>
                <p className="text-lg font-medium tracking-[-0.025em] sm:text-xl">{step.detail}</p>
                {index === steps.length - 1 && (
                  <Link href="/book-session" className="w-fit text-sm font-semibold underline decoration-1 underline-offset-4 transition hover:text-[#5b267a] sm:col-start-2 lg:col-start-3">
                    Book a session ↗
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
