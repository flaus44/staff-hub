import { expect, test } from '@playwright/test'

test('health endpoint returns ok', async ({ request }) => {
  const response = await request.get('/api/health')
  expect(response.ok()).toBeTruthy()
})

test('onboarding setup redirects to login when unauthenticated', async ({ page }) => {
  await page.goto('/onboarding/setup')
  await expect(page).toHaveURL(/\/login/)
})
