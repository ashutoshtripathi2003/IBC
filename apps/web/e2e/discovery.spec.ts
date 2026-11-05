import { expect, test } from '@playwright/test';

test('hero search suggests as you type and opens the chosen result', async ({ page }) => {
  await page.goto('/');
  const box = page.locator('#hero-title').locator('..').getByRole('combobox');
  await box.fill('alum');
  const listbox = page.getByRole('listbox', { name: 'Suggestions' });
  await expect(listbox).toBeVisible();
  await expect(listbox.getByRole('option').first()).toBeVisible();
  await box.press('ArrowDown');
  await expect(box).toHaveAttribute('aria-activedescendant', /.+/);
  await box.press('Escape');
  await expect(listbox).toBeHidden();
  await box.fill('process pump');
  await box.press('Enter');
  await expect(page).toHaveURL(/\/search\?q=process(\+|%20)pump/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Search IBC');
  await expect(page.getByRole('link', { name: 'API 610 OH2 process pump' })).toBeVisible();
  await expect(page.getByRole('listbox', { name: 'Suggestions' })).toBeHidden();
});

test('search scopes, filters and the empty state', async ({ page }) => {
  await page.goto('/search?q=pump');
  const summary = page.locator('p[aria-live="polite"]');
  await expect(summary).toContainText(/\d+ results? for/);
  await page
    .getByRole('navigation', { name: 'Result types' })
    .getByRole('link', { name: /Products/ })
    .click();
  await expect(page).toHaveURL(/scope=product/);
  await expect(page.getByText(/^Product · /).first()).toBeVisible();
  await expect(page.getByText(/^Opportunity · /)).toHaveCount(0);

  await page.goto('/search?q=zzzz-nothing');
  await expect(page.getByRole('heading', { name: /No results/ })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Browse industries' })).toBeVisible();
});

test('product marketplace filters narrow results and can reach zero', async ({ page }) => {
  await page.goto('/products');
  const count = page.locator('p[aria-live="polite"]');
  await expect(count).toHaveText(/^15 products$/);
  const mobileFilters = page.locator('details summary', { hasText: 'Filters' });
  if (await mobileFilters.isVisible()) await mobileFilters.click();
  const price = page.getByLabel('Price').filter({ visible: true });
  await price.selectOption('request');
  await expect(count).not.toHaveText(/^15 products$/);
  await expect(page).toHaveURL(/price=request/);
  const industry = page.getByLabel('Industry').filter({ visible: true });
  await industry.selectOption('textiles');
  await expect(page).toHaveURL(/industry=textiles/);
  // A filter that removes everything shows a way back.
  const text = await count.textContent();
  if (text?.startsWith('0')) {
    await expect(page.getByRole('heading', { name: /No products match/ })).toBeVisible();
  }
});

test('product detail shows specifications, price and supplier', async ({ page }) => {
  await page.goto('/products/ev-motor-housing-a356');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'EV motor housing, A356 aluminium',
  );
  await expect(page.getByRole('heading', { name: 'Specifications' })).toBeVisible();
  const side = page.getByRole('complementary', { name: 'Pricing and supplier' });
  await expect(side.getByText('₹3,450.00')).toBeVisible();
  await expect(side.getByText('500 pieces')).toBeVisible();
  await side.getByRole('link', { name: 'View company' }).click();
  await expect(page).toHaveURL(/\/businesses\/deccan-precision-castings$/);
  await expect(page.getByText(/Not yet verified/)).toBeVisible();
});

test('request quotation explains what happens next', async ({ page }) => {
  await page.goto('/products/ev-motor-housing-a356');
  await page
    .getByRole('complementary', { name: 'Pricing and supplier' })
    .getByRole('link', { name: 'Request quotation' })
    .click();
  await expect(page).toHaveURL(/\/join\?intent=rfq/);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
});
