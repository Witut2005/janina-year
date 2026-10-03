import { addDays, dateKey, dayOfYear, daysInMonth, daysInYear, parseKey, weekdayOf } from './dates';
import { EntryMap, Tracker, TrackerOption } from './models';

export interface OptionCount {
  option: TrackerOption;
  count: number;
  /** Share of logged days, 0–1. */
  share: number;
}

export interface Bucket {
  label: string;
  /** Days that could have been logged in this bucket so far. */
  capacity: number;
  logged: number;
  counts: OptionCount[];
  /** Mean score, 1 (worst) … options.length (best). `null` when nothing logged. */
  average: number | null;
}

export interface YearStats {
  elapsed: number;
  logged: number;
  coverage: number;
  notes: number;
  photos: number;
  currentStreak: number;
  longestStreak: number;
  distribution: OptionCount[];
  months: Bucket[];
  weekdays: Bucket[];
  average: number | null;
}

export function computeYearStats(
  tracker: Tracker,
  entries: EntryMap,
  year: number,
  today: string,
  monthLabels: string[],
  weekdayLabels: string[],
): YearStats {
  const prefix = `${year}-`;
  const optionIndex = new Map(tracker.options.map((o, i) => [o.id, i]));
  const n = tracker.options.length;
  const scoreOf = (i: number) => n - i;

  const todayParsed = parseKey(today);
  const elapsed =
    year < todayParsed.y ? daysInYear(year) : year > todayParsed.y ? 0 : dayOfYear(today);

  const total = new Array<number>(n).fill(0);
  const monthCounts = monthLabels.map(() => new Array<number>(n).fill(0));
  const weekdayCounts = weekdayLabels.map(() => new Array<number>(n).fill(0));
  let notes = 0;
  let photos = 0;

  for (const [key, entry] of Object.entries(entries)) {
    if (!key.startsWith(prefix) || key > today) {
      continue;
    }
    if (entry.note?.trim()) notes++;
    photos += entry.photos?.length ?? 0;
    const idx = entry.optionId !== undefined ? optionIndex.get(entry.optionId) : undefined;
    if (idx === undefined) {
      continue;
    }
    total[idx]++;
    monthCounts[parseKey(key).m][idx]++;
    weekdayCounts[weekdayOf(key)][idx]++;
  }

  const toCounts = (counts: number[]): OptionCount[] => {
    const sum = counts.reduce((a, b) => a + b, 0);
    return tracker.options.map((option, i) => ({
      option,
      count: counts[i],
      share: sum ? counts[i] / sum : 0,
    }));
  };
  const averageOf = (counts: number[]) => {
    const sum = counts.reduce((a, b) => a + b, 0);
    return sum ? counts.reduce((acc, c, i) => acc + c * scoreOf(i), 0) / sum : null;
  };

  const monthCapacity = (m: number) => {
    if (year < todayParsed.y) return daysInMonth(year, m);
    if (year > todayParsed.y || m > todayParsed.m) return 0;
    return m === todayParsed.m ? todayParsed.d : daysInMonth(year, m);
  };

  const months: Bucket[] = monthCounts.map((counts, m) => ({
    label: monthLabels[m],
    capacity: monthCapacity(m),
    logged: counts.reduce((a, b) => a + b, 0),
    counts: toCounts(counts),
    average: averageOf(counts),
  }));

  const weekdays: Bucket[] = weekdayCounts.map((counts, w) => ({
    label: weekdayLabels[w],
    capacity: 0,
    logged: counts.reduce((a, b) => a + b, 0),
    counts: toCounts(counts),
    average: averageOf(counts),
  }));

  const logged = total.reduce((a, b) => a + b, 0);
  const { current, longest } = streaks(entries, year, today);

  return {
    elapsed,
    logged,
    coverage: elapsed ? logged / elapsed : 0,
    notes,
    photos,
    currentStreak: current,
    longestStreak: longest,
    distribution: toCounts(total),
    months,
    weekdays,
    average: averageOf(total),
  };
}

/** Streaks of consecutive days with a chosen option. */
function streaks(entries: EntryMap, year: number, today: string) {
  const has = (key: string) => !!entries[key]?.optionId;

  // Current streak may continue from yesterday if today isn't logged yet.
  let current = 0;
  let cursor = has(today) ? today : addDays(today, -1);
  while (has(cursor)) {
    current++;
    cursor = addDays(cursor, -1);
  }

  let longest = 0;
  let run = 0;
  const last = parseKey(today).y === year ? dayOfYear(today) : daysInYear(year);
  let key = dateKey(year, 0, 1);
  for (let i = 0; i < last; i++) {
    run = has(key) ? run + 1 : 0;
    longest = Math.max(longest, run);
    key = addDays(key, 1);
  }

  return { current, longest };
}
