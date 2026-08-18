import { TestBed } from '@angular/core/testing';
import { TranslateService } from '@ngx-translate/core';
import { provideRouter, Router } from '@angular/router';
import { AuthSessionRepository, WEB_CRYPTO } from '../../../core/auth';
import { storageSuccess } from '../../../core/storage';
import { AccountWorkspaceRepository } from '../../../core/workspace';
import type { Property } from '../../../domain/property';
import { createTranslateServiceStub } from '../../../testing/translate-service.stub';
import { NewPropertyPage } from './new-property.page';

describe('NewPropertyPage', () => {
  const propertyId = '102bb9ea-9c3f-46bb-85fd-a14a5a4f2d69';
  const authSessionRepository = {
    read: vi.fn(() =>
      storageSuccess({
        accountId: 'account-42',
        authenticatedAt: '2026-08-13T10:00:00.000Z',
      }),
    ),
  };
  const workspaceRepository = {
    upsertProperty: vi.fn((property: Property) =>
      storageSuccess({ schemaVersion: 1 as const, profile: null, properties: [property] }),
    ),
  };
  const cryptoProvider = {
    randomUUID: vi.fn(() => propertyId),
  } as unknown as Crypto;

  it('creates a default property for the active account and opens its overview', async () => {
    await TestBed.configureTestingModule({
      imports: [NewPropertyPage],
      providers: [
        provideRouter([]),
        { provide: AuthSessionRepository, useValue: authSessionRepository },
        { provide: AccountWorkspaceRepository, useValue: workspaceRepository },
        { provide: WEB_CRYPTO, useValue: cryptoProvider },
        { provide: TranslateService, useValue: createTranslateServiceStub() },
      ],
    }).compileComponents();
    const router = TestBed.inject(Router);
    const navigate = vi.spyOn(router, 'navigate').mockResolvedValue(true);
    const fixture = TestBed.createComponent(NewPropertyPage);

    fixture.detectChanges();

    expect(workspaceRepository.upsertProperty).toHaveBeenCalledWith(
      expect.objectContaining({ id: propertyId, ownerAccountId: 'account-42' }),
    );
    expect(navigate).toHaveBeenCalledWith(['/owner/properties', propertyId, 'edit', 'overview'], {
      replaceUrl: true,
    });
  });
});
