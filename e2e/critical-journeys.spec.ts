import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const fixtureEmail = 'demo@staybook.local';
const fixturePassword = 'StayBookDemo2026!';

async function resetBrowserStorage(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
}

async function chooseEnglish(page: Page): Promise<void> {
  await page.goto('/');
  await page.getByRole('button', { name: /English/ }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await expect(page).toHaveURL(/\/auth\/sign-in$/);
}

async function assertNoSeriousAccessibilityViolations(page: Page): Promise<void> {
  const scan = await new AxeBuilder({ page }).analyze();
  expect(
    scan.violations.filter(({ impact }) => ['serious', 'critical'].includes(impact ?? '')),
  ).toEqual([]);
}

test.describe('critical StayBook journeys', () => {
  test.beforeEach(async ({ page }) => resetBrowserStorage(page));

  test('changes the fixed interface language and creates an empty local account', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByRole('button', { name: /Español/ }).click();
    await expect(page.getByRole('heading', { name: 'Elige tu idioma' })).toBeVisible();
    await page.getByRole('button', { name: 'Continuar' }).click();
    await page.getByRole('link', { name: 'Crea una' }).click();

    const email = `owner-${Date.now()}@example.test`;
    await page.getByLabel('Nombre completo').fill('StayBook Test Owner');
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña', { exact: true }).fill('AccessibleTest2026!');
    await page.getByLabel('Confirmar contraseña').fill('AccessibleTest2026!');
    await page.getByRole('button', { name: 'Crear cuenta' }).click();

    await expect(page).toHaveURL(/\/auth\/sign-in$/);
    await page.getByLabel('Correo electrónico').fill(email);
    await page.getByLabel('Contraseña').fill('AccessibleTest2026!');
    await page.getByRole('button', { name: 'Iniciar sesión' }).click();

    await expect(page).toHaveURL(/\/owner\/properties$/);
    await expect(page.getByRole('heading', { name: 'Aún no hay propiedades…' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Añade tu primera propiedad/ })).toBeVisible();
    await assertNoSeriousAccessibilityViolations(page);
  });

  test('opens the three-property fixture dashboard and Guest guide', async ({ page }) => {
    await chooseEnglish(page);
    await page.getByLabel('Email address').fill(fixtureEmail);
    await page.getByLabel('Password').fill(fixturePassword);
    await page.getByRole('button', { name: 'Sign in' }).click();

    await expect(page).toHaveURL(/\/owner\/properties$/);
    await expect(page.locator('article.property-card')).toHaveCount(3);
    await expect(page.getByText('Azure Courtyard', { exact: true })).toBeVisible();

    const preview = page
      .locator('article.property-card')
      .filter({ hasText: 'Azure Courtyard' })
      .getByRole('link', { name: 'Preview guide' });
    await preview.click();

    await expect(page).toHaveURL(/\/guide\/fixture-property-complete$/);
    await expect(page.getByText('Before you arrive')).toBeVisible();
    await expect(page.getByText('Essentials now', { exact: true })).toBeVisible();
    await expect(page.getByText('During your stay')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
      true,
    );
    await assertNoSeriousAccessibilityViolations(page);
  });
});
