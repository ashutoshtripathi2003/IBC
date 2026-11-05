import { expect, test } from '@playwright/test';

test.describe('desktop navigation', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop only');

  test('moves between sections and marks the current page', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('link', { name: 'Businesses' })
      .click();
    await expect(page).toHaveURL(/\/businesses$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Businesses');
    await expect(
      page.getByRole('navigation', { name: 'Main' }).getByRole('link', { name: 'Businesses' }),
    ).toHaveAttribute('aria-current', 'page');
  });

  test('the Discover menu opens an industry panel', async ({ page }) => {
    await page.goto('/');
    await page
      .getByRole('navigation', { name: 'Main' })
      .getByRole('button', { name: /Discover/ })
      .click();
    await page
      .getByRole('link', { name: /Chemicals/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/industries\/chemicals$/);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Chemicals');
  });
});

test.describe('mobile navigation', () => {
  test.skip(({ isMobile }) => !isMobile, 'mobile only');

  test('menu opens, traps focus, closes with Escape and returns focus', async ({ page }) => {
    await page.goto('/');
    const toggle = page.getByRole('button', { name: 'Open menu' });
    await toggle.click();
    const menu = page.getByRole('dialog', { name: 'Menu' });
    await expect(menu).toBeVisible();
    await expect(menu.locator(':focus')).toHaveCount(1);
    await page.keyboard.press('Escape');
    await expect(menu).toBeHidden();
    await expect(page.getByRole('button', { name: 'Open menu' })).toBeFocused();
  });

  test('menu links navigate and the menu closes', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page
      .getByRole('dialog', { name: 'Menu' })
      .getByRole('link', { name: /Products/ })
      .click();
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.getByRole('dialog', { name: 'Menu' })).toBeHidden();
  });
});
