export interface TrackerOption {
  id: string;
  label: string;
  color: string;
}

export interface Tracker {
  id: string;
  title: string;
  emoji: string;
  /** Ordered from the "best" option to the "worst" one - used for averages in stats. */
  options: TrackerOption[];
  createdAt: number;
}

export interface DayEntry {
  optionId?: string;
  note?: string;
  /** Ids of photos stored in IndexedDB. */
  photos?: string[];
}

/** Entries of a single tracker keyed by `YYYY-MM-DD`. */
export type EntryMap = Record<string, DayEntry>;

export interface AppData {
  version: 1;
  trackers: Tracker[];
  entries: Record<string, EntryMap>;
}

export interface Backup {
  app: 'janinayear';
  version: 1;
  exportedAt: string;
  data: AppData;
  photos: Record<string, string>;
}

export type ViewMode = 'year' | 'month' | 'stats';
