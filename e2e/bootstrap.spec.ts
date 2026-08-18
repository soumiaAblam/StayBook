import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('application bootstrap', () => {
  test('loads language selection without overflow or serious accessibility violations', async ({
    page,
  }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    await page.goto('/');

    await expect(page).toHaveTitle('StayBook');
    await expect(page.getByRole('heading', { name: 'Choose your language' })).toBeVisible();
    await expect(page.getByRole('button', { name: /English/ })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );

    const accessibilityScan = await new AxeBuilder({ page }).analyze();
    const seriousViolations = accessibilityScan.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    );

    expect(seriousViolations).toEqual([]);
  });
});
