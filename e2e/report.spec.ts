import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'

import { requestHosts } from './helpers'

const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
const API_BASE = process.env.E2E_API_BASE ?? 'http://localhost:8000/v1'

const allowedHosts = [
  new URL(process.env.E2E_BASE_URL ?? 'http://localhost:3002').host,
  new URL(API_URL).host,
]

test('report a link anonymously, with no cookie and no third party', async ({ page, context }) => {
  const requests: Request[] = []
  page.on('request', (request) => requests.push(request))

  await page.goto('/report?slug=e2e-report')

  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
  await expect(page.getByRole('heading', { name: 'Signaler un lien' })).toBeVisible()
  await expect(page.locator('#report-slug')).toHaveValue('e2e-report')

  await page.locator('#report-category').selectOption('malware')
  await page.getByLabel('Description (facultatif)').fill('Lien reçu par SMS, demande de connexion.')
  await page.getByRole('button', { name: 'Signaler ce lien' }).click()

  await expect(page.getByRole('heading', { name: 'Signalement reçu' })).toBeVisible()
  await expect(page.locator('output')).toContainText('48 heures')
  await expect(page.locator('output')).toContainText(/[0-9A-HJKMNP-TV-Z]{26}/)

  expect(await context.cookies()).toEqual([])

  const hosts = requestHosts(requests)
  expect(hosts.filter((host) => !allowedHosts.includes(host))).toEqual([])
})

test('the abuse page is readable and holds at 360 px', async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 })
  await page.goto('/abuse')

  await expect(page.getByRole('heading', { name: 'Abus et signalement' })).toBeVisible()
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Signaler un lien' }),
  ).toHaveAttribute('href', '/report')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - window.innerWidth,
  )
  expect(overflow).toBeLessThanOrEqual(1)
})

test('the report form keeps the entered text when the API is unreachable', async ({ page }) => {
  await page.goto('/report')

  await page.route(`**${new URL(API_BASE).pathname}/report`, (route) =>
    route.abort('failed'),
  )

  await page.locator('#report-slug').fill('offline-slug')
  await page.getByLabel('Description (facultatif)').fill('Do not lose this text')
  await page.getByRole('button', { name: 'Signaler ce lien' }).click()

  await expect(page.getByRole('alert')).toContainText('Impossible de joindre le service')
  await expect(page.locator('#report-slug')).toHaveValue('offline-slug')
  await expect(page.getByLabel('Description (facultatif)')).toHaveValue('Do not lose this text')
})
