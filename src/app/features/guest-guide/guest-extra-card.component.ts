import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { UiIconComponent, type IconName } from '../../shared/ui';

@Component({
  selector: 'app-extra-card',
  imports: [UiIconComponent],
  template: `
    <article class="guest-extra-card tone-{{ tone() }}">
      <span class="guest-extra-card__icon"><app-icon [name]="icon()" /></span>
      <div>
        <h2>{{ title() }}</h2>
        <p>{{ text() }}</p>
      </div>
    </article>
  `,
  styleUrl: './guest-extra-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestExtraCardComponent {
  readonly tone = input.required<'blue' | 'green' | 'pink' | 'purple' | 'yellow'>();
  readonly icon = input.required<IconName>();
  readonly title = input.required<string>();
  readonly text = input.required<string>();
}
