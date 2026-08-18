import { TestBed } from '@angular/core/testing';
import { UiIconComponent } from './ui-icon.component';

describe('UiIconComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UiIconComponent],
    }).compileComponents();
  });

  it('renders a decorative icon hidden from assistive technology by default', () => {
    const fixture = TestBed.createComponent(UiIconComponent);
    fixture.componentRef.setInput('name', 'wifi');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBe('true');
    expect(svg.getAttribute('role')).toBeNull();
    expect(svg.querySelectorAll('path').length).toBeGreaterThan(0);
  });

  it('exposes a meaningful label when the icon carries information', () => {
    const fixture = TestBed.createComponent(UiIconComponent);
    fixture.componentRef.setInput('name', 'alert-circle');
    fixture.componentRef.setInput('label', 'Warning');
    fixture.detectChanges();

    const svg = fixture.nativeElement.querySelector('svg') as SVGElement;
    expect(svg.getAttribute('aria-hidden')).toBeNull();
    expect(svg.getAttribute('role')).toBe('img');
    expect(svg.getAttribute('aria-label')).toBe('Warning');
  });
});
