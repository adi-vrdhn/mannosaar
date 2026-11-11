export interface GeneratedSlot {
  start_time: string;
  end_time: string;
}

/**
 * Personal slots start on the hour and last 40 minutes. Couple slots start
 * at :45 and last 60 minutes, so both alternatives can be offered without
 * colliding with the database's unique start-time key.
 */
export function generateDefaultSlots(durationMinutes: 40 | 60 = 40): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let startHour = 9;
  let startMinute = 0;

  // 9 AM to 9 PM (21:00)
  // Pattern: 40 mins session + 20 mins break = 60 mins per hour
  while (startHour < 21) {
    const slotStartMinute = durationMinutes === 60 ? 45 : startMinute;
    const startTime = `${String(startHour).padStart(2, '0')}:${String(slotStartMinute).padStart(2, '0')}`;

    // Session is 40 minutes
    let endMinute = slotStartMinute + durationMinutes;
    let endHour = startHour;

    if (endMinute >= 60) {
      endMinute -= 60;
      endHour += 1;
    }

    const endTime = `${String(endHour).padStart(2, '0')}:${String(endMinute).padStart(2, '0')}`;

    slots.push({ start_time: startTime, end_time: endTime });

    // Move to next hour (40 mins session + 20 mins break = 60 mins)
    startMinute += 60;
    if (startMinute >= 60) {
      startMinute -= 60;
      startHour += 1;
    }
  }

  return slots;
}

/**
 * Get available slots for a date range (for blocking UI)
 */
export function getAvailableSlotsForDateRange(
  startDate: string,
  endDate: string
): Array<{ date: string; time: string }> {
  const slots: Array<{ date: string; time: string }> = [];
  const defaultSlots = generateDefaultSlots();

  const start = new Date(startDate);
  const end = new Date(endDate);

  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];

    defaultSlots.forEach((slot) => {
      slots.push({
        date: dateStr,
        time: `${slot.start_time} - ${slot.end_time}`,
      });
    });
  }

  return slots;
}
