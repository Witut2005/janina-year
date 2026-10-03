import { ChangeDetectionStrategy, Component, input, model } from '@angular/core';
import { Icon, IconName } from './icon';

export interface SegmentedOption<T> {
  value: T;
  label: string;
  icon?: IconName;
}

@Component({
  selector: 'ui-segmented',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="segmented" role="tablist">
      @for (option of options(); track option.value) {
        <button
          type="button"
          role="tab"
          class="segment"
          [class.active]="option.value === value()"
          [attr.aria-selected]="option.value === value()"
          (click)="value.set(option.value)"
        >
          @if (option.icon) {
            <ui-icon [name]="option.icon" />
          }
          <span>{{ option.label }}</span>
        </button>
      }
    </div>
  `,
})
export class Segmented<T> {
  readonly options = input.required<SegmentedOption<T>[]>();
  readonly value = model.required<T>();
}
