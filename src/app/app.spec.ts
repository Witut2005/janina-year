import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideServiceWorker } from '@angular/service-worker';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    localStorage.clear();
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideZonelessChangeDetection(), provideServiceWorker('ngsw-worker.js', { enabled: false })],
    }).compileComponents();
  });

  it('renders the default mood tracker with a year of pixels', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(el.querySelector('.tracker-tab.active')?.textContent).toContain('Nastrój');
    expect(el.querySelectorAll('app-year-grid button.pixel, app-year-grid .pixel').length).toBe(12 * 31);
  });
});
