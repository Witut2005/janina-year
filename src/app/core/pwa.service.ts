import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';

/** Chromium-only event, not in the TS DOM typings. */
interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const UPDATE_CHECK_INTERVAL = 30 * 60_000;

/** Install prompt, service worker updates and persistent storage. */
@Injectable({ providedIn: 'root' })
export class PwaService {
  private readonly updates = inject(SwUpdate);
  private installEvent: BeforeInstallPromptEvent | null = null;

  readonly canInstall = signal(false);
  readonly updateReady = signal(false);
  readonly standalone = matchMedia('(display-mode: standalone)').matches;

  constructor() {
    const onBeforeInstall = (event: Event) => {
      event.preventDefault();
      this.installEvent = event as BeforeInstallPromptEvent;
      this.canInstall.set(true);
    };
    const onInstalled = () => {
      this.installEvent = null;
      this.canInstall.set(false);
      void this.persistStorage();
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);

    let timer: ReturnType<typeof setInterval> | undefined;
    const check = () => {
      if (document.visibilityState === 'visible') {
        this.updates.checkForUpdate().catch((e) => console.error(e));
      }
    };
    if (this.updates.isEnabled) {
      this.updates.versionUpdates.subscribe((event) => {
        if (event.type === 'VERSION_READY') {
          this.updateReady.set(true);
        }
      });
      // A broken cache can't be fixed in place - reload onto a fresh version.
      this.updates.unrecoverable.subscribe(() => location.reload());
      timer = setInterval(check, UPDATE_CHECK_INTERVAL);
      document.addEventListener('visibilitychange', check);
    }

    // All data lives on the device, so ask the browser not to evict it.
    if (this.standalone) {
      void this.persistStorage();
    }

    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
      document.removeEventListener('visibilitychange', check);
      clearInterval(timer);
    });
  }

  async install() {
    const event = this.installEvent;
    if (!event) return;
    await event.prompt();
    const { outcome } = await event.userChoice;
    if (outcome === 'accepted') {
      this.installEvent = null;
      this.canInstall.set(false);
    }
  }

  async applyUpdate() {
    try {
      await this.updates.activateUpdate();
    } finally {
      location.reload();
    }
  }

  private async persistStorage() {
    try {
      if (navigator.storage?.persist && !(await navigator.storage.persisted())) {
        await navigator.storage.persist();
      }
    } catch {
      // Best effort only.
    }
  }
}
