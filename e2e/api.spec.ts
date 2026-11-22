import { expect, test } from '@playwright/test'

import {
  API_URL,
  PASSWORD,
  uniqueEmail,
  verificationToken,
} from './helpers'

test('creates a link with a Bearer and exposes the problem shape', async ({ request }) => {
  const email = uniqueEmail('api')

  const registered = await request.post(`${API_URL}/v1/auth/register`, {
    data: { email, password: PASSWORD },
  })

  expect(registered.status()).toBe(201)

  const token = await verificationToken(email)
  const verified = await request.post(`${API_URL}/v1/auth/verify-email`, {
    data: { token },
  })

  expect(verified.status()).toBe(200)

  const login = await request.post(`${API_URL}/v1/auth/login`, {
    data: { email, password: PASSWORD },
  })

  expect(login.status()).toBe(200)

  const session = (await login.json()) as { access_token: string }
  const headers = { Authorization: `Bearer ${session.access_token}` }

  const created = await request.post(`${API_URL}/v1/links`, {
    headers,
    data: { destination: 'https://example.com/api' },
  })

  expect(created.status()).toBe(201)
  expect(created.headers()['ratelimit-limit']).toBeTruthy()
  expect(created.headers()['ratelimit-remaining']).toBeTruthy()

  const invalid = await request.post(`${API_URL}/v1/links`, {
    headers,
    data: { destination: 'javascript:alert(1)' },
  })

  expect(invalid.status()).toBe(422)
  expect(invalid.headers()['content-type']).toContain('application/problem+json')

  const problem = (await invalid.json()) as { code: string; errors?: Record<string, string[]> }

  expect(problem.code).toBe('validation_failed')
  expect(problem.errors?.destination).toBeTruthy()
})
