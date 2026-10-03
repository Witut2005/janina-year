import { ChangeDetectionStrategy, Component, OnInit, inject, output, signal } from '@angular/core';
import { DataStore, isAppData } from '../../core/data.store';
import { todayKey } from '../../core/dates';
import { Backup } from '../../core/models';
import { PhotoStore } from '../../core/photo.store';
import { ToastService } from '../../core/toast.service';
import { UiState } from '../../core/ui.state';
import { downloadFile } from '../../core/util';
import { Icon } from '../../ui/icon';
import { Sheet } from '../../ui/sheet';

@Component({
  selector: 'app-settings',
  imports: [Sheet, Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.html',
  styleUrl: './settings.scss',
})
export class Settings implements OnInit {
  protected readonly store = inject(DataStore);
  protected readonly ui = inject(UiState);
  private readonly photos = inject(PhotoStore);
  private readonly toast = inject(ToastService);

  readonly closed = output<void>();

  protected readonly usage = signal<string | null>(null);
  protected readonly persisted = signal<boolean | null>(null);
  protected readonly confirmReset = signal(false);
  protected readonly busy = signal(false);

  async ngOnInit() {
    if (!navigator.storage) return;
    try {
      const [estimate, persisted] = await Promise.all([navigator.storage.estimate(), navigator.storage.persisted()]);
      this.usage.set(formatBytes(estimate.usage ?? 0));
      this.persisted.set(persisted);
    } catch {
      // Not critical - just hides the storage line.
    }
  }

  protected entryCount(trackerId: string) {
    return Object.values(this.store.entries(trackerId)).filter((e) => e.optionId).length;
  }

  protected editTracker(id: string) {
    this.closed.emit();
    this.ui.trackerEditor.set({ mode: 'edit', trackerId: id });
  }

  protected async exportBackup() {
    this.busy.set(true);
    try {
      const backup: Backup = {
        app: 'janinayear',
        version: 1,
        exportedAt: new Date().toISOString(),
        data: this.store.data(),
        photos: await this.photos.exportAll(),
      };
      downloadFile(`janinayear-${todayKey()}.json`, JSON.stringify(backup));
      this.toast.show('Kopia zapasowa zapisana');
    } catch (e) {
      console.error(e);
      this.toast.show('Nie udało się wyeksportować danych');
    } finally {
      this.busy.set(false);
    }
  }

  protected async importBackup(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    const file = inputEl.files?.[0];
    inputEl.value = '';
    if (!file) return;

    this.busy.set(true);
    try {
      const parsed = JSON.parse(await file.text()) as Partial<Backup>;
      if (parsed.app !== 'janinayear' || !isAppData(parsed.data)) {
        throw new Error('Nieprawidłowy plik kopii');
      }
      const photos = Object.fromEntries(
        Object.entries(parsed.photos ?? {}).filter(
          ([, url]) => typeof url === 'string' && url.startsWith('data:image/'),
        ),
      );
      await this.photos.replaceAll(photos);
      this.store.replaceAll(parsed.data);
      this.toast.show('Przywrócono dane z kopii');
      this.closed.emit();
    } catch (e) {
      console.error(e);
      this.toast.show('To nie jest poprawny plik kopii JaninaYear');
    } finally {
      this.busy.set(false);
    }
  }

  protected async persist() {
    const granted = await navigator.storage?.persist?.();
    this.persisted.set(!!granted);
    this.toast.show(granted ? 'Przeglądarka nie usunie danych automatycznie' : 'Przeglądarka odrzuciła prośbę');
  }

  protected async reset() {
    if (!this.confirmReset()) {
      this.confirmReset.set(true);
      return;
    }
    await this.photos.replaceAll({});
    this.store.reset();
    this.toast.show('Wszystkie dane zostały usunięte');
    this.closed.emit();
  }
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}
