import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

// Templates use a small app-specific icon vocabulary so feature code stays readable even if the underlying icon set changes again.
const MATERIAL_ICONS: Record<string, string> = {
  activity: 'local_activity',
  'alert-circle': 'error',
  'arrow-left': 'chevron_left',
  'arrow-right': 'chevron_right',
  baby: 'child_care',
  bed: 'bed',
  breakfast: 'breakfast_dining',
  building: 'apartment',
  bus: 'directions_bus',
  calendar: 'calendar_month',
  car: 'directions_car',
  check: 'check',
  checkout: 'logout',
  'chevron-down': 'expand_more',
  'chevron-right': 'chevron_right',
  clock: 'schedule',
  close: 'close',
  coffee: 'coffee',
  compass: 'explore',
  copy: 'content_copy',
  door: 'door_front',
  droplet: 'water_drop',
  edit: 'edit',
  events: 'event',
  'external-link': 'open_in_new',
  eye: 'visibility',
  'eye-off': 'visibility_off',
  globe: 'language',
  'help-circle': 'help',
  home: 'home',
  'home-care': 'home_repair_service',
  image: 'image',
  info: 'info',
  key: 'key',
  list: 'list',
  lock: 'lock',
  'log-out': 'logout',
  luggage: 'luggage',
  mail: 'mail',
  'map-pin': 'location_on',
  menu: 'menu',
  minus: 'remove',
  moon: 'dark_mode',
  'more-horizontal': 'more_horiz',
  parking: 'local_parking',
  pet: 'pets',
  phone: 'call',
  plus: 'add',
  restaurant: 'restaurant',
  save: 'save',
  smoking: 'smoking_rooms',
  sparkles: 'auto_awesome',
  star: 'star',
  supermarket: 'store',
  thermometer: 'device_thermostat',
  trash: 'delete',
  unlock: 'lock_open',
  user: 'person',
  wifi: 'wifi',
} as const;

export type IconName = keyof typeof MATERIAL_ICONS;

@Component({
  selector: 'app-icon',
  standalone: true,
  imports: [MatIconModule],
  template: `
    <mat-icon
      class="ui-icon"
      [fontSet]="'material-symbols-outlined'"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
      [attr.data-icon-name]="name()"
    >
      {{ materialIconName() }}
    </mat-icon>
  `,
  styles: `
    :host {
      display: inline-flex;
      inline-size: 1em;
      block-size: 1em;
      flex: none;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      line-height: 1;
    }

    .ui-icon {
      inline-size: 1em;
      block-size: 1em;
      font-size: inherit;
      line-height: 1;
      color: currentColor;
      font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  readonly name = input.required<IconName>();
  readonly label = input<string | null>(null);

  protected readonly materialIconName = () => MATERIAL_ICONS[this.name()];
}
