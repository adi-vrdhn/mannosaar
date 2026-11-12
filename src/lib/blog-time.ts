const IST_OFFSET = '+05:30';
const IST_ZONE = 'Asia/Kolkata';

export function toIstDateTimeInput(value: string) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_ZONE, year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
  }).formatToParts(new Date(value));
  const part = (name: string) => parts.find(item => item.type === name)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

export function istDateTimeInputToIso(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) throw new Error('Choose a valid IST publishing time');
  const date = new Date(`${value}:00${IST_OFFSET}`);
  if (Number.isNaN(date.getTime()) || toIstDateTimeInput(date.toISOString()) !== value) throw new Error('Choose a valid IST publishing time');
  return date.toISOString();
}

export function formatArticleTimeIst(value: string) {
  return `${new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_ZONE, day: 'numeric', month: 'long', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  }).format(new Date(value))} IST (GMT+5:30)`;
}
