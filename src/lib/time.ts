export const APP_TIME_ZONE = 'Asia/Kolkata';

function getZonedParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date).reduce<Record<string, string>>(
    (acc, part) => {
      if (part.type !== 'literal') {
        acc[part.type] = part.value;
      }
      return acc;
    },
    {}
  );

  return parts;
}

export function getCurrentDateString(timeZone: string = APP_TIME_ZONE) {
  const parts = getZonedParts(new Date(), timeZone);
  return `${parts.year}-${parts.month}-${parts.day}`;
}

export function getCurrentTimeInMinutes(timeZone: string = APP_TIME_ZONE) {
  const parts = getZonedParts(new Date(), timeZone);
  const hours = Number(parts.hour || 0);
  const minutes = Number(parts.minute || 0);

  return hours * 60 + minutes;
}

export function parseTimeToMinutes(value: string) {
  const [hoursRaw = '0', minutesRaw = '0'] = value.trim().split(':');
  const hours = Number(hoursRaw);
  const minutes = Number(minutesRaw);

  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return Number.NaN;
  }

  return hours * 60 + minutes;
}

export function isSlotInTheFuture(
  slotDate: string,
  slotTime: string,
  currentDate: string = getCurrentDateString(),
  currentMinutes: number = getCurrentTimeInMinutes()
) {
  if (slotDate > currentDate) return true;
  if (slotDate < currentDate) return false;

  return parseTimeToMinutes(slotTime) > currentMinutes;
}
