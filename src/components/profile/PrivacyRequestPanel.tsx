'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldCheck } from 'lucide-react';

const options = [
  ['ACCESS', 'Access my information'],
  ['CORRECTION', 'Correct my information'],
  ['DELETION', 'Request account deletion'],
  ['CONSENT_WITHDRAWAL', 'Withdraw consent'],
  ['DATA_EXPORT', 'Export my data'],
  ['PRIVACY_COMPLAINT', 'Submit a privacy complaint'],
] as const;

interface PrivacyRequest { id: string; request_type: string; status: string; details?: string | null; created_at: string }

export default function PrivacyRequestPanel() {
  const [requestType, setRequestType] = useState<(typeof options)[number][0]>('ACCESS');
  const [details, setDetails] = useState('');
  const [requests, setRequests] = useState<PrivacyRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    const response = await fetch('/api/privacy-requests', { cache: 'no-store' });
    if (response.ok) setRequests((await response.json()).requests || []);
    setLoading(false);
  }, []);

  useEffect(() => { void load(); }, [load]);

  const submit = async () => {
    setSubmitting(true); setMessage('');
    const response = await fetch('/api/privacy-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ requestType, details }),
    });
    const data = await response.json();
    setSubmitting(false);
    if (!response.ok) { setMessage(data.error || 'Unable to submit request.'); return; }
    setDetails(''); setMessage('Request submitted for review.'); await load();
  };

  return (
    <section id="privacy-requests" className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 text-[#5b267a]"><ShieldCheck size={21} /></span>
        <div><h2 className="text-xl font-semibold text-slate-950">Privacy requests</h2><p className="mt-1 text-sm leading-6 text-slate-600">Access, correct, export, or request deletion of your information. Learn more on the <Link href="/data-rights" className="font-medium text-[#5b267a] underline underline-offset-4">Data Rights page</Link>.</p></div>
      </div>
      <div className="mt-5 grid gap-3 md:grid-cols-[minmax(220px,0.7fr)_minmax(0,1.3fr)]">
        <select value={requestType} onChange={event => setRequestType(event.target.value as typeof requestType)} className="rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm text-slate-800 focus:border-[#5b267a] focus:outline-none">
          {options.map(([value,label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <textarea value={details} onChange={event => setDetails(event.target.value)} maxLength={2000} rows={3} placeholder="Optional details—do not include therapy notes or unnecessary medical information." className="rounded-lg border border-slate-300 px-4 py-3 text-sm text-slate-800 focus:border-[#5b267a] focus:outline-none" />
      </div>
      <button type="button" onClick={submit} disabled={submitting} className="mt-3 rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a1f64] disabled:opacity-50">{submitting ? 'Submitting…' : 'Submit request'}</button>
      {message && <p className="mt-3 text-sm font-medium text-slate-700" aria-live="polite">{message}</p>}
      <div className="mt-5 border-t border-slate-200 pt-4">
        <h3 className="text-sm font-semibold text-slate-900">Request history</h3>
        {loading ? <p className="mt-2 text-sm text-slate-500">Loading…</p> : requests.length === 0 ? <p className="mt-2 text-sm text-slate-500">No privacy requests submitted.</p> : <ul className="mt-3 divide-y divide-slate-200 rounded-lg border border-slate-200">{requests.map(item => <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm"><span className="font-medium text-slate-800">{options.find(option => option[0] === item.request_type)?.[1] || item.request_type}</span><span className="text-xs font-medium capitalize text-slate-500">{item.status.replaceAll('_',' ')}</span></li>)}</ul>}
      </div>
    </section>
  );
}
