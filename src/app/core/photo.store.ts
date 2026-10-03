import { Injectable, Signal, WritableSignal, signal } from '@angular/core';
import { uid } from './util';

const DB_NAME = 'janinayear';
const STORE = 'photos';
const MAX_EDGE = 1280;

/** Photos live in IndexedDB as JPEG data URLs - localStorage is far too small for them. */
@Injectable({ providedIn: 'root' })
export class PhotoStore {
  private dbPromise: Promise<IDBDatabase> | null = null;
  private readonly cache = new Map<string, WritableSignal<string | null>>();

  /** Reactive data URL of a photo; `null` while loading or when missing. */
  url(id: string): Signal<string | null> {
    let s = this.cache.get(id);
    if (!s) {
      const created = signal<string | null>(null);
      this.cache.set(id, created);
      this.request<string | undefined>('readonly', (st) => st.get(id))
        .then((v) => created.set(v ?? null))
        .catch((e) => console.error(e));
      s = created;
    }
    return s;
  }

  async add(file: File): Promise<string> {
    const dataUrl = await compress(file);
    const id = uid();
    await this.request('readwrite', (st) => st.put(dataUrl, id));
    this.cache.set(id, signal(dataUrl));
    return id;
  }

  async remove(ids: string[]) {
    if (!ids.length) {
      return;
    }
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      ids.forEach((id) => tx.objectStore(STORE).delete(id));
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    ids.forEach((id) => this.cache.delete(id));
  }

  async exportAll(): Promise<Record<string, string>> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const out: Record<string, string> = {};
      const req = db.transaction(STORE, 'readonly').objectStore(STORE).openCursor();
      req.onsuccess = () => {
        const cursor = req.result;
        if (cursor) {
          out[String(cursor.key)] = cursor.value as string;
          cursor.continue();
        } else {
          resolve(out);
        }
      };
      req.onerror = () => reject(req.error);
    });
  }

  async replaceAll(photos: Record<string, string>) {
    const db = await this.db();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      const store = tx.objectStore(STORE);
      store.clear();
      for (const [id, url] of Object.entries(photos)) {
        store.put(url, id);
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    this.cache.clear();
  }

  private db(): Promise<IDBDatabase> {
    return (this.dbPromise ??= new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }));
  }

  private async request<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest): Promise<T> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const req = fn(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result as T);
      req.onerror = () => reject(req.error);
    });
  }
}

async function compress(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvas.toDataURL('image/jpeg', 0.82);
}
