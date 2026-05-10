import { test, expect } from '@playwright/test';

// ── Nav routes return 200 ─────────────────────────────────
const NAV_ROUTES = ['/', '/quiz', '/play'];

for (const route of NAV_ROUTES) {
  test(`GET ${route} returns 200`, async ({ request }) => {
    const res = await request.get(route);
    expect(res.status()).toBe(200);
  });
}

// ── Hero H1 present ───────────────────────────────────────
test('home hero H1 is visible', async ({ page }) => {
  await page.goto('/');
  const h1 = page.locator('h1').first();
  await expect(h1).toBeVisible({ timeout: 10_000 });
  const text = await h1.innerText();
  expect(text.length).toBeGreaterThan(0);
});

// ── Primary CTA visible ───────────────────────────────────
test('primary CTA button is visible', async ({ page }) => {
  await page.goto('/');
  const cta = page.locator('a, button').filter({ hasText: /play|start|try/i }).first();
  await expect(cta).toBeVisible({ timeout: 10_000 });
});

// ── AI endpoint responds non-empty within 10s ─────────────
test('POST /api/quiz returns non-empty JSON', async ({ request }) => {
  const res = await request.post('/api/quiz', {
    data: {
      subject: 'general',
      difficulty: 'easy',
      playerCount: 1,
      ageGroups: ['adults'],
    },
    timeout: 10_000,
  });
  expect(res.status()).toBe(200);
  const body = await res.text();
  expect(body.length).toBeGreaterThan(10);
});

// ── Mobile: no horizontal overflow ───────────────────────
test('mobile viewport has no horizontal overflow', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  const page = await ctx.newPage();
  await page.goto('/');
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth;
  });
  expect(overflow).toBe(false);
  await ctx.close();
});
