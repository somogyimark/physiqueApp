import { format, parseISO, subDays } from 'date-fns';
import { hu } from 'date-fns/locale';

/**
 * Időkezelés: az időbélyegeket UTC ISO-ban tároljuk (rendezhető), a naptári napot
 * viszont helyi idő szerint, `YYYY-MM-DD` alakban — így az edzés azon a napon marad,
 * amelyiken ténylegesen történt.
 */

export function nowIso(): string {
  return new Date().toISOString();
}

/** Helyi naptári nap kulcsa, pl. `2026-09-10`. */
export function toDayKey(date: Date = new Date()): string {
  return format(date, 'yyyy-MM-dd');
}

export function dayKeyFromIso(iso: string): string {
  return toDayKey(parseISO(iso));
}

/** „2026. szept. 10., csütörtök" */
export function formatWorkoutDate(iso: string): string {
  return format(parseISO(iso), 'yyyy. MMM d., EEEE', { locale: hu });
}

/** „szept. 10." — grafikon tengelyéhez, listaelemekhez */
export function formatShortDate(iso: string): string {
  return format(parseISO(iso), 'MMM d.', { locale: hu });
}

/** „2026. szeptember" — a lista szekció-fejlécéhez */
export function formatMonthTitle(dayKey: string): string {
  return format(parseISO(dayKey), 'yyyy. MMMM', { locale: hu });
}

/** „14:32" */
export function formatTime(iso: string): string {
  return format(parseISO(iso), 'HH:mm');
}

/** A hónap kulcsa csoportosításhoz, pl. `2026-09`. */
export function monthKey(dayKey: string): string {
  return dayKey.slice(0, 7);
}

/** Az adott számú nappal ezelőtti nap kulcsa — az időtáv-szűrőhöz. */
export function dayKeyDaysAgo(days: number): string {
  return toDayKey(subDays(new Date(), days));
}
