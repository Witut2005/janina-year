import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PwaService } from '../core/pwa.service';

@Component({
  selector: 'ui-update-banner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (pwa.updateReady()) {
      <div class="update-banner" role="status">
        <span>Dostępna nowa wersja JaninaYear</span>
        <button type="button" class="btn btn-primary small" (click)="pwa.applyUpdate()">Odśwież</button>
      </div>
    }
  `,
})
export class UpdateBanner {
  protected readonly pwa = inject(PwaService);
}
