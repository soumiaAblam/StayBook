import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test.describe('application bootstrap', () => {
  test('loads the StayBook shell without serious accessibility violations', async ({ page }) => {
    await page.goto('/');

    await expect(page).toHaveTitle('StayBook');
    await expect(page.locator('app-root')).toBeAttached();

    const accessibilityScan = await new AxeBuilder({ page }).analyze();
    const seriousViolations = accessibilityScan.violations.filter(({ impact }) =>
      ['serious', 'critical'].includes(impact ?? ''),
    );

    expect(seriousViolations).toEqual([]);
  });
});
