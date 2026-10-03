import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { DataStore } from './core/data.store';
import { MONTHS, formatLong } from './core/dates';
import { DayEntry, ViewMode } from './core/models';
import { PwaService } from './core/pwa.service';
import { UiState } from './core/ui.state';
import { inkOn } from './core/util';
import { DayEditor } from './features/day-editor/day-editor';
import { MonthView } from './features/month-view/month-view';
import { Settings } from './features/settings/settings';
import { Stats } from './features/stats/stats';
import { TrackerEditor } from './features/tracker-editor/tracker-editor';
import { YearGrid } from './features/year-grid/year-grid';
import { Icon } from './ui/icon';
import { Segmented, SegmentedOption } from './ui/segmented';
import { Toast } from './ui/toast';
import { UpdateBanner } from './ui/update-banner';
import { Waves } from './ui/waves';

@Component({
  selector: 'app-root',
  imports: [Waves, Icon, Segmented, Toast, UpdateBanner, YearGrid, MonthView, Stats, DayEditor, TrackerEditor, Settings],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(DataStore);
  protected readonly ui = inject(UiState);
  protected readonly pwa = inject(PwaService);

  protected readonly views: SegmentedOption<ViewMode>[] = [
    { value: 'year', label: 'Rok', icon: 'grid' },
    { value: 'month', label: 'Miesiąc', icon: 'calendar' },
    { value: 'stats', label: 'Statystyki', icon: 'chart' },
  ];

  protected readonly inkOn = inkOn;
  protected readonly tracker = this.ui.tracker;
  protected readonly entries = computed(() => {
    const t = this.tracker();
    return t ? (this.store.data().entries[t.id] ?? {}) : {};
  });

  protected readonly todayLabel = computed(() => formatLong(this.ui.today()));
  protected readonly todayEntry = computed((): DayEntry | undefined => this.entries()[this.ui.today()]);

  protected readonly periodLabel = computed(() =>
    this.ui.view() === 'month' ? `${MONTHS[this.ui.month()]} ${this.ui.year()}` : String(this.ui.year()),
  );
  protected readonly isCurrentPeriod = computed(() => {
    const now = new Date();
    return (
      this.ui.year() === now.getFullYear() && (this.ui.view() !== 'month' || this.ui.month() === now.getMonth())
    );
  });

  /** Counts per option in the visible year - shown as the legend under the grid. */
  protected readonly legend = computed(() => {
    const t = this.tracker();
    if (!t) return [];
    const prefix = `${this.ui.year()}-`;
    const counts = new Map<string, number>();
    for (const [key, e] of Object.entries(this.entries())) {
      if (key.startsWith(prefix) && e.optionId) {
        counts.set(e.optionId, (counts.get(e.optionId) ?? 0) + 1);
      }
    }
    return t.options.map((option) => ({ option, count: counts.get(option.id) ?? 0 }));
  });

  constructor() {
    // Home screen shortcut "Dziś" opens today's entry right away.
    const url = new URL(location.href);
    if (url.searchParams.get('day') === 'today') {
      this.ui.editingDay.set(this.ui.today());
      url.searchParams.delete('day');
      history.replaceState(null, '', url);
    }
  }

  protected step(delta: number) {
    if (this.ui.view() === 'month') {
      this.ui.stepMonth(delta);
    } else {
      this.ui.stepYear(delta);
    }
  }

  protected logToday(optionId: string) {
    const t = this.tracker();
    if (!t) return;
    const current = this.todayEntry()?.optionId;
    this.store.setEntry(t.id, this.ui.today(), { optionId: current === optionId ? undefined : optionId });
  }

  protected onTrackerSaved(id: string) {
    this.ui.selectTracker(id);
    this.ui.trackerEditor.set(null);
  }
}
