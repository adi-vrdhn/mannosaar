'use client';

import { useEffect, useState } from 'react';
import { formatInr, type FirstSessionOffers, type ServiceId } from '@/lib/services';

const services: { id: ServiceId; label: string }[] = [
  { id: 'personal', label: 'Personal session' },
  { id: 'couple', label: 'Couple session' },
];

export default function FirstSessionOfferSettings({ canEdit }: { canEdit: boolean }) {
  const [offers, setOffers] = useState<FirstSessionOffers | null>(null);
  const [loading, setLoading] = useState(true);
  const [setupReady, setSetupReady] = useState(false);
  const [saving, setSaving] = useState<ServiceId | null>(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/pricing', { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('Could not load offer settings.');
        return response.json();
      })
      .then(data => {
        setOffers(data.offers || null);
        setSetupReady(data.offerSetupReady === true);
      })
      .catch(() => setMessage('Could not load the offer settings.'))
      .finally(() => setLoading(false));
  }, []);

  const update = (service: ServiceId, patch: Partial<FirstSessionOffers[ServiceId]>) => {
    setOffers(current => current ? { ...current, [service]: { ...current[service], ...patch } } : current);
  };

  const save = async (service: ServiceId, enabled?: boolean) => {
    if (!offers) return;
    const nextEnabled = enabled ?? offers[service].enabled;
    setSaving(service);
    setMessage('');
    try {
      const response = await fetch('/api/admin/pricing/offer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ service, enabled: nextEnabled, offerPrice: offers[service].offerPrice }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save the offer.');
      const refreshed = await fetch('/api/admin/pricing', { cache: 'no-store' });
      if (!refreshed.ok) throw new Error('Offer saved, but the current settings could not be reloaded.');
      const current = await refreshed.json();
      setOffers(current.offers || null);
      setSetupReady(current.offerSetupReady === true);
      setMessage(`${service === 'personal' ? 'Personal' : 'Couple'} offer ${nextEnabled ? 'enabled' : 'disabled'} and saved.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not save the offer.');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="rounded-2xl border border-[#5b267a]/15 bg-white p-5 sm:p-8" aria-labelledby="first-session-offer-heading">
      <h2 id="first-session-offer-heading" className="font-playfair text-2xl font-semibold text-[#34213f]">First-session offer</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#62576b]">
        Turn the offer on for a season, then turn it off when it ends. It applies to one single-session purchase for customers with no previous paid booking of that service. Bundle prices are separate.
      </p>
      {message && <p role="status" className="mt-4 text-sm font-medium text-[#5b267a]">{message}</p>}
      {!setupReady && offers && <p role="alert" className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">Offer setup is incomplete in the database. Apply the first-session offer migration before this switch can be used.</p>}
      {!offers ? <p className="mt-6 text-sm text-[#62576b]">{loading ? 'Loading offer settings…' : 'Offer settings are unavailable.'}</p> : (
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {services.map(({ id, label }) => (
            <div key={id} className="rounded-xl border border-[#5b267a]/20 bg-[#f7f2f9] p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-[#34213f]">{label}</h3>
                  <p className="mt-1 text-sm text-[#62576b]">Regular price: {formatInr(offers[id].regularPrice)}</p>
                </div>
                <label className="flex items-center gap-2 text-sm font-medium text-[#34213f]">
                  <input type="checkbox" checked={offers[id].enabled} onChange={event => void save(id, event.target.checked)} disabled={!canEdit || !setupReady || saving !== null} className="size-5 accent-[#5b267a]" />
                  Enabled
                </label>
              </div>
              <label className="mt-5 block text-sm font-medium text-[#34213f]" htmlFor={`${id}-offer-price`}>First-session price</label>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-[#62576b]">₹</span>
                <input id={`${id}-offer-price`} type="number" min="1" step="1" value={offers[id].offerPrice} onChange={event => update(id, { offerPrice: Number(event.target.value) })} disabled={!canEdit || !setupReady || saving !== null} className="w-full rounded-lg border border-[#5b267a]/25 bg-white px-3 py-2 text-[#34213f] focus:outline-2 focus:outline-[#5b267a]" />
              </div>
              {canEdit && <button type="button" onClick={() => void save(id)} disabled={!setupReady || saving !== null} className="mt-5 min-h-11 rounded-full bg-[#5b267a] px-5 text-sm font-semibold text-white transition hover:bg-[#481d61] disabled:opacity-50">{saving === id ? 'Saving…' : 'Save price'}</button>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
