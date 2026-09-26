'use client';

import { useState } from 'react';
import { LifeBuoy } from 'lucide-react';

export default function SupportRequestPanel() {
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    setSubmitting(true);
    setStatus('');
    const response = await fetch('/api/support-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, message }),
    });
    const data = await response.json().catch(() => ({}));
    setSubmitting(false);
    if (!response.ok) {
      setStatus(data.error || 'Unable to submit your request.');
      return;
    }
    setSubject('');
    setMessage('');
    setStatus(data.emailSent
      ? 'Request submitted. We sent an acknowledgement to your email.'
      : 'Request submitted. Email delivery could not be confirmed.');
  };

  return (
    <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <div className="flex items-start gap-3">
        <LifeBuoy className="mt-0.5 text-[#5b267a]" size={21} />
        <div>
          <h2 className="text-xl font-semibold text-slate-950">Report a problem</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">Tell us about a website, payment, or booking issue. Do not include private therapy notes.</p>
        </div>
      </div>
      <div className="mt-5 grid gap-3">
        <input value={subject} onChange={event => setSubject(event.target.value)} maxLength={120} placeholder="What went wrong?" className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#5b267a] focus:outline-none" />
        <textarea value={message} onChange={event => setMessage(event.target.value)} maxLength={3000} rows={4} placeholder="Describe the issue and what you were trying to do." className="rounded-lg border border-slate-300 px-4 py-3 text-sm focus:border-[#5b267a] focus:outline-none" />
      </div>
      <button type="button" onClick={submit} disabled={submitting || subject.trim().length < 3 || message.trim().length < 10} className="mt-3 rounded-lg bg-[#5b267a] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#4a1f64] disabled:opacity-50">
        {submitting ? 'Submitting…' : 'Submit issue'}
      </button>
      {status && <p className="mt-3 text-sm font-medium text-slate-700" aria-live="polite">{status}</p>}
    </section>
  );
}
