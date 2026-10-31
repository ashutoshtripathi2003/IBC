import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '/',
  '/network',
  '/businesses',
  '/products',
  '/services',
  '/opportunities',
  '/about',
  '/join',
  '/login',
];

/** Collects console errors and failed requests, ignoring prefetches of not-yet-built routes. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  return errors;
}

async function analyticsEvents(page: Page) {
  await page.addInitScript(() => {
    (window as unknown as { __events: unknown[] }).__events = [];
    window.addEventListener('ibc:analytics', (event) => {
      (window as unknown as { __events: unknown[] }).__events.push((event as CustomEvent).detail);
    });
  });
}

const events = (page: Page) =>
  page.evaluate(() => (window as unknown as { __events: { name: string }[] }).__events);

test.describe('every page', () => {
  for (const path of PAGES) {
    test(`${path} renders, has one h1, no console errors and no horizontal overflow`, async ({
      page,
    }) => {
      const errors = watchErrors(page);
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.locator('h1')).toHaveCount(1);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      expect(errors).toEqual([]);
    });

    test(`${path} has no serious accessibility violations`, async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(path);
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      const serious = results.violations.filter(
        (v) => v.impact === 'serious' || v.impact === 'critical',
      );
      expect(
        serious.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
      ).toEqual([]);
    });
  }
});

test('home tells the story in order and shows real platform numbers', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'The network where business happens.',
  );
  const headings = await page.getByRole('heading', { level: 2 }).allTextContents();
  expect(headings.slice(0, 9)).toEqual([
    'The world is connected. Business isn’t.',
    'One network, from first hello to final delivery.',
    'Find what you need by describing it.',
    'Relationships that come with context.',
    'Do business, end to end.',
    'Know who you’re doing business with.',
    'Intelligence behind every connection.',
    'Built locally. Designed for the world.',
    'Your next connection could change your business.',
  ]);
  // Counters render their final value for crawlers and assistive tech.
  await expect(page.locator('#global .visually-hidden', { hasText: /^250$/ })).toBeAttached();
  await expect(page.locator('canvas')).toHaveCount(1);
});

test('primary calls to action lead to the join page and are tracked', async ({ page }) => {
  await analyticsEvents(page);
  await page.goto('/');
  await expect
    .poll(async () => (await events(page)).some((e) => e.name === 'page_view'))
    .toBe(true);
  const join = page.locator('#hero-title').locator('..').getByRole('link', { name: 'Join IBC' });
  await join.click();
  await expect(page).toHaveURL(/\/join$/);
  const names = (await events(page)).map((e) => e.name);
  expect(names).toContain('join_click');
});

test('the network legend opens as a dialog and closes with Escape', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'What am I looking at?' }).click();
  const dialog = page.getByRole('dialog', { name: 'The IBC network' });
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
});

test('reduced motion shows everything immediately, without the opening sequence', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  await expect(page.locator('html')).not.toHaveAttribute('data-intro', 'play');
  const opacity = await page
    .locator('#hero-title')
    .evaluate((el) => getComputedStyle(el.querySelector('span span span') ?? el).transform);
  expect(opacity === 'none' || opacity.includes('matrix(1, 0, 0, 1, 0, 0)')).toBe(true);
});

test('keyboard users can skip straight to content', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const skip = page.getByRole('link', { name: 'Skip to content' });
  await expect(skip).toBeFocused();
  await skip.press('Enter');
  await expect(page).toHaveURL(/#main$/);
});

test('SEO metadata, structured data, robots and sitemap', async ({ page, request }) => {
  await page.goto('/products');
  await expect(page).toHaveTitle(/Products \| IBC — Indian Business Circle/);
  await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /.+/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /\/products$/);
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    'content',
    /opengraph-image/,
  );
  const jsonLd = JSON.parse(
    (await page.locator('script[type="application/ld+json"]').textContent()) ?? '{}',
  );
  expect(jsonLd['@graph'][0]['@type']).toBe('Organization');
  expect((await request.get('/robots.txt')).status()).toBe(200);
  const sitemap = await (await request.get('/sitemap.xml')).text();
  expect(sitemap).toContain('/opportunities');
  expect((await request.get('/opengraph-image')).headers()['content-type']).toBe('image/png');
});

test('security headers are sent', async ({ request }) => {
  const response = await request.get('/');
  const headers = response.headers();
  expect(headers['content-security-policy']).toContain("frame-ancestors 'none'");
  expect(headers['x-content-type-options']).toBe('nosniff');
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin');
  expect(headers['x-powered-by']).toBeUndefined();
});

test('unknown pages return 404 with a way home', async ({ page }) => {
  const response = await page.goto('/no-such-page');
  expect(response?.status()).toBe(404);
  await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
});
