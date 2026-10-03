export const MONTHS = [
  'Styczeń',
  'Luty',
  'Marzec',
  'Kwiecień',
  'Maj',
  'Czerwiec',
  'Lipiec',
  'Sierpień',
  'Wrzesień',
  'Październik',
  'Listopad',
  'Grudzień',
];
export const MONTHS_SHORT = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru'];
export const MONTH_LETTERS = ['S', 'L', 'M', 'K', 'M', 'C', 'L', 'S', 'W', 'P', 'L', 'G'];
export const WEEKDAYS_SHORT = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd'];
export const WEEKDAYS = [
  'poniedziałek',
  'wtorek',
  'środa',
  'czwartek',
  'piątek',
  'sobota',
  'niedziela',
];

const pad = (n: number) => String(n).padStart(2, '0');

/** `m` is 0-based. */
export const dateKey = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

export function parseKey(key: string): { y: number; m: number; d: number } {
  const [y, m, d] = key.split('-').map(Number);
  return { y, m: m - 1, d };
}

export const toKey = (date: Date) => dateKey(date.getFullYear(), date.getMonth(), date.getDate());
export const todayKey = () => toKey(new Date());
export const daysInMonth = (y: number, m: number) => new Date(y, m + 1, 0).getDate();
export const daysInYear = (y: number) => (daysInMonth(y, 1) === 29 ? 366 : 365);

/** Monday = 0 … Sunday = 6. */
export function weekdayOf(key: string): number {
  const { y, m, d } = parseKey(key);
  return (new Date(y, m, d).getDay() + 6) % 7;
}

export function addDays(key: string, days: number): string {
  const { y, m, d } = parseKey(key);
  return toKey(new Date(y, m, d + days));
}

/** 1-based day number within its year. */
export function dayOfYear(key: string): number {
  const { y, m, d } = parseKey(key);
  return Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86_400_000) + 1;
}

const longFormat = new Intl.DateTimeFormat('pl-PL', {
  weekday: 'long',
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});
const shortFormat = new Intl.DateTimeFormat('pl-PL', { weekday: 'short', day: 'numeric', month: 'long' });
const dayMonthFormat = new Intl.DateTimeFormat('pl-PL', { day: 'numeric', month: 'long' });

const asDate = (key: string) => {
  const { y, m, d } = parseKey(key);
  return new Date(y, m, d);
};

export const formatLong = (key: string) => longFormat.format(asDate(key));
export const formatShort = (key: string) => shortFormat.format(asDate(key));
export const formatDayMonth = (key: string) => dayMonthFormat.format(asDate(key));
