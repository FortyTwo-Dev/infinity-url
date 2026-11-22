import { ItButton, ItField, ItInput } from '@infinitylib/infinity-theme-vue'
import { mountSuspended } from '@nuxt/test-utils/runtime'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import LinkCreateForm from '~/components/LinkCreateForm.vue'
import LinkDetailForm from '~/components/LinkDetailForm.vue'
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'

vi.mock('~/lib/api/client', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/lib/api/client')>()

  return { ...actual, apiRequest: vi.fn() }
})

const request = vi.mocked(apiRequest)

// The theme wrappers are registered by a Nuxt plugin that the test harness does
// not run, so every mount registers the real components itself.
const themeComponents = { ItButton, ItField, ItInput }

const baseLink = {
  id: 'link-1',
  slug: 'promo42',
  destination: 'https://example.com/promo',
  short_url: 'https://iurl.fr/promo42',
  status: 'active' as const,
  expires_at: null,
  created_at: '2026-11-22T10:00:00Z',
  updated_at: '2026-11-22T10:00:00Z',
  clicks_7d: 7,
}

const destinationLabel =
  'Saisissez une URL http ou https valide, sans identifiants.'

function tick(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0))
}

type Mounted = Awaited<ReturnType<typeof mountSuspended>>

function mountCreate() {
  return mountSuspended(LinkCreateForm, { global: { components: themeComponents } })
}

function mountDetail(
  link: typeof baseLink = baseLink,
  canWrite = true,
) {
  return mountSuspended(LinkDetailForm, {
    props: { link, canWrite },
    global: { components: themeComponents },
  })
}

async function submit(wrapper: Mounted): Promise<void> {
  await wrapper.find('form').trigger('submit')
  await tick()
}

function buttonWithText(wrapper: Mounted, text: string) {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.text() === text)

  if (!button) {
    throw new Error(`No button labelled "${text}" was rendered.`)
  }

  return button
}

type Call = [string, { method?: string; body?: Record<string, unknown> }]

function lastCall(): Call {
  const call = request.mock.calls.at(-1)

  if (!call) {
    throw new Error('apiRequest was not called.')
  }

  return call as unknown as Call
}

describe('LinkCreateForm', () => {
  beforeEach(() => {
    request.mockReset()
  })

  it('refuses an empty destination without calling the API', async () => {
    const wrapper = await mountCreate()

    await submit(wrapper)

    expect(wrapper.find('#link-destination-error').text()).toBe(destinationLabel)
    expect(request).not.toHaveBeenCalled()
    expect(wrapper.emitted('created')).toBeUndefined()
  })

  it('refuses a javascript: destination without calling the API', async () => {
    const wrapper = await mountCreate()

    await wrapper.find('#link-destination').setValue('javascript:alert(1)')
    await submit(wrapper)

    expect(wrapper.find('#link-destination-error').text()).toBe(destinationLabel)
    expect(request).not.toHaveBeenCalled()
  })

  it('posts the destination, the slug and the expiration and emits the created item', async () => {
    const created = { ...baseLink, id: 'link-new', slug: 'promo-2026' }

    request.mockResolvedValueOnce(created as never)

    const wrapper = await mountCreate()
    const expiresAt = '2027-01-01T10:00'

    await wrapper.find('#link-destination').setValue('https://example.com/x')
    await wrapper.find('#link-slug').setValue('promo-2026')
    await wrapper.find('#link-expires').setValue(expiresAt)
    await submit(wrapper)

    expect(request).toHaveBeenCalledTimes(1)

    const [path, init] = lastCall()
    const body = init.body ?? {}

    expect(path).toBe('/links')
    expect(init.method).toBe('POST')
    expect(Object.keys(body).sort()).toEqual(['destination', 'expires_at', 'slug'])
    expect(body.destination).toBe('https://example.com/x')
    expect(body.slug).toBe('promo-2026')
    expect(Date.parse(String(body.expires_at))).toBe(new Date(expiresAt).getTime())
    expect(wrapper.emitted('created')).toEqual([[created]])
  })

  it('maps a slug_taken failure onto the slug field and emits nothing', async () => {
    request.mockRejectedValueOnce(new ApiProblem('slug_taken', 409))

    const wrapper = await mountCreate()

    await wrapper.find('#link-destination').setValue('https://example.com/x')
    await wrapper.find('#link-slug').setValue('promo2026')
    await submit(wrapper)

    expect(wrapper.find('#link-slug-error').text()).toBe('Ce slug est déjà utilisé.')
    expect(wrapper.emitted('created')).toBeUndefined()
  })

  it('shows the local destination label on a validation_failed answer', async () => {
    request.mockRejectedValueOnce(
      new ApiProblem('validation_failed', 422, { destination: ['bad'] }),
    )

    const wrapper = await mountCreate()

    await wrapper.find('#link-destination').setValue('https://example.com/x')
    await submit(wrapper)

    expect(wrapper.find('#link-destination-error').text()).toBe(destinationLabel)
    expect(wrapper.text()).not.toContain('bad')
  })

  it('refuses an expiration in the past without calling the API', async () => {
    const wrapper = await mountCreate()

    await wrapper.find('#link-destination').setValue('https://example.com/x')
    await wrapper.find('#link-expires').setValue('2020-01-01T10:00')
    await submit(wrapper)

    expect(wrapper.find('#link-expires-error').text()).toBe(
      'Choisissez une date future.',
    )
    expect(request).not.toHaveBeenCalled()
  })

  it('disables the submit button and relabels it while the request is pending', async () => {
    let resolveRequest: (value: unknown) => void = () => {}

    request.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveRequest = resolve
      }) as never,
    )

    const wrapper = await mountCreate()

    await wrapper.find('#link-destination').setValue('https://example.com/x')
    await submit(wrapper)

    const pending = buttonWithText(wrapper, 'Création…')

    expect(pending.attributes('disabled')).toBeDefined()

    resolveRequest({ ...baseLink, id: 'link-new' })
    await tick()
  })
})

describe('LinkDetailForm', () => {
  beforeEach(() => {
    request.mockReset()
  })

  it('renders nothing without the write ability', async () => {
    const wrapper = await mountDetail(baseLink, false)

    expect(wrapper.find('form').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('Enregistrer')
  })

  it('patches the destination alone and emits the saved item', async () => {
    const updated = { ...baseLink, destination: 'https://example.com/new' }

    request.mockResolvedValueOnce(updated as never)

    const wrapper = await mountDetail()

    await wrapper.find('#detail-destination').setValue('https://example.com/new')
    await submit(wrapper)

    const [path, init] = lastCall()

    expect(path).toBe('/links/link-1')
    expect(init.method).toBe('PATCH')
    expect(init.body).toEqual({ destination: 'https://example.com/new' })
    expect(wrapper.emitted('saved')).toEqual([[updated]])
  })

  it('warns about the 410 and waits for the confirmation before renaming the slug', async () => {
    const updated = { ...baseLink, slug: 'promo43' }

    request.mockResolvedValueOnce(updated as never)

    const wrapper = await mountDetail()

    expect(wrapper.find('form').text()).not.toContain('410')

    await wrapper.find('#detail-slug').setValue('promo43')

    expect(wrapper.find('form').text()).toContain('410')

    await submit(wrapper)

    expect(request).not.toHaveBeenCalled()

    await buttonWithText(wrapper, 'Confirmer').trigger('click')
    await tick()

    expect(request).toHaveBeenCalledTimes(1)

    const [path, init] = lastCall()

    expect(path).toBe('/links/link-1')
    expect(init.method).toBe('PATCH')
    expect(init.body?.slug).toBe('promo43')
    expect(wrapper.emitted('saved')).toEqual([[updated]])
  })

  it('reactivates a disabled link when a new expiration is set', async () => {
    const disabled = { ...baseLink, status: 'disabled' as const }
    const reactivated = { ...baseLink, status: 'active' as const }

    request.mockResolvedValueOnce(reactivated as never)

    const wrapper = await mountDetail(disabled)
    const expiresAt = '2027-06-01T10:00'

    await wrapper.find('#detail-expires').setValue(expiresAt)
    await submit(wrapper)

    const [, init] = lastCall()

    expect(init.method).toBe('PATCH')
    expect(init.body?.status).toBe('active')
    expect(Date.parse(String(init.body?.expires_at))).toBe(new Date(expiresAt).getTime())
  })

  it('shows a blocked link failure globally and emits nothing', async () => {
    request.mockRejectedValueOnce(new ApiProblem('link_blocked', 403))

    const wrapper = await mountDetail()

    await wrapper.find('#detail-destination').setValue('https://example.com/new')
    await submit(wrapper)

    expect(wrapper.text()).toContain('Ce lien a été bloqué.')
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})
