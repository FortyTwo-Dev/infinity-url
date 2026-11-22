import { expect } from '@playwright/test'
import type { Page, Request } from '@playwright/test'

export const API_URL = process.env.E2E_API_URL ?? 'http://localhost:8000'
export const MAILPIT_URL = process.env.E2E_MAILPIT_URL ?? 'http://localhost:8025'

export const PASSWORD = 'correct horse battery staple'

export function uniqueEmail(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`
}

interface MailpitMessage {
  ID: string
  To?: Array<{ Address: string }>
}

async function messageFor(email: string): Promise<{ ID: string }> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    const response = await fetch(`${MAILPIT_URL}/api/v1/messages?limit=50`)
    const payload = (await response.json()) as { messages: MailpitMessage[] }
    const message = payload.messages.find((candidate) =>
      (candidate.To ?? []).some((to) => to.Address === email),
    )

    if (message !== undefined) {
      return message
    }

    await new Promise((resolve) => setTimeout(resolve, 250))
  }

  throw new Error(`No email for ${email}`)
}

export async function verificationUrl(email: string): Promise<string> {
  const message = await messageFor(email)
  const detail = await fetch(`${MAILPIT_URL}/api/v1/message/${message.ID}`)
  const body = (await detail.json()) as { HTML?: string; Text?: string }
  const source = body.HTML ?? body.Text ?? ''
  const match = /(http:\/\/[^"'\s<]+\/verify\?token=[^"'\s<]+)/.exec(source)

  if (match?.[1] === undefined) {
    throw new Error('Verification URL not found in the email')
  }

  return match[1]
}

export async function verificationToken(email: string): Promise<string> {
  const url = new URL(await verificationUrl(email))
  const token = url.searchParams.get('token')

  if (token === null || token === '') {
    throw new Error('Verification token missing')
  }

  return token
}

export async function signUpAndVerify(page: Page, email: string): Promise<void> {
  await page.goto('/signup')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Créer mon compte' }).click()
  await expect(page.getByRole('heading', { name: 'Vérifiez votre boîte mail' })).toBeVisible()

  await page.goto(await verificationUrl(email))
  await expect(page.getByRole('heading', { name: 'Email vérifié' })).toBeVisible()
}

export async function signIn(page: Page, email: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel('Email').fill(email)
  await page.getByLabel('Mot de passe').fill(PASSWORD)
  await page.getByRole('button', { name: 'Se connecter' }).click()
  await page.waitForURL('**/links')
}

export async function createLink(
  page: Page,
  destination: string,
): Promise<{ detailUrl: string; shortUrl: string; slug: string }> {
  await page.getByRole('button', { name: 'Créer un lien' }).click()
  await page.waitForURL('**/links/new')
  await page.getByLabel('Destination').fill(destination)
  await page.getByRole('button', { name: 'Créer', exact: true }).click()
  await page.waitForURL(/\/links\/[0-9A-Z]+$/)

  const shortUrl = await page.locator('.copy-link__value').innerText()
  const slug = shortUrl.split('/').pop() ?? ''

  return { detailUrl: page.url(), shortUrl, slug }
}

export function requestHosts(requests: Request[]): string[] {
  return [...new Set(requests.map((request) => new URL(request.url()).host))]
}
