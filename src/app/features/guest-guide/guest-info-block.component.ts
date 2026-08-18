import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-info-block',
  template: `
    <article class="guest-info-block">
      @if (label()) {
        <h2>{{ label() }}</h2>
      }
      <p>{{ value() }}</p>
    </article>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestInfoBlockComponent {
  readonly label = input('');
  readonly value = input.required<string>();
}
