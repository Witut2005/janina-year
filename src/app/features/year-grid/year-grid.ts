import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MONTHS, MONTH_LETTERS, dateKey, daysInMonth, formatLong } from '../../core/dates';
import { EntryMap, Tracker } from '../../core/models';

interface Cell {
  key: string;
  color: string | null;
  label: string;
  marked: boolean;
  future: boolean;
  today: boolean;
}

/** Classic Year in Pixels: months as columns, days 1–31 as rows. */
@Component({
  selector: 'app-year-grid',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './year-grid.html',
  styleUrl: './year-grid.scss',
})
export class YearGrid {
  readonly tracker = input.required<Tracker>();
  readonly entries = input.required<EntryMap>();
  readonly year = input.required<number>();
  readonly today = input.required<string>();
  readonly pick = output<string>();

  protected readonly monthLetters = MONTH_LETTERS;
  protected readonly monthNames = MONTHS;
  protected readonly days = Array.from({ length: 31 }, (_, i) => i + 1);

  /** rows[day - 1][month] - `null` for dates that don't exist (e.g. 30 February). */
  protected readonly rows = computed(() => {
    const year = this.year();
    const today = this.today();
    const entries = this.entries();
    const options = new Map(this.tracker().options.map((o) => [o.id, o]));

    return this.days.map((day) =>
      MONTH_LETTERS.map((_, month): Cell | null => {
        if (day > daysInMonth(year, month)) {
          return null;
        }
        const key = dateKey(year, month, day);
        const entry = entries[key];
        const option = entry?.optionId ? options.get(entry.optionId) : undefined;
        const marked = !!(entry?.note?.trim() || entry?.photos?.length);
        const parts = [formatLong(key), option?.label ?? (key > today ? '' : 'brak wpisu')];
        if (marked) parts.push('ma notatkę');
        return {
          key,
          color: option?.color ?? null,
          label: parts.filter(Boolean).join(' · '),
          marked,
          future: key > today,
          today: key === today,
        };
      }),
    );
  });
}
