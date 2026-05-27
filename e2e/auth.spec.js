const { expect, test } = require('@playwright/test');

test('login sends email credentials from the mobile web shell', async ({ page }) => {
  let loginPayload;

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.endsWith('/api/auth/login')) {
      loginPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'access-token', refreshToken: 'refresh-token' }),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('player@example.com');
  await page.getByPlaceholder('Password', { exact: true }).fill('short');
  await page.getByText('Login', { exact: true }).click();

  await expect.poll(() => loginPayload?.email).toBe('player@example.com');
});

test('development register flow accepts a short password on the client', async ({ page }) => {
  let registerPayload;

  await page.route('**/api/**', async (route) => {
    const url = route.request().url();

    if (url.endsWith('/api/auth/register')) {
      registerPayload = route.request().postDataJSON();
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/register');
  await page.getByPlaceholder('Username').fill('player1');
  await page.getByPlaceholder('Email').fill('player@example.com');
  await page.getByPlaceholder('Password', { exact: true }).fill('x');
  await page.getByPlaceholder('Confirm Password').fill('x');
  await page.getByText('Create Account').click();

  await expect.poll(() => registerPayload?.password).toBe('x');
  await expect.poll(() => registerPayload?.verificationClient).toBe(1);
});

test('login blocks invalid email before calling the API', async ({ page }) => {
  let apiCalled = false;

  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/valid email/i);
    await dialog.dismiss();
  });

  await page.route('**/api/**', async (route) => {
    apiCalled = true;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('not-an-email');
  await page.getByPlaceholder('Password', { exact: true }).fill('short');
  await page.getByText('Login', { exact: true }).click();

  await page.waitForTimeout(250);
  expect(apiCalled).toBe(false);
});

test('register blocks mismatched passwords before calling the API', async ({ page }) => {
  let apiCalled = false;

  page.on('dialog', async (dialog) => {
    expect(dialog.message()).toMatch(/passwords do not match/i);
    await dialog.dismiss();
  });

  await page.route('**/api/**', async (route) => {
    apiCalled = true;
    await route.fulfill({ status: 500, contentType: 'application/json', body: '{}' });
  });

  await page.goto('/register');
  await page.getByPlaceholder('Username').fill('player1');
  await page.getByPlaceholder('Email').fill('player@example.com');
  await page.getByPlaceholder('Password', { exact: true }).fill('short');
  await page.getByPlaceholder('Confirm Password').fill('different');
  await page.getByText('Create Account').click();

  await page.waitForTimeout(250);
  expect(apiCalled).toBe(false);
});

test('register link and login link navigate between auth screens', async ({ page }) => {
  await page.goto('/login');
  await page.getByText('Create Account').click();
  await expect(page).toHaveURL(/\/register/);

  await page.getByText('Already have an account? Login').click();
  await expect(page).toHaveURL(/\/login/);
});
