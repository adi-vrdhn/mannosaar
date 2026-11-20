'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import instrument from '@/lib/mind-check-questions.json';
import { firstUnansweredIndex, isAnswered, scoreConcerns } from '@/lib/mind-check';
import MindCheckReflection from '@/components/MindCheckReflection';
import { formatInr } from '@/lib/services';

type AnswerMap = Record<string, number>;
type Offer = { enabled: boolean; eligible: boolean; offerPrice: number; regularPrice: number };

export default function MentalLoadSection() {
  const { status: sessionStatus } = useSession();
  const [concernId, setConcernId] = useState('');
  const [adult, setAdult] = useState(false);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [offer, setOffer] = useState<Offer | null>(null);
  const concern = instrument.concerns.find(item => item.id === concernId);
  const questions = concern?.questions ?? [];
  const question = questions[index];
  const answered = questions.filter(item => isAnswered(answers[item.id])).length;
  const result = useMemo(() => scoreConcerns(instrument.concerns, concernId ? [concernId] : [], answers)[0], [concernId, answers]);
  const firstSessionOffer = Boolean(
    offer?.enabled && offer.offerPrice === 700 && offer.regularPrice === 999 &&
    (sessionStatus === 'unauthenticated' || (sessionStatus === 'authenticated' && offer.eligible))
  );

  useEffect(() => {
    if (showResults) document.getElementById('small-break-results')?.focus();
    else if (concern && adult) document.getElementById('small-break-question')?.focus();
  }, [showResults, index, concern, adult]);

  useEffect(() => {
    if (!showResults) return;
    let active = true;
    fetch('/api/admin/pricing', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (active) setOffer(data?.offerSetupReady ? data?.offers?.personal ?? null : null); })
      .catch(() => { if (active) setOffer(null); });
    return () => { active = false; };
  }, [showResults]);

  const reset = () => {
    setConcernId(''); setAdult(false); setAnswers({}); setIndex(0); setShowResults(false); setOffer(null);
  };
  const button = 'min-h-11 rounded-xl border border-[#B5A6D8] px-5 py-2 font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#303F78]';

  return <section aria-labelledby="small-break-heading" className="bg-[#cbb7df] px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
    <div className="mx-auto max-w-4xl rounded-[28px] border border-[#5b267a]/25 bg-[#FAF9F7] px-5 py-9 text-[#30354A] shadow-[0_16px_40px_rgba(52,33,63,0.08)] sm:px-10 sm:py-12">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#5b267a]">A small break</p>
        <h2 id="small-break-heading" className="mt-3 font-playfair text-3xl font-bold tracking-[-0.035em] text-[#303F78] sm:text-4xl">What am I carrying today?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-[#65527E]">Choose one area, then take seven quiet moments to reflect. Your answers stay in this browser tab and are not saved.</p>
      </div>
      <div className="mx-auto mt-9 max-w-2xl">
        <label htmlFor="small-break-concern" className="block text-sm font-semibold text-[#303F78]">Choose a concern</label>
        <select id="small-break-concern" value={concernId} onChange={event => { setConcernId(event.target.value); setAnswers({}); setIndex(0); setShowResults(false); setOffer(null); }} className="mt-2 min-h-12 w-full rounded-xl border border-[#B5A6D8] bg-white px-4 py-3 text-base text-[#30354A] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#303F78]">
          <option value="">Select what feels closest...</option>
          {instrument.concerns.map(item => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
        <label className="mt-5 flex items-start gap-3 text-sm leading-6 text-[#65527E]"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} className="mt-1 h-4 w-4 shrink-0 accent-[#303F78]" />I confirm that I am 18 or older.</label>

        {concern && adult && !showResults && question && <div className="mt-8 rounded-2xl border border-[#B5A6D8]/45 bg-white p-5 sm:p-8">
          <div className="flex items-center justify-between gap-4 text-sm text-[#65527E]"><span>{concern.title}</span><span>{index + 1} of 7</span></div>
          <div role="progressbar" aria-label="Questions answered" aria-valuemin={0} aria-valuemax={7} aria-valuenow={answered} className="mt-3 h-2 overflow-hidden rounded-full bg-[#E9EFFA]"><div className="h-full rounded-full bg-[#91ADD9] transition-all" style={{ width: `${answered / 7 * 100}%` }} /></div>
          <p className="mt-8 text-center text-sm text-[#65527E]">Over the past two weeks, how often has this been true for you?</p>
          <h3 id="small-break-question" tabIndex={-1} className="mx-auto mt-3 flex min-h-24 max-w-xl items-center justify-center text-center font-playfair text-2xl font-semibold leading-snug text-[#303F78] sm:text-3xl">{question.text}</h3>
          <fieldset className="mt-7"><legend className="mx-auto text-center text-sm font-semibold">Choose what feels closest</legend>
            <div className="mt-5 grid grid-cols-5 gap-1.5" role="group" aria-label="Frequency choices">{instrument.responseScale.map(point => <button key={point.value} type="button" aria-pressed={answers[question.id] === point.value} onClick={() => setAnswers(previous => ({ ...previous, [question.id]: point.value }))} className={`min-h-12 rounded-lg px-1 py-2 text-[10px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#303F78] sm:text-xs ${answers[question.id] === point.value ? 'bg-[#303F78] text-white' : 'bg-[#E9EFFA] text-[#30354A]'}`}>{point.label}</button>)}</div>
            <p aria-live="polite" className="mt-4 text-center text-sm text-[#65527E]">{isAnswered(answers[question.id]) ? `Selected: ${instrument.responseScale[answers[question.id]].label}` : 'Choose a label to answer'}</p>
          </fieldset>
          <div className="mt-7 flex justify-between gap-3"><button type="button" onClick={() => setIndex(previous => Math.max(0, previous - 1))} disabled={index === 0} className={`${button} disabled:opacity-40`}>Previous</button><button type="button" disabled={!isAnswered(answers[question.id])} onClick={() => { if (index < 6) { setIndex(index + 1); return; } const missing = firstUnansweredIndex(questions, answers); if (missing >= 0) setIndex(missing); else setShowResults(true); }} className="min-h-11 rounded-xl bg-[#303F78] px-5 py-2 font-medium text-white disabled:opacity-40">{index === 6 ? 'See my reflection' : 'Next question'}</button></div>
        </div>}

        {concern && adult && showResults && result && <div className="mt-9 border-t border-[#6f4b88]/25 pt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#6f4b88]">Your reflection</p>
          <h3 id="small-break-results" tabIndex={-1} className="mt-2 font-playfair text-3xl font-semibold text-[#34213f]">{concern.title}</h3>
          <MindCheckReflection concern={concern} answers={answers} />
          <div className="mt-9 rounded-[20px] bg-[#3f2b50] px-6 py-7 text-[#FAF9F7] sm:px-8 sm:py-8">
            <div className="sm:flex sm:items-start sm:justify-between sm:gap-8">
              <div>
                <p className="font-playfair text-2xl leading-tight">{firstSessionOffer ? 'Your first online session' : 'Personal online session'}</p>
                <p className="mt-2 text-sm text-[#e7d9ed]">40 minutes · Online counselling</p>
              </div>
              <div className="mt-5 min-h-12 sm:mt-0 sm:text-right">
                {firstSessionOffer ? <p className="flex items-baseline gap-3 sm:justify-end"><span className="text-4xl font-semibold tracking-tight">₹700</span><span className="text-lg text-[#cbb7df] line-through">₹999</span></p>
                  : offer?.regularPrice ? <p className="text-4xl font-semibold tracking-tight">{formatInr(offer.regularPrice)}</p>
                    : <p className="text-sm text-[#e7d9ed]">Price shown before booking</p>}
              </div>
            </div>
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-white/20 pt-5">
              <p className="text-xs leading-5 text-[#e7d9ed]">{firstSessionOffer ? sessionStatus === 'unauthenticated' ? 'First-session offer · Eligibility checked at booking' : 'First-session offer' : 'Booking is always your choice'}</p>
              <Link href="/book-session?service=personal" className="inline-flex min-h-11 items-center justify-center rounded-full bg-[#e7d9ed] px-6 py-2.5 text-sm font-semibold text-[#34213f] transition hover:bg-[#cbb7df] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FAF9F7]">Book Session</Link>
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-5 text-sm"><button type="button" onClick={() => { setShowResults(false); setIndex(6); }} className="min-h-11 font-medium text-[#5b267a] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#5b267a]">Edit answers</button><button type="button" onClick={reset} className="min-h-11 font-medium text-[#5b267a] underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-[#5b267a]">Start over</button></div>
        </div>}
        <div className="mt-7 space-y-2 text-xs leading-5 text-[#65527E]"><p>For adults 18+. This original self-reflection is not a clinically validated screening tool or a substitute for professional care.</p><p>If you may be in immediate danger, contact local emergency services or visit the nearest emergency department. <Link href="/emergency" className="font-semibold underline">Emergency help</Link></p></div>
      </div>
    </div>
  </section>;
}
