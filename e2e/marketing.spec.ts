import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'

import { requestHosts } from './helpers'

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3000'
const appHost = new URL(baseURL).host

test('the home page is a public presentation, not a session redirect', async ({ page, context }) => {
  const requests: Request[] = []
  page.on('request', (request) => requests.push(request))

  const response = await page.goto('/')

  expect(response?.status()).toBe(200)
  expect(new URL(page.url()).pathname).toBe('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Des liens courts, sans profil de visiteurs.')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
  await expect(page.getByRole('link', { name: 'Créer un compte' })).toHaveAttribute('href', '/signup')
  await expect(page.getByRole('link', { name: 'Se connecter' })).toHaveAttribute('href', '/login')

  expect(await context.cookies()).toEqual([])
  expect(requestHosts(requests).filter((host) => host !== appHost)).toEqual([])
})

test('the English home page is public and translated', async ({ page, context }) => {
  const response = await page.goto('/en')

  expect(response?.status()).toBe(200)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Short links, without visitor profiles.')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
  await expect(page.getByRole('link', { name: 'Create an account' })).toHaveAttribute('href', '/en/signup')

  expect(await context.cookies()).toEqual([])
})

test('the home page holds at 360 px without overflow', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )

  expect(overflow).toBeLessThanOrEqual(1)
})

test('the home page links to reporting, abuse and the legal pages', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('link', { name: 'Signaler un lien' }).first()).toHaveAttribute('href', '/report')
  await expect(page.getByRole('link', { name: /Procédure d.abus/ })).toHaveAttribute('href', '/abuse')
  await expect(page.getByRole('link', { name: 'Mentions légales' }).first()).toHaveAttribute('href', '/legal/notice')
  await expect(page.getByRole('link', { name: 'Confidentialité' }).first()).toHaveAttribute('href', '/legal/privacy')
})
