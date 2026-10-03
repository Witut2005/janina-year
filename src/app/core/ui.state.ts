import { DestroyRef, Injectable, computed, effect, inject, signal } from '@angular/core';
import { DataStore } from './data.store';
import { todayKey } from './dates';
import { Tracker, ViewMode } from './models';

const PREFS_KEY = 'janinayear:prefs:v1';

interface Prefs {
  trackerId?: string;
  view?: ViewMode;
}

export type TrackerEditorState = { mode: 'new' } | { mode: 'edit'; trackerId: string };

/** Navigation and overlay state shared across the app. */
@Injectable({ providedIn: 'root' })
export class UiState {
  private readonly store = inject(DataStore);
  private readonly prefs = readPrefs();

  readonly today = signal(todayKey());
  readonly year = signal(new Date().getFullYear());
  readonly month = signal(new Date().getMonth());
  readonly view = signal<ViewMode>(this.prefs.view ?? 'year');

  private readonly selectedTrackerId = signal<string | undefined>(this.prefs.trackerId);
  readonly tracker = computed((): Tracker | undefined => {
    const trackers = this.store.trackers();
    return trackers.find((t) => t.id === this.selectedTrackerId()) ?? trackers[0];
  });

  readonly editingDay = signal<string | null>(null);
  readonly trackerEditor = signal<TrackerEditorState | null>(null);
  readonly settingsOpen = signal(false);

  constructor() {
    effect(() => {
      const prefs: Prefs = { trackerId: this.tracker()?.id, view: this.view() };
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
      } catch {
        // Preferences are a convenience only.
      }
    });

    // Keep "today" correct when the app stays open past midnight.
    const refresh = () => this.today.set(todayKey());
    const timer = setInterval(refresh, 60_000);
    document.addEventListener('visibilitychange', refresh);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', refresh);
    });
  }

  selectTracker(id: string) {
    this.selectedTrackerId.set(id);
  }

  stepYear(delta: number) {
    this.year.update((y) => y + delta);
  }

  stepMonth(delta: number) {
    const total = this.year() * 12 + this.month() + delta;
    this.year.set(Math.floor(total / 12));
    this.month.set(((total % 12) + 12) % 12);
  }

  goToToday() {
    const now = new Date();
    this.year.set(now.getFullYear());
    this.month.set(now.getMonth());
  }
}

function readPrefs(): Prefs {
  try {
    return JSON.parse(localStorage.getItem(PREFS_KEY) ?? '{}') as Prefs;
  } catch {
    return {};
  }
}
