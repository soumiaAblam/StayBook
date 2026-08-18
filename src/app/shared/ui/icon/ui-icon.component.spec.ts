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

    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(icon.getAttribute('role')).toBeNull();
    expect(icon.getAttribute('data-icon-name')).toBe('wifi');
    expect(icon.textContent?.trim()).toBe('wifi');
    expect(icon.classList.contains('material-symbols-outlined')).toBe(true);
  });

  it('exposes a meaningful label when the icon carries information', () => {
    const fixture = TestBed.createComponent(UiIconComponent);
    fixture.componentRef.setInput('name', 'alert-circle');
    fixture.componentRef.setInput('label', 'Warning');
    fixture.detectChanges();

    const icon = fixture.nativeElement.querySelector('mat-icon') as HTMLElement;
    expect(icon).not.toBeNull();
    expect(icon.getAttribute('aria-hidden')).toBeNull();
    expect(icon.getAttribute('role')).toBe('img');
    expect(icon.getAttribute('aria-label')).toBe('Warning');
  });
});
