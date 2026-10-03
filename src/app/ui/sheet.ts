import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, input, output } from '@angular/core';

let openSheets = 0;

/** Modal panel: bottom sheet on phones, centered dialog on wider screens. */
@Component({
  selector: 'ui-sheet',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown.escape)': 'dismiss.emit()' },
  template: `
    <div class="sheet-backdrop" (click)="dismiss.emit()"></div>
    <div class="sheet-panel" role="dialog" aria-modal="true" [attr.aria-label]="label()" [class.wide]="wide()">
      <div class="sheet-handle"></div>
      <ng-content />
    </div>
  `,
})
export class Sheet implements OnInit, OnDestroy {
  readonly label = input('');
  readonly wide = input(false);
  readonly dismiss = output<void>();

  ngOnInit() {
    if (openSheets++ === 0) {
      document.body.classList.add('no-scroll');
    }
  }

  ngOnDestroy() {
    if (--openSheets === 0) {
      document.body.classList.remove('no-scroll');
    }
  }
}
