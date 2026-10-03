import { Injectable, computed, effect, signal } from '@angular/core';
import { AppData, DayEntry, EntryMap, Tracker } from './models';
import { TEMPLATES, trackerFromTemplate } from './templates';

const STORAGE_KEY = 'janinayear:data:v1';

/** All trackers and day entries. Persisted to localStorage on every change. */
@Injectable({ providedIn: 'root' })
export class DataStore {
  private readonly state = signal<AppData>(load());

  readonly data = this.state.asReadonly();
  readonly trackers = computed(() => this.state().trackers);

  constructor() {
    effect(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state()));
      } catch (e) {
        console.error('Nie udało się zapisać danych', e);
      }
    });
  }

  entries(trackerId: string): EntryMap {
    return this.state().entries[trackerId] ?? {};
  }

  setEntry(trackerId: string, key: string, patch: Partial<DayEntry>) {
    this.state.update((s) => {
      const map = { ...(s.entries[trackerId] ?? {}) };
      const next: DayEntry = { ...map[key], ...patch };
      if (isEmpty(next)) {
        delete map[key];
      } else {
        map[key] = next;
      }
      return { ...s, entries: { ...s.entries, [trackerId]: map } };
    });
  }

  addTracker(tracker: Tracker) {
    this.state.update((s) => ({
      ...s,
      trackers: [...s.trackers, tracker],
      entries: { ...s.entries, [tracker.id]: {} },
    }));
  }

  updateTracker(tracker: Tracker) {
    const optionIds = new Set(tracker.options.map((o) => o.id));
    this.state.update((s) => {
      // Days pointing at a removed option lose their color but keep notes & photos.
      const map: EntryMap = {};
      for (const [key, entry] of Object.entries(s.entries[tracker.id] ?? {})) {
        const next = entry.optionId && !optionIds.has(entry.optionId) ? { ...entry, optionId: undefined } : entry;
        if (!isEmpty(next)) {
          map[key] = next;
        }
      }
      return {
        ...s,
        trackers: s.trackers.map((t) => (t.id === tracker.id ? tracker : t)),
        entries: { ...s.entries, [tracker.id]: map },
      };
    });
  }

  /** Returns ids of photos that belonged to the tracker so the caller can drop them. */
  deleteTracker(id: string): string[] {
    const photos = Object.values(this.entries(id)).flatMap((e) => e.photos ?? []);
    this.state.update((s) => {
      const entries = { ...s.entries };
      delete entries[id];
      return { ...s, trackers: s.trackers.filter((t) => t.id !== id), entries };
    });
    return photos;
  }

  moveTracker(id: string, delta: number) {
    this.state.update((s) => {
      const list = [...s.trackers];
      const from = list.findIndex((t) => t.id === id);
      const to = from + delta;
      if (from < 0 || to < 0 || to >= list.length) {
        return s;
      }
      [list[from], list[to]] = [list[to], list[from]];
      return { ...s, trackers: list };
    });
  }

  replaceAll(data: AppData) {
    this.state.set(data);
  }

  reset() {
    this.state.set(seed());
  }
}

function isEmpty(entry: DayEntry): boolean {
  return !entry.optionId && !entry.note?.trim() && !entry.photos?.length;
}

function seed(): AppData {
  const tracker = trackerFromTemplate(TEMPLATES[0]);
  return { version: 1, trackers: [tracker], entries: { [tracker.id]: {} } };
}

export function isAppData(value: unknown): value is AppData {
  const v = value as AppData;
  return (
    !!v &&
    v.version === 1 &&
    Array.isArray(v.trackers) &&
    v.trackers.every((t) => typeof t.id === 'string' && Array.isArray(t.options)) &&
    typeof v.entries === 'object' &&
    v.entries !== null
  );
}

function load(): AppData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed: unknown = JSON.parse(raw);
      if (isAppData(parsed)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Nie udało się wczytać danych', e);
  }
  return seed();
}
