import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

const PASSWORD = 'correct horse battery staple';

function uniqueEmail(testInfo: { project: { name: string }; workerIndex: number }) {
  return `e2e-${testInfo.project.name}-${testInfo.workerIndex}-${Date.now()}@example.com`;
}

async function signUp(page: Page, name: string, email: string) {
  await page.goto('/join');
  const form = page.getByRole('form', { name: 'Create your account' });
  await form.getByLabel('Full name').fill(name);
  await form.getByLabel('Work email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await form.getByLabel('Country (optional)').selectOption('IN');
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page).toHaveURL(/\/app\?welcome=1$/);
}

test('sign up, use the app, change details, log out and log back in', async ({ page }, info) => {
  const email = uniqueEmail(info);
  await signUp(page, 'Asha Patil', email);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome, Asha');
  await expect(page.getByText('Your account has been created.')).toBeVisible();
  await expect(page.getByText(/Confirm your email address: we sent a link/)).toBeVisible();

  // The session lives in an httpOnly cookie that page scripts cannot read.
  const cookies = await page.context().cookies();
  const session = cookies.find((c) => c.name.endsWith('ibc_session'));
  expect(session?.httpOnly).toBe(true);
  expect(session?.sameSite).toBe('Lax');
  expect(await page.evaluate(() => document.cookie)).not.toContain('ibc_st_');

  // Every section of the app is reachable.
  await page
    .getByRole('navigation', { name: 'Application' })
    .getByRole('link', { name: 'RFQs' })
    .click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('RFQs');

  await page.goto('/app/settings');
  const name = page.getByLabel('Full name');
  await expect(name).toHaveValue('Asha Patil');
  await name.fill('Asha R. Patil');
  await page.getByRole('button', { name: 'Save details' }).click();
  await expect(page.getByText('Your details have been saved.')).toBeVisible();
  await expect(page.getByText('This device')).toBeVisible();

  await page.getByRole('button', { name: 'Log out' }).first().click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/app');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp$/);

  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Welcome back, Asha');
});

test('wrong passwords and duplicate emails are explained', async ({ page }, info) => {
  const email = uniqueEmail(info);
  await signUp(page, 'Ravi Shah', email);
  await page.context().clearCookies();

  await page.goto('/join');
  const form = page.getByRole('form', { name: 'Create your account' });
  await form.getByLabel('Full name').fill('Someone Else');
  await form.getByLabel('Work email').fill(email);
  await form.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toContainText('already exists');

  await page.goto('/login');
  await page.getByLabel('Email').fill(email);
  await page.getByLabel('Password', { exact: true }).fill('not the right password');
  await page.getByRole('button', { name: 'Log in' }).click();
  await expect(page.getByRole('main').getByRole('alert')).toHaveText(
    'The email or password is not correct.',
  );
});

test('sign-up checks the form before sending it', async ({ page }) => {
  await page.goto('/join');
  const form = page.getByRole('form', { name: 'Create your account' });
  await form.getByLabel('Password', { exact: true }).fill('short');
  await form.getByRole('button', { name: 'Create account' }).click();
  await expect(form.getByText('Enter your name.')).toBeVisible();
  await expect(form.getByText('Enter a valid email address.')).toBeVisible();
  await expect(form.getByText('Use at least 12 characters.')).toBeVisible();
  await expect(form.getByLabel('Full name')).toHaveAttribute('aria-invalid', 'true');
});

test('the account endpoints refuse cross-site requests', async ({ request }) => {
  const response = await request.post('/api/auth/login', {
    headers: { origin: 'https://evil.example', 'content-type': 'application/json' },
    data: { email: 'a@example.com', password: PASSWORD },
  });
  expect(response.status()).toBe(403);
  const noOrigin = await request.post('/api/auth/logout');
  expect(noOrigin.status()).toBe(403);
  expect((await request.get('/api/me')).status()).toBe(401);
});

test('signed-out visitors are sent to log in, and back afterwards only within the site', async ({
  page,
}) => {
  await page.goto('/app/settings');
  await expect(page).toHaveURL(/\/login\?next=%2Fapp%2Fsettings$/);
  await page.goto('/login?next=https://evil.example');
  await expect(page.getByRole('form', { name: 'Log in' })).toBeVisible();
});

test('password reset answers the same for any email', async ({ page }) => {
  await page.goto('/forgot-password');
  await page.getByLabel('Email').fill('nobody-here@example.com');
  await page.getByRole('button', { name: 'Send reset link' }).click();
  await expect(page.getByText(/If an account exists for nobody-here@example.com/)).toBeVisible();
  await page.goto('/reset-password');
  await expect(page.getByText(/This reset link is incomplete/)).toBeVisible();
  await page.goto('/verify-email#token=ibc_ev_notarealtoken1234567890');
  await expect(page.getByText(/invalid or has expired/)).toBeVisible();
  // The one-time token is removed from the address bar once read.
  expect(page.url()).not.toContain('token=');
});

test('signed-in pages are accessible and fit the screen', async ({ page }, info) => {
  await signUp(page, 'Meera Joshi', uniqueEmail(info));
  for (const path of ['/app', '/app/settings', '/app/profile', '/app/messages']) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, path).toBeLessThanOrEqual(0);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    const serious = results.violations.filter(
      (v) => v.impact === 'serious' || v.impact === 'critical',
    );
    expect(
      serious.map((v) => `${path} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  }
});
