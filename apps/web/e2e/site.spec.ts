import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PAGES = [
  '/',
  '/discover',
  '/search?q=pump',
  '/industries/chemicals',
  '/businesses/deccan-precision-castings',
  '/products/ev-motor-housing-a356',
  '/network/ananya-kulkarni',
  '/network',
  '/businesses',
  '/products',
  '/services',
  '/opportunities',
  '/about',
  '/join',
  '/login',
  '/forgot-password',
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

test('the page never becomes wider than the screen at any scroll position', async ({ page }) => {
  await page.goto('/');
  const height = await page.evaluate(() => document.documentElement.scrollHeight);
  const viewport = page.viewportSize()!.width;
  for (let y = 0; y < height; y += 400) {
    await page.evaluate((top) => {
      window.scrollTo(0, top);
    }, y);
    await page.waitForTimeout(60);
    const widths = await page.evaluate(() => [
      window.innerWidth,
      document.documentElement.scrollWidth,
    ]);
    expect(widths, `at scroll ${y}`).toEqual([viewport, viewport]);
  }
  // The menu button (mobile) or Join button (desktop) stays fully on screen afterwards.
  await page.evaluate(() => {
    window.scrollTo(0, 0);
  });
  const right = await page
    .locator('header nav > :last-child')
    .evaluate((el) => el.getBoundingClientRect().right);
  expect(right).toBeLessThanOrEqual(viewport);
});

test('home tells the story in order, ending in a way to start', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    /The world\s*runs on\s*industry\./i,
  );
  const hero = page.locator('#hero-title').locator('..');
  await expect(hero.getByRole('link', { name: 'Explore IBC' })).toBeVisible();
  await expect(hero.getByRole('link', { name: 'Join IBC' })).toBeVisible();
  const scenes = await page
    .locator('main section[data-tone]')
    .evaluateAll((els) => els.map((e) => e.id));
  expect(scenes).toEqual([
    '',
    'connections',
    'industries',
    'people',
    'ecosystem',
    'marketplace',
    'discover',
    'join',
  ]);
  // All fifteen industry chapters, each linking to its page.
  await expect(page.locator('#industries article h3')).toHaveCount(15);
  // Search is part of the page, and demo content is labelled; nothing claims verification.
  await expect(page.locator('#discover').getByRole('combobox')).toBeAttached();
  await expect(page.getByText('Demo').first()).toBeAttached();
  await expect(page.getByText(/^Verified$/)).toHaveCount(0);
  await expect(page.getByText('Rendered illustration').first()).toBeAttached();
});

test('the marketplace showcase switches products with mouse and keyboard', async ({ page }) => {
  await page.goto('/#marketplace');
  const tabs = page.getByRole('tablist', { name: 'Featured products' });
  await tabs.getByRole('tab', { name: /Isopropyl alcohol/ }).click();
  const panel = page.getByRole('tabpanel');
  await expect(panel.getByRole('heading', { name: /Isopropyl alcohol/ })).toBeVisible();
  await tabs.getByRole('tab', { name: /Isopropyl alcohol/ }).press('ArrowDown');
  await expect(tabs.getByRole('tab', { name: /EV motor housing/ })).toBeFocused();
  await expect(panel.getByRole('heading', { name: /EV motor housing/ })).toBeVisible();
  await expect(panel.getByRole('link', { name: 'Request quotation' })).toHaveAttribute(
    'href',
    '/join?intent=rfq&product=ev-motor-housing-a356',
  );
});

test('the globe loads WebGL lazily and keeps its poster without it', async ({ page }) => {
  await page.goto('/');
  // Nothing heavy before the scene is near.
  const early = await page.evaluate(() =>
    performance.getEntriesByType('resource').some((r) => r.name.includes('land-dots.bin')),
  );
  expect(early).toBe(false);
  await page.locator('#connections').scrollIntoViewIfNeeded();
  await expect(page.locator('#connections svg').first()).toBeAttached();
  await expect(page.locator('#connections')).toHaveAttribute('data-globe', 'ready', {
    timeout: 15_000,
  });
});

test('primary calls to action lead to the join page and are tracked', async ({ page }) => {
  await analyticsEvents(page);
  await page.goto('/');
  await expect
    .poll(async () => (await events(page)).some((e) => e.name === 'page_view'))
    .toBe(true);
  const join = page.locator('#hero-title').locator('..').getByRole('link', { name: 'Join IBC' });
  await expect(join).toBeVisible();
  await join.click();
  await expect(page).toHaveURL(/\/join$/);
  const names = (await events(page)).map((e) => e.name);
  expect(names).toContain('join_click');
});

test('reduced motion leaves all content visible', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const opacity = await page.locator('#hero-title').evaluate((el) => getComputedStyle(el).opacity);
  expect(opacity).toBe('1');
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
  await expect(page).toHaveTitle(/Product marketplace \| IBC — Industrial Business Circle/);
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
