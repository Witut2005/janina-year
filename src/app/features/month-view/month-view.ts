import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { WEEKDAYS_SHORT, dateKey, daysInMonth, formatLong, formatShort, weekdayOf } from '../../core/dates';
import { EntryMap, Tracker, TrackerOption } from '../../core/models';
import { inkOn } from '../../core/util';
import { Icon } from '../../ui/icon';
import { Photo } from '../../ui/photo';

interface DayCell {
  key: string;
  day: number;
  option?: TrackerOption;
  ink: string | null;
  note: boolean;
  photos: number;
  future: boolean;
  today: boolean;
  label: string;
}

interface JournalItem {
  key: string;
  date: string;
  option?: TrackerOption;
  note: string;
  photos: string[];
}

@Component({
  selector: 'app-month-view',
  imports: [Icon, Photo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './month-view.html',
  styleUrl: './month-view.scss',
})
export class MonthView {
  readonly tracker = input.required<Tracker>();
  readonly entries = input.required<EntryMap>();
  readonly year = input.required<number>();
  readonly month = input.required<number>();
  readonly today = input.required<string>();
  readonly pick = output<string>();

  protected readonly weekdays = WEEKDAYS_SHORT;

  private readonly options = computed(() => new Map(this.tracker().options.map((o) => [o.id, o])));

  protected readonly leading = computed(() =>
    new Array(weekdayOf(dateKey(this.year(), this.month(), 1))).fill(0),
  );

  protected readonly cells = computed(() => {
    const year = this.year();
    const month = this.month();
    const today = this.today();
    const entries = this.entries();
    const options = this.options();
    return Array.from({ length: daysInMonth(year, month) }, (_, i): DayCell => {
      const key = dateKey(year, month, i + 1);
      const entry = entries[key];
      const option = entry?.optionId ? options.get(entry.optionId) : undefined;
      return {
        key,
        day: i + 1,
        option,
        ink: option ? inkOn(option.color) : null,
        note: !!entry?.note?.trim(),
        photos: entry?.photos?.length ?? 0,
        future: key > today,
        today: key === today,
        label: `${formatLong(key)}${option ? ' · ' + option.label : ''}`,
      };
    });
  });

  /** Days with a note or photos, newest first - the journal part of the month. */
  protected readonly journal = computed(() => {
    const prefix = dateKey(this.year(), this.month(), 1).slice(0, 8);
    const options = this.options();
    return Object.entries(this.entries())
      .filter(([key, e]) => key.startsWith(prefix) && (e.note?.trim() || e.photos?.length))
      .sort(([a], [b]) => b.localeCompare(a))
      .map(
        ([key, e]): JournalItem => ({
          key,
          date: formatShort(key),
          option: e.optionId ? options.get(e.optionId) : undefined,
          note: e.note?.trim() ?? '',
          photos: e.photos ?? [],
        }),
      );
  });
}
