// Date formatting utilities for CareTrack

/**
 * Returns ISO Date string (YYYY-MM-DD) offset by days from now
 */
export function getDateOffset(daysOffset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  return d.toISOString().split('T')[0];
}

/**
 * Returns formatted local date (e.g., Oct 23, 2026)
 */
export function formatDate(dateString) {
  if (!dateString) return '—';
  try {
    const d = new Date(dateString);
    if (isNaN(d.getTime())) return dateString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return dateString;
  }
}

/**
 * Returns formatted local date and time (e.g., Oct 23, 2026, 09:30 AM)
 */
export function formatDateTime(dateTimeString) {
  if (!dateTimeString) return '—';
  try {
    const d = new Date(dateTimeString);
    if (isNaN(d.getTime())) return dateTimeString;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return dateTimeString;
  }
}

/**
 * Format time only (e.g., 09:30 AM)
 */
export function formatTime(timeOrDateString) {
  if (!timeOrDateString) return '—';
  try {
    if (timeOrDateString.includes(':') && !timeOrDateString.includes('-') && !timeOrDateString.includes('T')) {
      // Already HH:MM
      const [h, m] = timeOrDateString.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const h12 = hour % 12 || 12;
      return `${h12}:${m} ${ampm}`;
    }
    const d = new Date(timeOrDateString);
    if (isNaN(d.getTime())) return timeOrDateString;
    return d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  } catch {
    return timeOrDateString;
  }
}

/**
 * Returns number of days since admission date
 */
export function getDaysSince(dateString) {
  if (!dateString) return 0;
  const start = new Date(dateString.split('T')[0]);
  const now = new Date(new Date().toISOString().split('T')[0]);
  const diffTime = Math.abs(now - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}
