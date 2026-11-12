import 'server-only';

import { createClient } from '@supabase/supabase-js';
import {
  DEFAULT_BUNDLE_PRICING,
  type BundlePricing,
  type FirstSessionOffers,
  type ServiceId,
} from '@/lib/services';

const DEFAULT_OFFERS: FirstSessionOffers = {
  personal: { enabled: false, eligible: false, offerPrice: 700, regularPrice: DEFAULT_BUNDLE_PRICING.personal_1 },
  couple: { enabled: false, eligible: false, offerPrice: 999, regularPrice: DEFAULT_BUNDLE_PRICING.couple_1 },
};

export async function getBundlePricing(): Promise<BundlePricing> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return { ...DEFAULT_BUNDLE_PRICING };
  }

  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data, error } = await supabase
      .from('pricing_config')
      .select('session_type, bundle_size, price')
      .order('session_type')
      .order('bundle_size');

    if (error) {
      console.error('Error fetching pricing:', error);
      return { ...DEFAULT_BUNDLE_PRICING };
    }

    const pricing = { ...DEFAULT_BUNDLE_PRICING };

    for (const item of data || []) {
      const key = `${item.session_type}_${item.bundle_size}` as keyof BundlePricing;
      if (key in pricing && Number(item.price) > 0) {
        pricing[key] = Number(item.price);
      }
    }

    return pricing;
  } catch (error) {
    console.error('Error loading pricing configuration:', error);
    return { ...DEFAULT_BUNDLE_PRICING };
  }
}

export async function getPricingSnapshot(userId?: string) {
  const pricing = await getBundlePricing();
  const effectivePricing = { ...pricing };
  const offers: FirstSessionOffers = {
    personal: { ...DEFAULT_OFFERS.personal, regularPrice: pricing.personal_1 },
    couple: { ...DEFAULT_OFFERS.couple, regularPrice: pricing.couple_1 },
  };
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) return { pricing, effectivePricing, offers, offerSetupReady: false };

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const { data: rows, error } = await supabase
    .from('pricing_config')
    .select('session_type, intro_offer_enabled, intro_offer_price')
    .eq('bundle_size', 1);
  if (error) {
    console.error('Error fetching first-session offers:', error);
    return { pricing, effectivePricing, offers, offerSetupReady: false };
  }

  for (const row of rows || []) {
    if (row.session_type !== 'personal' && row.session_type !== 'couple') continue;
    const service = row.session_type as ServiceId;
    const offerPrice = Number(row.intro_offer_price);
    offers[service].enabled = row.intro_offer_enabled === true;
    if (Number.isFinite(offerPrice) && offerPrice > 0) offers[service].offerPrice = offerPrice;
  }

  if (userId) {
    await Promise.all((['personal', 'couple'] as const).map(async (service) => {
      if (!offers[service].enabled || offers[service].offerPrice >= offers[service].regularPrice) return;
      const { data, error: bookingError } = await supabase
        .from('bookings')
        .select('id')
        .eq('user_id', userId)
        .eq('session_type', service)
        .eq('payment_status', 'completed')
        .limit(1);
      if (bookingError) {
        console.error('Error checking first-session eligibility:', bookingError);
        return;
      }
      if (data?.length) return;
      const { data: claim, error: claimError } = await supabase
        .from('first_session_offer_claims')
        .select('claimed_at')
        .eq('user_id', userId)
        .eq('session_type', service)
        .maybeSingle();
      if (claimError) {
        console.error('Error checking first-session offer claim:', claimError);
        return;
      }
      offers[service].eligible = !claim || Date.parse(claim.claimed_at) < Date.now() - 60 * 60 * 1000;
      if (offers[service].eligible) effectivePricing[`${service}_1`] = offers[service].offerPrice;
    }));
  }

  return { pricing, effectivePricing, offers, offerSetupReady: true };
}
