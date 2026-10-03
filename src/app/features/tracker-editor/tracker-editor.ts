import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, output, signal } from '@angular/core';
import { DataStore } from '../../core/data.store';
import { Tracker, TrackerOption } from '../../core/models';
import { PhotoStore } from '../../core/photo.store';
import { EMOJI_SUGGESTIONS, PALETTE, TEMPLATES, TrackerTemplate, trackerFromTemplate } from '../../core/templates';
import { ToastService } from '../../core/toast.service';
import { TrackerEditorState } from '../../core/ui.state';
import { uid } from '../../core/util';
import { Icon } from '../../ui/icon';
import { Sheet } from '../../ui/sheet';

const MAX_OPTIONS = 12;

@Component({
  selector: 'app-tracker-editor',
  imports: [Sheet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tracker-editor.html',
  styleUrl: './tracker-editor.scss',
})
export class TrackerEditor implements OnInit {
  private readonly store = inject(DataStore);
  private readonly photos = inject(PhotoStore);
  private readonly toast = inject(ToastService);

  readonly state = input.required<TrackerEditorState>();
  readonly closed = output<void>();
  readonly saved = output<string>();

  protected readonly templates = TEMPLATES;
  protected readonly palette = PALETTE;
  protected readonly emojis = EMOJI_SUGGESTIONS;
  protected readonly maxOptions = MAX_OPTIONS;

  protected readonly draft = signal<Tracker | null>(null);
  protected readonly colorFor = signal<string | null>(null);
  protected readonly confirmDelete = signal(false);
  protected readonly submitted = signal(false);

  protected readonly isNew = computed(() => this.state().mode === 'new');
  protected readonly canDelete = computed(() => !this.isNew() && this.store.trackers().length > 1);
  protected readonly errors = computed(() => {
    const d = this.draft();
    if (!d) return [];
    const out: string[] = [];
    if (!d.title.trim()) out.push('Nadaj trackerowi nazwę.');
    if (!d.options.length) out.push('Dodaj przynajmniej jedną opcję.');
    if (d.options.some((o) => !o.label.trim())) out.push('Każda opcja potrzebuje etykiety.');
    return out;
  });

  ngOnInit() {
    const state = this.state();
    if (state.mode === 'edit') {
      const tracker = this.store.trackers().find((t) => t.id === state.trackerId);
      this.draft.set(tracker ? structuredClone(tracker) : null);
    }
  }

  protected useTemplate(template: TrackerTemplate) {
    this.draft.set(trackerFromTemplate(template));
  }

  protected patch(changes: Partial<Tracker>) {
    this.draft.update((d) => (d ? { ...d, ...changes } : d));
  }

  protected patchOption(id: string, changes: Partial<TrackerOption>) {
    this.draft.update((d) =>
      d ? { ...d, options: d.options.map((o) => (o.id === id ? { ...o, ...changes } : o)) } : d,
    );
  }

  protected addOption() {
    this.draft.update((d) => {
      if (!d || d.options.length >= MAX_OPTIONS) return d;
      const used = new Set(d.options.map((o) => o.color));
      const color = PALETTE.find((c) => !used.has(c)) ?? PALETTE[0];
      return { ...d, options: [...d.options, { id: uid(), label: '', color }] };
    });
  }

  protected removeOption(id: string) {
    this.draft.update((d) => (d ? { ...d, options: d.options.filter((o) => o.id !== id) } : d));
  }

  protected moveOption(index: number, delta: number) {
    this.draft.update((d) => {
      if (!d) return d;
      const options = [...d.options];
      const to = index + delta;
      if (to < 0 || to >= options.length) return d;
      [options[index], options[to]] = [options[to], options[index]];
      return { ...d, options };
    });
  }

  protected pickColor(id: string, color: string) {
    this.patchOption(id, { color });
    this.colorFor.set(null);
  }

  protected value(event: Event) {
    return (event.target as HTMLInputElement).value;
  }

  protected save() {
    this.submitted.set(true);
    const d = this.draft();
    if (!d || this.errors().length) return;

    const tracker: Tracker = {
      ...d,
      title: d.title.trim(),
      emoji: d.emoji.trim() || '✨',
      options: d.options.map((o) => ({ ...o, label: o.label.trim() })),
    };
    if (this.isNew()) {
      this.store.addTracker(tracker);
      this.toast.show(`Dodano tracker „${tracker.title}”`);
    } else {
      this.store.updateTracker(tracker);
      this.toast.show('Zapisano zmiany');
    }
    this.saved.emit(tracker.id);
  }

  protected remove() {
    const d = this.draft();
    if (!d || !this.canDelete()) return;
    if (!this.confirmDelete()) {
      this.confirmDelete.set(true);
      return;
    }
    void this.photos.remove(this.store.deleteTracker(d.id));
    this.toast.show(`Usunięto tracker „${d.title}”`);
    this.closed.emit();
  }
}
