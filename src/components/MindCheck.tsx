'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import instrument from '@/lib/mind-check-questions.json';
import { firstUnansweredIndex, isAnswered, scoreConcerns } from '@/lib/mind-check';
import MindCheckReflection from '@/components/MindCheckReflection';

type AnswerMap = Record<string, number>;
type Phase = 'welcome' | 'select' | 'questions' | 'results';
const scale = instrument.responseScale;
const concerns = instrument.concerns;

export default function MindCheck() {
  const [phase, setPhase] = useState<Phase>('welcome');
  const [selected, setSelected] = useState<string[]>([]);
  const [answers, setAnswers] = useState<AnswerMap>({});
  const [index, setIndex] = useState(0);
  const [adult, setAdult] = useState(false);
  const [offer, setOffer] = useState<{ enabled: boolean; eligible: boolean; offerPrice: number; regularPrice: number } | null>(null);
  const activeQuestions = useMemo(() => concerns.filter(c => selected.includes(c.id)).flatMap(c => c.questions.map(q => ({ ...q, concern: c.title }))), [selected]);
  const current = activeQuestions[index];
  const complete = activeQuestions.filter(q => isAnswered(answers[q.id])).length;
  const results = useMemo(() => scoreConcerns(concerns, selected, answers), [answers, selected]);
  useEffect(() => {
    if (phase === 'questions') document.getElementById('mind-check-question')?.focus();
    if (phase === 'results') document.getElementById('mind-check-results')?.focus();
  }, [phase, index]);
  useEffect(() => {
    if (phase !== 'results') return;
    let active = true;
    fetch('/api/admin/pricing', { cache: 'no-store' })
      .then(response => response.ok ? response.json() : null)
      .then(data => { if (active) setOffer(data?.offerSetupReady ? data?.offers?.personal ?? null : null); })
      .catch(() => { if (active) setOffer(null); });
    return () => { active = false; };
  }, [phase]);
  const restart = () => { setSelected([]); setAnswers({}); setIndex(0); setAdult(false); setOffer(null); setPhase('welcome'); };
  const toggle = (id: string) => {setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);setAnswers({});setIndex(0);};
  const btn = 'inline-flex min-h-11 items-center justify-center rounded-xl px-5 py-3 font-medium transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#303F78]';
  return <div className="mind-check-page min-h-[100dvh] bg-[#FAF9F7] text-[#30354A] print:bg-white">
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-5xl flex-col px-5 py-6 sm:px-10">
      <header className="flex items-center justify-between gap-4 border-b border-[#B5A6D8]/30 pb-5">
        <Link href="/" className="inline-flex items-center gap-2 font-playfair text-xl font-semibold tracking-tight text-[#303F78]"><Image src="/mannosaar_logog_only.png" alt="" width={40} height={30} className="h-8 w-auto" />Mannosaar<span className="text-[#B5A6D8]">.</span></Link>
        <span className="hidden text-xs text-[#65527E] sm:inline">HEAL · GROW · TRANSFORM</span>
      </header>
      <section className="flex flex-1 flex-col justify-center py-10">
      {phase === 'welcome' && <div className="mx-auto w-full max-w-2xl text-center">
        <span className="mb-5 inline-block rounded-full bg-[#E9EFFA] px-4 py-2 text-xs font-medium text-[#303F78]">A private moment for yourself</span>
        <h1 className="text-4xl font-semibold leading-tight sm:text-6xl">What would you like to understand about yourself?</h1>
        <p className="mx-auto mt-6 max-w-lg text-lg leading-relaxed text-[#65527E]">Explore the areas of everyday well-being that matter to you. Choose your topics, reflect on seven questions each, and receive a thoughtful summary.</p>
        <p className="mt-5 text-sm text-[#65527E]">Ages 18+ · About 2–3 minutes per topic · No login required</p>
        <label className="mx-auto mt-7 flex max-w-md items-start gap-3 text-left text-sm text-[#30354A]"><input type="checkbox" checked={adult} onChange={event => setAdult(event.target.checked)} className="mt-1 h-4 w-4 accent-[#303F78]" />I confirm that I am 18 or older.</label>
        <button disabled={!adult} className={`${btn} mt-6 bg-[#303F78] text-white hover:bg-[#24315f] disabled:cursor-not-allowed disabled:opacity-40`} onClick={() => setPhase('select')}>Start my reflection <span aria-hidden className="ml-3">→</span></button>
        <p className="mt-6 text-xs text-[#65527E]">This is not a diagnosis or a clinically validated screening test.</p>
      </div>}
      {phase === 'select' && <div>
        <div className="max-w-2xl"><span className="text-xs font-semibold tracking-widest text-[#65527E]">STEP 1 · CHOOSE YOUR AREAS</span><h1 className="mt-3 text-3xl font-semibold sm:text-4xl">What feels relevant to you?</h1><p className="mt-3 text-[#65527E]">Select any number of topics. Each adds seven questions. You can choose just one.</p></div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2">{concerns.map(c => <button key={c.id} type="button" aria-pressed={selected.includes(c.id)} onClick={() => toggle(c.id)} className={`rounded-2xl border p-5 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#303F78] ${selected.includes(c.id) ? 'border-[#303F78] bg-[#E9EFFA]' : 'border-[#B5A6D8]/40 bg-white hover:border-[#91ADD9]'}`}><div className="flex items-center justify-between gap-3"><span className="font-semibold">{c.title}</span><span aria-hidden>{selected.includes(c.id) ? '✓' : '+'}</span></div><p className="mt-2 text-sm text-[#65527E]">{c.description}</p></button>)}</div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><button onClick={() => setPhase('welcome')} className={`${btn} border border-[#B5A6D8]`}>← Back</button><button disabled={!selected.length} onClick={() => {setIndex(0);setPhase('questions');}} className={`${btn} bg-[#303F78] text-white disabled:cursor-not-allowed disabled:opacity-40`}>Continue · {selected.length * 7} questions →</button></div>
      </div>}
      {phase === 'questions' && current && <div className="mx-auto w-full max-w-2xl">
        <div className="flex justify-between text-sm text-[#65527E]"><span>{current.concern}</span><span>{index + 1} / {activeQuestions.length}</span></div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[#E9EFFA]" role="progressbar" aria-valuemin={0} aria-valuemax={activeQuestions.length} aria-valuenow={complete} aria-label="Questions answered"><div className="h-full rounded-full bg-[#91ADD9] transition-all" style={{width:`${100 * complete / activeQuestions.length}%`}} /></div>
        <p className="mt-10 text-center text-sm text-[#65527E]">Over the past two weeks, how often has this been true for you?</p>
        <h1 key={current.id} id="mind-check-question" className="mx-auto mt-4 flex min-h-32 max-w-xl items-center justify-center text-center font-playfair text-3xl font-semibold leading-snug sm:text-4xl" tabIndex={-1}>{current.text}</h1>
        <fieldset className="mt-10"><legend className="mx-auto mb-5 text-center font-medium">Choose what feels closest to your experience</legend>
          <div className="mt-5 grid grid-cols-5 gap-1" role="group" aria-label="Frequency shortcuts">{scale.map(s=><button key={s.value} type="button" aria-pressed={answers[current.id]===s.value} onClick={()=>setAnswers(prev=>({...prev,[current.id]:s.value}))} className={`min-h-12 rounded-lg px-1 py-2 text-[10px] sm:text-xs ${answers[current.id]===s.value ? 'bg-[#303F78] text-white' : 'bg-[#E9EFFA] text-[#30354A]'}`}>{s.label}</button>)}</div>
          <p className="mt-5 text-center text-sm text-[#65527E]" aria-live="polite">{!isAnswered(answers[current.id]) ? 'Choose a label to answer' : `Selected: ${scale[answers[current.id]].label}`}</p>
        </fieldset>
        <div className="mt-9 flex justify-between gap-3"><button className={`${btn} border border-[#B5A6D8]`} onClick={()=>index ? setIndex(index-1) : setPhase('select')}>← Back</button><button className={`${btn} bg-[#303F78] text-white disabled:opacity-40`} disabled={!isAnswered(answers[current.id])} onClick={()=>{ if (index < activeQuestions.length - 1) { setIndex(index+1); return; } const missing = firstUnansweredIndex(activeQuestions, answers); if (missing >= 0) setIndex(missing); else if (results.every(r => r.count === 7)) setPhase('results'); }}>{index===activeQuestions.length-1?'See my reflection →':'Next question →'}</button></div>
      </div>}
      {phase === 'results' && <div className="mx-auto w-full max-w-3xl">
        <span className="text-xs font-semibold tracking-widest text-[#65527E]">YOUR PERSONAL REFLECTION</span><h1 id="mind-check-results" tabIndex={-1} className="mt-3 font-playfair text-4xl font-semibold">Here's what came up for you.</h1><p className="mt-4 text-[#65527E]">These are the topics you chose to explore. The reflections describe your reported experiences and are not a diagnosis or validated assessment.</p>
        <div className="mt-8 space-y-5">{results.map(r=><article key={r.id} className="rounded-2xl border border-[#B5A6D8]/40 bg-white p-5 sm:p-7 print:break-inside-avoid"><h2 className="font-playfair text-2xl font-semibold text-[#34213f]">{r.title}</h2><MindCheckReflection concern={r} answers={answers} /></article>)}</div>
        <div className="mt-9 rounded-2xl bg-[#E9EFFA] p-6 print:hidden"><h2 className="text-2xl font-semibold">Want to talk something through?</h2><p className="mt-3 text-[#65527E]">A supportive conversation is available if you would like one, whatever your answers. Booking is entirely optional.</p>{offer?.enabled && offer?.eligible && offer.offerPrice === 700 && offer.regularPrice === 999 && <p className="mt-5 text-lg font-semibold">First session ₹700 <span className="text-sm font-normal text-[#65527E] line-through">₹999</span></p>}<p className="mt-1 text-sm text-[#65527E]">40-minute personal session · Final price is shown before payment</p><Link href="/book-session?service=personal" className={`${btn} mt-5 bg-[#303F78] text-white`}>Explore sessions →</Link></div>
        <div className="mt-7 flex flex-wrap gap-3 print:hidden"><button className={`${btn} border border-[#B5A6D8]`} onClick={()=>window.print()}>Print / save reflection</button><button className={`${btn} border border-[#B5A6D8]`} onClick={restart}>Start over</button></div>
        <div className="mt-8 space-y-2 text-sm text-[#65527E]"><p>Results are not diagnoses, clinically validated scores, or recommendations that therapy is required. If these experiences persist or interfere with your life, a qualified professional can help you explore them.</p><p>If you feel at immediate risk of harm, contact local emergency services or a nearby emergency department. This website is not an emergency service.</p><p>Your responses are calculated in your browser in this version. They are not sent to Mannosaar or stored by this component.</p></div>
      </div>}
      </section>
      <footer className="flex flex-wrap justify-between gap-3 border-t border-[#B5A6D8]/30 py-4 text-xs text-[#65527E]"><span>© Mannosaar · Heal • Grow • Transform</span><span>For adults 18+ · Original self-reflection · Not a clinical assessment · <Link href="/emergency" className="underline">Emergency help</Link></span></footer>
    </div>
  </div>;
}
