import { DayOfWeek } from '../store/types';

const DOW: DayOfWeek[] = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function dayOfWeek(date: Date = new Date()): DayOfWeek {
  return DOW[date.getDay()];
}

export function dayOfYear(date: Date = new Date()): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / 86400000);
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function toIso(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function formatMonthTitle(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatShortWeekday(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

/** Mon-first weekday label used across the Meal Plans / Chores screens. */
export const WEEKDAY_LABELS: { key: DayOfWeek; label: string }[] = [
  { key: 'mon', label: 'Mon' },
  { key: 'tue', label: 'Tue' },
  { key: 'wed', label: 'Wed' },
  { key: 'thu', label: 'Thu' },
  { key: 'fri', label: 'Fri' },
  { key: 'sat', label: 'Sat' },
  { key: 'sun', label: 'Sun' },
];

/** Builds a 6-week (42-day) grid for the given month, Sunday-first. */
export function buildMonthGrid(year: number, month: number): { date: Date; inMonth: boolean }[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay(); // 0 = Sunday
  const gridStart = addDays(first, -startOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = addDays(gridStart, i);
    return { date: d, inMonth: d.getMonth() === month };
  });
}
