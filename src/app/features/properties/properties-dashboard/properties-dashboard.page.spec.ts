import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { AccountWorkspaceRepository, createFixtureWorkspace } from '../../../core/workspace';
import { storageSuccess } from '../../../core/storage';
import type { Property } from '../../../domain/property';
import { createTranslateServiceStub } from '../../../testing/translate-service.stub';
import { PropertiesDashboardPage } from './properties-dashboard.page';

describe('PropertiesDashboardPage', () => {
  const repository = {
    listProperties: vi.fn<() => ReturnType<typeof storageSuccess<readonly Property[]>>>(),
  };

  beforeEach(async () => {
    localStorage.clear();
    repository.listProperties.mockReset();

    await TestBed.configureTestingModule({
      imports: [PropertiesDashboardPage],
      providers: [
        provideRouter([]),
        { provide: AccountWorkspaceRepository, useValue: repository },
        { provide: TranslateService, useValue: createTranslateServiceStub() },
      ],
    }).compileComponents();
  });

  it('renders the minimal empty state when the account has no properties', () => {
    repository.listProperties.mockReturnValue(storageSuccess([]));
    const fixture = TestBed.createComponent(PropertiesDashboardPage);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.desert-illustration')).not.toBeNull();
    expect(element.textContent).toContain('No properties yet…');
    expect(element.textContent).toContain('Add your first property');
    expect(element.querySelectorAll('[data-testid="property-card"]')).toHaveLength(0);
  });

  it('renders exactly the three fixture properties as full-width cards', () => {
    repository.listProperties.mockReturnValue(
      storageSuccess(createFixtureWorkspace(new Date('2026-08-13T10:00:00.000Z')).properties),
    );
    const fixture = TestBed.createComponent(PropertiesDashboardPage);

    fixture.detectChanges();

    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelectorAll('[data-testid="property-card"]')).toHaveLength(3);
    expect(element.textContent).toContain('Azure Courtyard');
    expect(element.textContent).toContain('Olive Garden Studio');
    expect(element.textContent).toContain('Cactus House Draft');
    expect(element.textContent).not.toContain('Next best step');
  });
});
