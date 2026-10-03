import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../core/toast.service';

@Component({
  selector: 'ui-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (toast.message(); as message) {
      <div class="toast" role="status">{{ message }}</div>
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
