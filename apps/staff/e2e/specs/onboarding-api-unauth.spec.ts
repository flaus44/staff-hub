import { expect, test } from '@playwright/test'

test('documents download is unauthorized without session', async ({ request }) => {
  const response = await request.get('/api/portal/onboarding/documents/download?documentId=1')
  expect([401, 403, 404]).toContain(response.status())
})
