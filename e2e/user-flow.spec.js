const { expect, test } = require('@playwright/test');

const profile = {
  id: 'user-1',
  username: 'player1',
  role: 3,
  currency: 777,
  profileImagePath: null,
};

const sword = {
  id: 'weapon-1',
  name: 'Bronze Sword',
  weaponType: 1,
  category: 0,
  cut: 6,
  blunt: 2,
  elements: [],
};

const axe = {
  id: 'weapon-2',
  name: 'Iron Axe',
  weaponType: 1,
  category: 0,
  cut: 8,
  blunt: 4,
  elements: [],
};

const runState = {
  id: 'run-1',
  status: 0,
  battleIndex: 1,
  playerCurrentHp: 100,
  playerMaxHp: 100,
};

const battleState = {
  battleId: 'battle-1',
  playerCurrentHp: 100,
  playerMaxHp: 100,
  playerPosition: 1,
  leftHandItemId: 'weapon-1',
  rightHandItemId: null,
  enemies: [{ id: 'enemy-1', name: 'Raider', position: 2, currentHp: 35, maxHp: 35 }],
};

async function mockApi(page) {
  const calls = [];
  let activeRun = null;
  let currentBattle = null;

  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname.replace('/api', '');
    calls.push(`${request.method()} ${path}`);

    if (path === '/auth/login') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'access-token', refreshToken: 'refresh-token' }),
      });
      return;
    }

    if (path === '/auth/logout') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    if (path === '/mobile/me') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(profile),
      });
      return;
    }

    if (path === '/mobile/inventory') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([sword, axe]),
      });
      return;
    }

    if (path === '/mobile/inventory/run') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([]),
      });
      return;
    }

    if (path === '/mobile/equipment') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ weapon1: sword }),
      });
      return;
    }

    if (path === '/mobile/daily') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ...sword, id: 'daily-1', name: 'Daily Axe' }),
      });
      return;
    }

    if (path === '/mobile/equip/weapon/1/weapon-1') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    if (path === '/mobile/equip/weapon/1/weapon-2') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    if (path === '/run/start') {
      activeRun = { ...runState };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeRun),
      });
      return;
    }

    if (path === '/run/active') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(activeRun),
      });
      return;
    }

    if (path === '/run/go-further') {
      activeRun = { ...runState, status: 1 };
      currentBattle = { ...battleState };
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentBattle),
      });
      return;
    }

    if (path === '/run/battle/current') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(currentBattle),
      });
      return;
    }

    if (path === '/run/turn') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          damageDealt: 24,
          enemyDamage: 3,
          log: ['You hit Raider.'],
          rewardItems: [],
          message: 'Turn resolved.',
        }),
      });
      return;
    }

    if (path === '/run/end') {
      activeRun = null;
      currentBattle = null;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    if (path === '/auth/reset-password') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify('ok'),
      });
      return;
    }

    await route.fulfill({ status: 200, contentType: 'application/json', body: '{}' });
  });

  return calls;
}

async function login(page) {
  await page.goto('/login');
  await page.getByPlaceholder('Email').fill('player@example.com');
  await page.getByPlaceholder('Password', { exact: true }).fill('short');
  await page.getByText('Login', { exact: true }).click();
  await expect(page.getByText(/welcome back, player1/i)).toBeVisible();
}

test('main mobile user flow covers dashboard, equipment, daily reward, profile and logout', async ({
  page,
}) => {
  const calls = await mockApi(page);
  page.on('dialog', async (dialog) => dialog.accept());

  await login(page);

  await expect(page.getByText('777')).toBeVisible();

  await page.getByRole('tab', { name: /Equipment/ }).click();
  await expect(page.getByText('INVENTORY', { exact: true })).toBeVisible();
  await page.getByText('Inventory', { exact: true }).click();
  await expect(page.getByText(/C 6\.0 \/ B 2\.0/)).toBeVisible();

  await page.getByRole('tab', { name: /Rewards/ }).click();
  await expect(page).toHaveURL(/\/rewards/);
  await page.getByText('Claim Daily Reward').click();
  await expect.poll(() => calls.includes('POST /mobile/daily')).toBe(true);
  await expect(page.getByText('Daily Axe')).toBeVisible();

  await page.getByRole('tab', { name: /Profile/ }).click();
  await expect(page.getByText('player1').first()).toBeVisible();
  await expect(page.getByText('Currency: 777')).toBeVisible();
  await page.getByText('Logout').click();
  await expect(page).toHaveURL(/\/login/);
});

test('mobile equipment flow opens inventory and equips a weapon', async ({ page }) => {
  const calls = await mockApi(page);
  page.on('dialog', async (dialog) => dialog.accept());

  await login(page);
  await page.getByRole('tab', { name: /Equipment/ }).click();
  await page.getByText('Equipment', { exact: true }).nth(3).click();
  await page.getByText('WEAPON', { exact: true }).click();
  await expect(page.getByText(/C 8\.0 \/ B 4\.0/)).toBeVisible();
  await page.getByText('S1').click();

  await expect.poll(() => calls.includes('POST /mobile/equip/weapon/1/weapon-2')).toBe(true);
});

test('mobile run flow starts a run, goes further and attacks enemy', async ({ page }) => {
  const calls = await mockApi(page);
  page.on('dialog', async (dialog) => dialog.accept());

  await login(page);
  await page.getByRole('tab', { name: /Run/ }).click();
  await page.getByText('Start Run').click();
  await expect.poll(() => calls.includes('POST /run/start')).toBe(true);
  await expect(page.getByText('Run Active')).toBeVisible();

  await page.getByText('Go Further').click();
  await expect.poll(() => calls.includes('POST /run/go-further')).toBe(true);
  await expect(page.getByText('Raider')).toBeVisible();

  await page.getByText('Attack').click();
  await expect.poll(() => calls.includes('POST /run/turn')).toBe(true);
  await expect(page.getByText(/You dealt 24 damage/i)).toBeVisible();
});

test('mobile profile opens reset password and submits change', async ({ page }) => {
  const calls = await mockApi(page);

  await login(page);
  await page.getByRole('tab', { name: /Profile/ }).click();
  await page.getByText('Reset Password').click();
  await page.getByPlaceholder('Current password').fill('OldPassword1');
  await page.getByPlaceholder('New password', { exact: true }).fill('NewPassword1');
  await page.getByPlaceholder('Confirm new password').fill('NewPassword1');
  await page.getByText('Change Password').nth(1).click();

  await expect.poll(() => calls.includes('POST /auth/reset-password')).toBe(true);
});

test('mobile protected tab redirects unauthenticated users to login', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText('Companion App').first()).toBeVisible();
});
