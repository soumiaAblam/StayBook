import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { OwnerShellComponent } from './owner-shell.component';

describe('OwnerShellComponent', () => {
  it('renders the Owner navigation without a notification control', async () => {
    await TestBed.configureTestingModule({
      imports: [OwnerShellComponent],
      providers: [provideRouter([])],
    }).compileComponents();

    const fixture = TestBed.createComponent(OwnerShellComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelector('nav')).not.toBeNull();
    expect(element.textContent).toContain('Properties');
    expect(element.textContent).not.toContain('Notifications');
  });
});
