import { expect, test } from '@playwright/test'
import type { Request } from '@playwright/test'

import { requestHosts } from './helpers'

const documents = [
  { slug: 'notice', title: 'Mentions légales' },
  { slug: 'terms', title: 'Conditions générales d’utilisation' },
  { slug: 'aup', title: 'Politique d’usage acceptable' },
  { slug: 'privacy', title: 'Politique de confidentialité' },
  { slug: 'subcontractors', title: 'Sous-traitants' },
  { slug: 'client-clause', title: 'Clause client — mesure d’audience des liens' },
]

const baseURL = process.env.E2E_BASE_URL ?? 'http://localhost:3002'
const appHost = new URL(baseURL).host

for (const document of documents) {
  test(`renders /legal/${document.slug} on the server, with no cookie and no third party`, async ({ page, context }) => {
    const requests: Request[] = []
    page.on('request', (request) => requests.push(request))

    const response = await page.goto(`/legal/${document.slug}`)

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(document.title)
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
    expect(await page.locator('h2').count()).toBeGreaterThan(0)

    expect(await context.cookies()).toEqual([])
    expect(requestHosts(requests).filter((host) => host !== appHost)).toEqual([])
  })
}

test('renders the French text and the English notice on /en/legal/notice', async ({ page }) => {
  await page.goto('/en/legal/notice')

  await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mentions légales')
  await expect(page.getByRole('note')).toContainText('the French version prevails')
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', 'index, follow')
})

test('holds every legal page at 360 px without overflow', async ({ page }) => {
  for (const document of documents) {
    await page.setViewportSize({ width: 360, height: 800 })
    await page.goto(`/legal/${document.slug}`)

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    )

    expect(overflow, document.slug).toBeLessThanOrEqual(1)
  }
})

test('every internal footer link answers', async ({ page, request }) => {
  await page.goto('/legal/notice')

  const hrefs = await page.locator('.app-footer__legal a').evaluateAll((links) =>
    links
      .map((link) => (link as HTMLAnchorElement).getAttribute('href'))
      .filter((href): href is string => href !== null && href.startsWith('/')),
  )

  expect(hrefs.length).toBeGreaterThan(0)

  for (const href of [...new Set(hrefs)]) {
    const response = await request.get(href)
    expect(response.status(), href).toBeLessThan(400)
  }
})

test('the abuse page points to the AUP and the privacy policy', async ({ page }) => {
  await page.goto('/abuse')

  const section = page
    .locator('.public-card')
    .filter({ hasText: `Politique d'usage et confidentialité` })

  await expect(section.getByRole('link', { name: 'AUP' })).toHaveAttribute('href', '/legal/aup')
  await expect(section.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', '/legal/privacy')
})
