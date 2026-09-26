import Link from 'next/link';

export interface LegalSection {
  id?: string;
  title: string;
  paragraphs?: readonly string[];
  bullets?: readonly string[];
  notice?: string;
}

export default function LegalPage({ title, version, summary, sections }: { title: string; version: string; summary: string; sections: readonly LegalSection[] }) {
  return (
    <main className="min-h-screen bg-gradient-to-br from-white via-purple-50 to-white px-4 pb-16 pt-28 sm:px-6">
      <div className="mx-auto max-w-4xl">
        <header className="mb-10">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-purple-700">Mannosaar LLP</p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">{title}</h1>
          <p className="mt-3 text-sm font-semibold text-slate-500">Version {version} · Effective September 25, 2026</p>
          <p className="mt-5 max-w-3xl text-base leading-7 text-slate-700">{summary}</p>
        </header>
        <div className="space-y-5">
          {sections.map(section => (
            <section id={section.id} key={section.title} className="scroll-mt-28 rounded-3xl border border-purple-100 bg-white p-6 shadow-sm sm:p-7">
              <h2 className="text-xl font-bold text-slate-950 sm:text-2xl">{section.title}</h2>
              <div className="mt-4 space-y-3 text-sm leading-7 text-slate-700 sm:text-base">
                {section.paragraphs?.map(paragraph => <p key={paragraph}>{paragraph}</p>)}
                {section.bullets && <ul className="list-disc space-y-2 pl-5">{section.bullets.map(item => <li key={item}>{item}</li>)}</ul>}
                {section.notice && <p className="rounded-2xl border border-amber-200 bg-amber-50 p-4 font-medium text-amber-950">{section.notice}</p>}
              </div>
            </section>
          ))}
        </div>
        <nav className="mt-8 flex flex-wrap gap-4 text-sm font-semibold text-purple-700">
          <Link href="/privacy" className="underline underline-offset-4">Privacy Policy</Link>
          <Link href="/terms" className="underline underline-offset-4">Terms</Link>
          <Link href="/online-therapy-consent" className="underline underline-offset-4">Online Therapy Consent</Link>
          <Link href="/emergency" className="underline underline-offset-4">Emergency Information</Link>
          <Link href="/data-rights" className="underline underline-offset-4">Data Rights</Link>
        </nav>
      </div>
    </main>
  );
}
