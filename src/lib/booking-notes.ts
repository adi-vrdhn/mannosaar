const THERAPIST_NOTE_MARKER = '\n\n[[THERAPIST_NOTE_FOR_CLIENT]]\n';

export function splitBookingNotes(value?: string | null) {
  const notes = typeof value === 'string' ? value : '';
  const markerIndex = notes.indexOf(THERAPIST_NOTE_MARKER);

  if (markerIndex === -1) {
    return {
      clientNote: notes.trim() || null,
      therapistNoteForClient: null,
    };
  }

  return {
    clientNote: notes.slice(0, markerIndex).trim() || null,
    therapistNoteForClient:
      notes.slice(markerIndex + THERAPIST_NOTE_MARKER.length).trim() || null,
  };
}

export function combineBookingNotes(clientNote?: string | null, therapistNote?: string | null) {
  const client = clientNote?.trim() || '';
  const therapist = therapistNote?.trim() || '';

  if (!therapist) return client || null;
  return `${client}${THERAPIST_NOTE_MARKER}${therapist}`;
}
