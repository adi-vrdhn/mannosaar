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

function parseDateToParts(value: string) {
  const [yearRaw = '0', monthRaw = '0', dayRaw = '0'] = value.split('-');
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);

  if (
    Number.isNaN(year) ||
    Number.isNaN(month) ||
    Number.isNaN(day)
  ) {
    return null;
  }

  return { year, month, day };
}

function getComparableTimestamp(date: string, time: string) {
  const dateParts = parseDateToParts(date);
  const timeInMinutes = parseTimeToMinutes(time);

  if (!dateParts || Number.isNaN(timeInMinutes)) {
    return Number.NaN;
  }

  const hours = Math.floor(timeInMinutes / 60);
  const minutes = timeInMinutes % 60;

  return Date.UTC(
    dateParts.year,
    dateParts.month - 1,
    dateParts.day,
    hours,
    minutes
  );
}

export function getCurrentComparableTimestamp(
  timeZone: string = APP_TIME_ZONE
) {
  const parts = getZonedParts(new Date(), timeZone);

  return Date.UTC(
    Number(parts.year || 0),
    Number(parts.month || 1) - 1,
    Number(parts.day || 1),
    Number(parts.hour || 0),
    Number(parts.minute || 0)
  );
}

export function isSlotAfterLeadTime(
  slotDate: string,
  slotTime: string,
  minimumLeadMinutes: number = 0,
  currentComparableTimestamp: number = getCurrentComparableTimestamp()
) {
  const slotTimestamp = getComparableTimestamp(slotDate, slotTime);

  if (Number.isNaN(slotTimestamp)) {
    return false;
  }

  return (
    slotTimestamp >= currentComparableTimestamp + minimumLeadMinutes * 60 * 1000
  );
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
