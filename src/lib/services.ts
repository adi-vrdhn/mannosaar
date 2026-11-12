export type ServiceId = 'personal' | 'couple';

export interface BookableService {
  id: ServiceId;
  name: string;
  shortName: string;
  description: string;
  durationMinutes: number;
}

export interface BundlePricing {
  personal_1: number;
  personal_2: number;
  personal_3: number;
  couple_1: number;
  couple_2: number;
  couple_3: number;
}

export interface FirstSessionOffer {
  enabled: boolean;
  eligible: boolean;
  offerPrice: number;
  regularPrice: number;
}

export type FirstSessionOffers = Record<ServiceId, FirstSessionOffer>;

export const DEFAULT_BUNDLE_PRICING: BundlePricing = {
  personal_1: 999,
  personal_2: 4500,
  personal_3: 6000,
  couple_1: 1500,
  couple_2: 6500,
  couple_3: 9000,
};

export const BOOKABLE_SERVICES: readonly BookableService[] = [
  {
    id: 'personal',
    name: 'Personal Session',
    shortName: 'Personal',
    description:
      'One-on-one counselling in a private, supportive setting to explore emotional wellbeing, stress, relationships, work, or personal concerns.',
    durationMinutes: 40,
  },
  {
    id: 'couple',
    name: 'Couple Session',
    shortName: 'Couple',
    description:
      'A shared counselling session for couples who want support navigating communication, conflict, connection, or changes in their relationship.',
    durationMinutes: 60,
  },
] as const;

export function isServiceId(value: string | null | undefined): value is ServiceId {
  return BOOKABLE_SERVICES.some((service) => service.id === value);
}

export function getServiceById(value: string | null | undefined) {
  return BOOKABLE_SERVICES.find((service) => service.id === value);
}

export function slotDurationMinutes(startTime: string, endTime: string) {
  if (typeof startTime !== 'string' || typeof endTime !== 'string') return NaN;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return NaN;
  return endHour * 60 + endMinute - startHour * 60 - startMinute;
}

// Slots are shared start times. The selected service determines when the session ends.
export function sessionEndTime(startTime: string, serviceId: string) {
  const service = getServiceById(serviceId);
  if (!service || typeof startTime !== 'string') return null;
  const [hour, minute] = startTime.split(':').map(Number);
  if (![hour, minute].every(Number.isInteger) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  const end = hour * 60 + minute + service.durationMinutes;
  return `${String(Math.floor(end / 60) % 24).padStart(2, '0')}:${String(end % 60).padStart(2, '0')}:00`;
}

export function formatInr(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}
