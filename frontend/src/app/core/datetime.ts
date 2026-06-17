/** Small date/time helpers for the booking calendar (works with ISO 8601 UTC strings). */

export interface CalendarDay {
  date: Date;
  /** YYYY-MM-DD key in local time. */
  key: string;
  inCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
}

export function localDayKey(date: Date): string {
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, '0');
  const d = `${date.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Build a Monday-first 6x7 grid for the month containing `anchor`. */
export function buildMonthGrid(anchor: Date): CalendarDay[] {
  const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
  // Monday = 0 ... Sunday = 6
  const offset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - offset);

  const todayKey = localDayKey(new Date());
  const days: CalendarDay[] = [];
  for (let i = 0; i < 42; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    const key = localDayKey(date);
    days.push({
      date,
      key,
      inCurrentMonth: date.getMonth() === anchor.getMonth(),
      isToday: key === todayKey,
      isPast: key < todayKey,
    });
  }
  return days;
}

export function formatMonthYear(date: Date): string {
  return new Intl.DateTimeFormat('ru-RU', { month: 'long', year: 'numeric' }).format(date);
}

export function formatTime(iso: string, hour12 = false): string {
  return new Intl.DateTimeFormat('ru-RU', {
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  }).format(new Date(iso));
}

export function formatDateLong(iso: string | Date): string {
  return new Intl.DateTimeFormat('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
  }).format(typeof iso === 'string' ? new Date(iso) : iso);
}

export function formatDateTime(iso: string): string {
  return new Intl.DateTimeFormat('ru-RU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
