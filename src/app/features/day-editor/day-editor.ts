import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { DataStore } from '../../core/data.store';
import { addDays, formatLong } from '../../core/dates';
import { Tracker } from '../../core/models';
import { PhotoStore } from '../../core/photo.store';
import { ToastService } from '../../core/toast.service';
import { inkOn } from '../../core/util';
import { Icon } from '../../ui/icon';
import { Photo } from '../../ui/photo';
import { Sheet } from '../../ui/sheet';

const MAX_PHOTOS = 6;

@Component({
  selector: 'app-day-editor',
  imports: [Sheet, Icon, Photo],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './day-editor.html',
  styleUrl: './day-editor.scss',
  host: { '(document:keydown)': 'onKey($event)' },
})
export class DayEditor {
  private readonly store = inject(DataStore);
  private readonly photos = inject(PhotoStore);
  private readonly toast = inject(ToastService);

  readonly tracker = input.required<Tracker>();
  readonly dateKey = input.required<string>();
  readonly today = input.required<string>();
  readonly navigate = output<string>();
  readonly closed = output<void>();

  protected readonly maxPhotos = MAX_PHOTOS;
  protected readonly inkOn = inkOn;
  protected readonly uploading = signal(false);
  protected readonly viewing = signal<string | null>(null);

  protected readonly entry = computed(() => this.store.data().entries[this.tracker().id]?.[this.dateKey()] ?? {});
  protected readonly title = computed(() => formatLong(this.dateKey()));
  protected readonly isToday = computed(() => this.dateKey() === this.today());
  protected readonly canGoNext = computed(() => this.dateKey() < this.today());
  protected readonly isEmpty = computed(() => {
    const e = this.entry();
    return !e.optionId && !e.note && !e.photos?.length;
  });

  protected choose(optionId: string) {
    const current = this.entry().optionId;
    this.store.setEntry(this.tracker().id, this.dateKey(), {
      optionId: current === optionId ? undefined : optionId,
    });
  }

  protected setNote(event: Event) {
    const note = (event.target as HTMLTextAreaElement).value;
    this.store.setEntry(this.tracker().id, this.dateKey(), { note: note || undefined });
  }

  protected async addPhotos(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    const files = Array.from(inputEl.files ?? []);
    inputEl.value = '';
    const free = MAX_PHOTOS - (this.entry().photos?.length ?? 0);
    if (!files.length || free <= 0) {
      return;
    }
    if (files.length > free) {
      this.toast.show(`Można dodać maksymalnie ${MAX_PHOTOS} zdjęć do jednego dnia`);
    }

    // Capture the target day - the user may navigate while photos are processing.
    const trackerId = this.tracker().id;
    const key = this.dateKey();
    this.uploading.set(true);
    try {
      const ids: string[] = [];
      for (const file of files.slice(0, free)) {
        ids.push(await this.photos.add(file));
      }
      const existing = this.store.entries(trackerId)[key]?.photos ?? [];
      this.store.setEntry(trackerId, key, { photos: [...existing, ...ids] });
    } catch (e) {
      console.error(e);
      this.toast.show('Nie udało się dodać zdjęcia');
    } finally {
      this.uploading.set(false);
    }
  }

  protected removePhoto(id: string) {
    const photos = (this.entry().photos ?? []).filter((p) => p !== id);
    this.store.setEntry(this.tracker().id, this.dateKey(), { photos: photos.length ? photos : undefined });
    void this.photos.remove([id]);
    if (this.viewing() === id) {
      this.viewing.set(null);
    }
  }

  protected clearDay() {
    const ids = this.entry().photos ?? [];
    this.store.setEntry(this.tracker().id, this.dateKey(), {
      optionId: undefined,
      note: undefined,
      photos: undefined,
    });
    void this.photos.remove(ids);
  }

  protected go(delta: number) {
    if (delta > 0 && !this.canGoNext()) {
      return;
    }
    this.viewing.set(null);
    this.navigate.emit(addDays(this.dateKey(), delta));
  }

  protected dismiss() {
    if (this.viewing()) {
      this.viewing.set(null);
    } else {
      this.closed.emit();
    }
  }

  protected onKey(event: KeyboardEvent) {
    const target = event.target as HTMLElement | null;
    if (target?.closest('textarea, input') || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }
    if (event.key === 'ArrowLeft') {
      this.go(-1);
    } else if (event.key === 'ArrowRight') {
      this.go(1);
    } else if (/^[1-9]$/.test(event.key)) {
      const option = this.tracker().options[Number(event.key) - 1];
      if (option) {
        this.choose(option.id);
      }
    }
  }
}
