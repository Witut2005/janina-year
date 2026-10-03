import { addDays, dateKey, dayOfYear, weekdayOf } from './dates';
import { EntryMap, Tracker } from './models';
import { computeYearStats } from './stats';

const tracker: Tracker = {
  id: 't',
  title: 'Nastrój',
  emoji: '🙂',
  createdAt: 0,
  options: [
    { id: 'good', label: 'Dobrze', color: '#4FB096' },
    { id: 'bad', label: 'Źle', color: '#B02E4C' },
  ],
};

const months = Array.from({ length: 12 }, (_, i) => String(i));
const weekdays = Array.from({ length: 7 }, (_, i) => String(i));

describe('dates', () => {
  it('handles month and year boundaries', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01');
    expect(addDays('2024-03-01', -1)).toBe('2024-02-29');
    expect(dayOfYear('2026-12-31')).toBe(365);
    expect(dayOfYear('2024-12-31')).toBe(366);
    expect(weekdayOf('2026-10-05')).toBe(0); // Monday
    expect(dateKey(2026, 0, 5)).toBe('2026-01-05');
  });
});

describe('computeYearStats', () => {
  it('counts options, streaks and averages', () => {
    const entries: EntryMap = {
      '2026-01-01': { optionId: 'good' },
      '2026-01-02': { optionId: 'good', note: 'hej' },
      '2026-01-03': { optionId: 'bad', photos: ['p1', 'p2'] },
      '2026-01-05': { optionId: 'good' },
      '2026-01-06': { optionId: 'good' },
      '2026-01-07': { note: 'tylko notatka' },
      '2026-02-01': { optionId: 'good' }, // after "today" - ignored
    };
    const s = computeYearStats(tracker, entries, 2026, '2026-01-06', months, weekdays);

    expect(s.elapsed).toBe(6);
    expect(s.logged).toBe(5);
    expect(s.distribution.map((d) => d.count)).toEqual([4, 1]);
    expect(s.currentStreak).toBe(2);
    expect(s.longestStreak).toBe(3);
    expect(s.notes).toBe(1);
    expect(s.photos).toBe(2);
    expect(s.months[0].average).toBeCloseTo((4 * 2 + 1) / 5);
    expect(s.months[1].logged).toBe(0);
  });

  it('continues the current streak from yesterday when today is empty', () => {
    const entries: EntryMap = { '2026-03-09': { optionId: 'bad' }, '2026-03-10': { optionId: 'bad' } };
    expect(computeYearStats(tracker, entries, 2026, '2026-03-11', months, weekdays).currentStreak).toBe(2);
  });
});
