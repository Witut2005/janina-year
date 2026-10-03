import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { MONTHS, MONTHS_SHORT, WEEKDAYS, WEEKDAYS_SHORT } from '../../core/dates';
import { EntryMap, Tracker } from '../../core/models';
import { Bucket, computeYearStats } from '../../core/stats';
import { Icon } from '../../ui/icon';

const MAX_MONTH_DAYS = 31;

interface Insight {
  label: string;
  value: string;
  hint?: string;
}

@Component({
  selector: 'app-stats',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './stats.html',
  styleUrl: './stats.scss',
})
export class Stats {
  readonly tracker = input.required<Tracker>();
  readonly entries = input.required<EntryMap>();
  readonly year = input.required<number>();
  readonly today = input.required<string>();

  protected readonly monthNames = MONTHS;
  protected readonly weekdayNames = WEEKDAYS;

  protected readonly stats = computed(() =>
    computeYearStats(this.tracker(), this.entries(), this.year(), this.today(), MONTHS_SHORT, WEEKDAYS_SHORT),
  );

  protected readonly maxShare = computed(() => Math.max(...this.stats().distribution.map((d) => d.share), 0.0001));

  protected readonly insights = computed((): Insight[] => {
    const s = this.stats();
    const out: Insight[] = [];
    if (!s.logged) {
      return out;
    }
    const top = [...s.distribution].sort((a, b) => b.count - a.count)[0];
    out.push({ label: 'Najczęściej', value: top.option.label, hint: `${top.count} dni · ${pct(top.share)}` });

    // "Best" relies on option order, which only means something with 2+ options.
    if (this.tracker().options.length > 1) {
      const best = (buckets: Bucket[], names: string[]) => {
        let idx = -1;
        buckets.forEach((b, i) => {
          if (b.average !== null && b.logged >= 3 && (idx < 0 || b.average > buckets[idx].average!)) idx = i;
        });
        return idx < 0 ? null : { name: names[idx], bucket: buckets[idx] };
      };
      const month = best(s.months, MONTHS);
      if (month) {
        out.push({ label: 'Najlepszy miesiąc', value: month.name, hint: this.averageHint(month.bucket) });
      }
      const weekday = best(s.weekdays, WEEKDAYS);
      if (weekday) {
        out.push({ label: 'Najlepszy dzień tygodnia', value: weekday.name, hint: this.averageHint(weekday.bucket) });
      }
    }
    return out;
  });

  protected columnHeight(bucket: Bucket) {
    return `${(bucket.logged / MAX_MONTH_DAYS) * 100}%`;
  }

  protected pct = pct;

  private averageHint(bucket: Bucket) {
    const n = this.tracker().options.length;
    return `średnio ${bucket.average!.toFixed(1)} / ${n}`;
  }
}

function pct(share: number) {
  return `${Math.round(share * 100)}%`;
}
