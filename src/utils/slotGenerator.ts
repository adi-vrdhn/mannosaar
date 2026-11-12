export interface GeneratedSlot {
  start_time: string;
  end_time: string;
}

/** One hourly opening for both services. The booking service sets its actual end time. */
export function generateDefaultSlots(): GeneratedSlot[] {
  const slots: GeneratedSlot[] = [];
  for (let hour = 9; hour < 21; hour += 1) {
    slots.push({
      start_time: `${String(hour).padStart(2, '0')}:00`,
      end_time: `${String(hour).padStart(2, '0')}:40`,
    });
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
