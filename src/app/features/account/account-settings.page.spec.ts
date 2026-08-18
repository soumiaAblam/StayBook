import { TestBed } from '@angular/core/testing';
import { AccountWorkspaceRepository } from '../../core/workspace';
import { AccountSettingsPage } from './account-settings.page';

describe('AccountSettingsPage', () => {
  const updateProfile = vi.fn();

  beforeEach(async () => {
    updateProfile.mockReset().mockReturnValue({ ok: true, value: {} });
    await TestBed.configureTestingModule({
      imports: [AccountSettingsPage],
      providers: [
        {
          provide: AccountWorkspaceRepository,
          useValue: {
            read: () => ({
              ok: true,
              value: {
                profile: {
                  accountId: 'account-1',
                  displayName: 'StayBook Owner',
                  contactEmail: 'host@example.com',
                  contactPhone: '',
                  photoDataUrl: null,
                },
                properties: [],
              },
            }),
            updateProfile,
          },
        },
      ],
    }).compileComponents();
  });

  it('updates the guest contact profile without changing the login record', () => {
    const fixture = TestBed.createComponent(AccountSettingsPage);
    fixture.componentInstance.form.patchValue({ contactPhone: '+34 600 000 000' });

    fixture.componentInstance.save();

    expect(updateProfile).toHaveBeenCalledWith(
      expect.objectContaining({ accountId: 'account-1', contactPhone: '+34 600 000 000' }),
    );
  });
});
