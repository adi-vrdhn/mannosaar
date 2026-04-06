export interface GeneratedSlot {
  start_time: string;
  end_time: string;
}

/**
 * Generate default slots with 1 slot per hour and 20 mins break between slots
 * No continuous sessions - each hour: 40 mins session + 20 mins break
 * Example: 9:00-9:40 (session), 9:40-10:00 (break), 10:00-10:40 (session), 10:40-11:00 (break), etc.
 */
export function generateDefaultSlots(): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  let startHour = 9;
  let startMinute = 0;

  // 9 AM to 9 PM (21:00)
  // Pattern: 40 mins session + 20 mins break = 60 mins per hour
  while (startHour < 21) {
    const startTime = `${String(startHour).padStart(2, '0')}:${String(startMinute).padStart(2, '0')}`;

    // Session is 40 minutes
    let endMinute = startMinute + 40;
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
