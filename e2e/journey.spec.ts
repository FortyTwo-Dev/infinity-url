import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import type { Request } from '@playwright/test'

import {
  createLink,
  requestHosts,
  signIn,
  signUpAndVerify,
  uniqueEmail,
} from './helpers'

test('signup, verification, creation, click and statistics', async ({ page }) => {
  test.slow()

  const email = uniqueEmail('journey')
  const requests: Request[] = []
  page.on('request', (request) => requests.push(request))

  await signUpAndVerify(page, email)
  await signIn(page, email)

  const { detailUrl, slug } = await createLink(page, 'https://example.com/smoke')

  await page.route('https://example.com/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: 'destination',
    }),
  )
  await page.goto(`http://iurl.fr:8000/${slug}`)
  await expect(page).toHaveURL('https://example.com/smoke')

  await page.goto(detailUrl)
  await expect(page.getByRole('heading', { name: 'Statistiques' })).toBeVisible()
  await expect(page.locator('.stats__value').first()).toContainText('1')
  await expect(page.locator('.qr__canvas')).toBeVisible()

  const csvDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Exporter en CSV' }).click()
  const csv = await csvDownload
  const csvPath = await csv.path()

  expect(csvPath).not.toBeNull()

  const csvBody = fs.readFileSync(csvPath as string, 'utf8')
  expect(csvBody).toContain('date,clicks,uniques')
  expect(csvBody).toMatch(/,1,1/)

  const svgDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger en SVG' }).click()
  const svg = await svgDownload
  expect(await svg.path()).not.toBeNull()

  const pngDownload = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Télécharger en PNG' }).click()
  const png = await pngDownload
  expect(await png.path()).not.toBeNull()

  await page.goto('/links')
  const firstRow = page.locator('table.link-table tbody tr').first()
  await expect(firstRow).toContainText(slug)
  await expect(firstRow.locator('td').nth(2)).toHaveText('1')

  const storage = await page.evaluate(() => ({
    local: Object.keys(localStorage),
    session: Object.keys(sessionStorage),
    cookies: document.cookie,
  }))

  expect(storage.local.filter((key) => key.toLowerCase().includes('token'))).toEqual([])
  expect(storage.cookies).toBe('')
  expect(storage.session.filter((key) => key.toLowerCase().includes('token'))).toEqual([])

  const hosts = requestHosts(requests).filter(
    (host) => host !== 'example.com' && host !== '',
  )
  const dashboardHost = new URL(
    process.env.E2E_BASE_URL ?? 'http://localhost:3002',
  ).host

  expect(hosts.sort()).toEqual(
    ['iurl.fr:8000', dashboardHost, 'localhost:8000'].sort(),
  )

  await page.setViewportSize({ width: 360, height: 800 })

  for (const path of ['/links', '/links/new', new URL(detailUrl).pathname]) {
    await page.goto(path)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > 360,
    )

    expect(overflow, path).toBe(false)
  }
})
