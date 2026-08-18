import { ChangeDetectionStrategy, Component, input } from '@angular/core';

const ICON_PATHS = {
  activity: [
    'm12 2 1.2 3.8L17 7l-3.8 1.2L12 12l-1.2-3.8L7 7l3.8-1.2L12 2Z',
    'm6 13 .8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8L6 13ZM18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z',
  ],
  'alert-circle': ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 8v5', 'M12 17h.01'],
  'arrow-left': ['m15 18-6-6 6-6'],
  'arrow-right': ['m9 18 6-6-6-6'],
  baby: [
    'M9 12h6a4 4 0 0 1 4 4v2H5v-2a4 4 0 0 1 4-4Z',
    'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z',
    'M9.5 8h.01M14.5 8h.01',
  ],
  bed: ['M3 5v14M21 19v-7a2 2 0 0 0-2-2H3', 'M7 10V7h5a2 2 0 0 1 2 2v1', 'M3 16h18'],
  breakfast: ['M4 11h12v3a6 6 0 0 1-12 0v-3Z', 'M16 12h2a2 2 0 0 1 0 4h-2', 'M7 3v3M11 3v3'],
  building: [
    'M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17',
    'M16 8h3a1 1 0 0 1 1 1v12M8 7h4M8 11h4M8 15h4M9 21v-2h2v2',
  ],
  bus: [
    'M6 17h12a2 2 0 0 0 2-2V6c0-3-3.5-4-8-4S4 3 4 6v9a2 2 0 0 0 2 2Z',
    'M4 9h16M7 13h.01M17 13h.01M7 17v3M17 17v3',
  ],
  calendar: ['M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM3 9h18', 'M8 2v4M16 2v4'],
  car: [
    'm5 11 2-5h10l2 5',
    'M3 13a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v5H3v-5ZM6 18v2M18 18v2M7 14h.01M17 14h.01',
  ],
  check: ['m5 12 4 4L19 6'],
  checkout: ['M4 4h10v16H4V4Z', 'M9 12h11M16 8l4 4-4 4'],
  'chevron-down': ['m6 9 6 6 6-6'],
  'chevron-right': ['m9 18 6-6-6-6'],
  clock: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 6v6l4 2'],
  close: ['M6 6l12 12M18 6 6 18'],
  coffee: ['M4 8h12v5a6 6 0 0 1-12 0V8Z', 'M16 9h2a2 2 0 0 1 0 4h-2M6 3v2M10 3v2M14 3v2'],
  compass: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'm15.5 8.5-2 5-5 2 2-5 5-2Z'],
  copy: ['M8 8h11v11H8V8Z', 'M16 8V5H5v11h3'],
  door: ['M5 21V4a1 1 0 0 1 1-1h11a1 1 0 0 1 1 1v18', 'M5 21h14M14 12h.01'],
  droplet: ['M12 2s7 7.1 7 12a7 7 0 0 1-14 0c0-4.9 7-12 7-12Z'],
  edit: ['M4 20h4L19 9l-4-4L4 16v4ZM13.5 6.5l4 4'],
  events: ['M5 4h14a2 2 0 0 1 2 2v14H3V6a2 2 0 0 1 2-2ZM3 9h18', 'M8 2v4M16 2v4M8 13h3M8 17h6'],
  'external-link': ['M14 4h6v6M20 4l-9 9', 'M18 13v7H4V6h7'],
  eye: [
    'M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z',
    'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  'eye-off': [
    'M3 3l18 18',
    'M10.6 6.2A9.8 9.8 0 0 1 12 6c6 0 9.5 6 9.5 6a13 13 0 0 1-2.1 2.8M6.1 6.1C3.7 7.8 2.5 12 2.5 12s3.5 6 9.5 6c1.3 0 2.5-.3 3.5-.7M9.9 9.9a3 3 0 0 0 4.2 4.2',
  ],
  globe: [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
    'M2 12h20M12 2c3 3 3 17 0 20M12 2c-3 3-3 17 0 20',
  ],
  'help-circle': [
    'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z',
    'M9.7 9a2.5 2.5 0 1 1 3.1 2.4c-.8.4-.8.9-.8 1.6M12 17h.01',
  ],
  home: ['M3 11.5 12 4l9 7.5', 'M5 10v10h14V10M9 20v-6h6v6'],
  'home-care': ['M3 11.5 12 4l9 7.5M5 10v10h14V10', 'm9 15 2 2 4-5'],
  image: ['M4 4h16v16H4V4Z', 'M8.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3ZM4 17l4-4 3 3 2-2 7 6'],
  info: ['M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Z', 'M12 11v6M12 7h.01'],
  key: ['M14 8a5 5 0 1 0-1.5 3.6L21 20v-4h-3v-3h-3l-2.5-1.4', 'M7 8h.01'],
  list: ['M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01'],
  lock: ['M5 10h14v11H5V10Z', 'M8 10V7a4 4 0 0 1 8 0v3M12 14v3'],
  'log-out': ['M10 4H4v16h6M14 8l4 4-4 4M18 12H9'],
  luggage: [
    'M6 7h12a2 2 0 0 1 2 2v10H4V9a2 2 0 0 1 2-2ZM9 7V4h6v3M8 11v4M16 11v4',
    'M8 21h.01M16 21h.01',
  ],
  mail: ['M3 5h18v14H3V5Z', 'm3 7 9 7 9-7'],
  'map-pin': [
    'M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z',
    'M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
  ],
  menu: ['M4 7h16M4 12h16M4 17h16'],
  minus: ['M5 12h14'],
  moon: ['M20 15.5A8.5 8.5 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z'],
  'more-horizontal': ['M5 12h.01M12 12h.01M19 12h.01'],
  parking: ['M5 3h7a6 6 0 0 1 0 12H5V3ZM5 15v6', 'M5 9h7a0 0 0 0 0-6H5'],
  pet: [
    'M8 11c-3 0-4 2-4 4 0 3 3 5 8 5s8-2 8-5c0-2-1-4-4-4-1-4-7-4-8 0Z',
    'M6 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM18 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM11 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0ZM17 4a2 2 0 1 0-4 0 2 2 0 0 0 4 0Z',
  ],
  phone: ['M7 3H4v4c0 7 6 13 13 13h4v-3l-5-2-2 2c-3-1-6-4-7-7l2-2-2-5Z'],
  plus: ['M12 5v14M5 12h14'],
  restaurant: ['M7 3v7M4 3v4a3 3 0 0 0 6 0V3M7 10v11', 'M17 3c-2 2-2 7 0 9v9M17 3v9h3'],
  save: ['M4 4h13l3 3v13H4V4Z', 'M8 4v6h8V4M8 20v-6h8v6'],
  smoking: ['M3 14h15v4H3v-4ZM18 14h3v4h-3', 'M15 10c0-2 3-2 3-5M11 10c0-3 4-3 4-7'],
  sparkles: [
    'm12 2 1.2 3.8L17 7l-3.8 1.2L12 12l-1.2-3.8L7 7l3.8-1.2L12 2Z',
    'm6 13 .8 2.2L9 16l-2.2.8L6 19l-.8-2.2L3 16l2.2-.8L6 13ZM18 14l.7 2.3L21 17l-2.3.7L18 20l-.7-2.3L15 17l2.3-.7L18 14Z',
  ],
  star: ['m12 2 3 6 6.5 1-4.7 4.6 1.1 6.4-5.9-3-5.9 3 1.1-6.4L2.5 9 9 8l3-6Z'],
  supermarket: [
    'M3 4h2l2 11h10l3-8H6',
    'M9 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2ZM17 20a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z',
  ],
  thermometer: ['M14 14.8V5a4 4 0 0 0-8 0v9.8a6 6 0 1 0 8 0Z', 'M10 8v8M10 19h.01'],
  trash: ['M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6'],
  unlock: ['M5 10h14v11H5V10Z', 'M8 10V7a4 4 0 0 1 7-2.6M12 14v3'],
  user: ['M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z', 'M4 22a8 8 0 0 1 16 0'],
  wifi: ['M3 9a14 14 0 0 1 18 0M6 13a9 9 0 0 1 12 0M9.5 16.5a4 4 0 0 1 5 0', 'M12 20h.01'],
} as const;

export type IconName = keyof typeof ICON_PATHS;

@Component({
  selector: 'app-icon',
  template: `
    <svg
      class="ui-icon"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.9"
      focusable="false"
      [attr.role]="label() ? 'img' : null"
      [attr.aria-label]="label() || null"
      [attr.aria-hidden]="label() ? null : 'true'"
    >
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
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
      inline-size: 100%;
      block-size: 100%;
      overflow: visible;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UiIconComponent {
  readonly name = input.required<IconName>();
  readonly label = input<string | null>(null);

  protected readonly paths = () => ICON_PATHS[this.name()];
}
