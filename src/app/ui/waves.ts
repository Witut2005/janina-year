import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Soft background waves, same as the Janina new tab page. */
@Component({
  selector: 'ui-waves',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'waves', 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 1440 400" preserveAspectRatio="none">
      <path
        fill="var(--wave-1)"
        fill-opacity="0.4"
        d="M0,224L48,229.3C96,235,192,245,288,234.7C384,224,480,192,576,192C672,192,768,224,864,240C960,256,1056,256,1152,240C1248,224,1344,192,1392,176L1440,160L1440,400L1392,400C1344,400,1248,400,1152,400C1056,400,960,400,864,400C768,400,672,400,576,400C480,400,384,400,288,400C192,400,96,400,48,400L0,400Z"
      />
      <path
        fill="var(--wave-2)"
        fill-opacity="0.6"
        d="M0,288L60,277.3C120,267,240,245,360,245.3C480,245,600,267,720,266.7C840,267,960,245,1080,240C1200,235,1320,245,1380,250.7L1440,256L1440,400L1380,400C1320,400,1200,400,1080,400C960,400,840,400,720,400C600,400,480,400,360,400C240,400,120,400,60,400L0,400Z"
      />
    </svg>
  `,
})
export class Waves {}
