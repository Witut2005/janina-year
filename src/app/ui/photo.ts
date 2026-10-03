import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { PhotoStore } from '../core/photo.store';

@Component({
  selector: 'ui-photo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ui-photo' },
  template: `
    @if (src(); as url) {
      <img [src]="url" [alt]="alt()" loading="lazy" decoding="async" />
    } @else {
      <span class="ui-photo-loading"></span>
    }
  `,
})
export class Photo {
  private readonly photos = inject(PhotoStore);

  readonly photoId = input.required<string>();
  readonly alt = input('');

  protected readonly src = computed(() => this.photos.url(this.photoId())());
}
