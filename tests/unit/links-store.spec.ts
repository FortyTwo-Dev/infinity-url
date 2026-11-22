import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { apiRequest } from '~/lib/api/client'
import { useLinksStore } from '~/stores/links'
import type { LinkItem } from '~/stores/links'

vi.mock('~/lib/api/client', () => ({
  apiRequest: vi.fn(),
}))

const request = vi.mocked(apiRequest)

function link(id: string, slug: string, clicks = 0): LinkItem {
  return {
    id,
    slug,
    destination: `https://example.com/${slug}`,
    short_url: `https://iurl.fr/${slug}`,
    status: 'active',
    expires_at: null,
    created_at: '2026-11-22T10:00:00Z',
    updated_at: '2026-11-22T10:00:00Z',
    clicks_7d: clicks,
  }
}

function page(items: LinkItem[], next: string | null = null): unknown {
  return {
    data: items,
    next_cursor: next,
    has_more: next !== null,
  }
}

describe('links store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    request.mockReset()
  })

  it('requests the page with clicks_7d and without a search under two characters', async () => {
    request.mockResolvedValueOnce(page([link('1', 'one0001', 3)]) as never)

    const store = useLinksStore()
    store.setFilters({ q: 'a' })
    await store.load()

    expect(request).toHaveBeenCalledWith(
      '/links?limit=20&include=clicks_7d&sort=-created_at',
    )
    expect(store.items).toHaveLength(1)
    expect(store.items[0]?.clicks_7d).toBe(3)
    expect(store.loading).toBe(false)
    expect(store.loaded).toBe(true)
    expect(store.error).toBeNull()
  })

  it('sends the search and the status from two characters', async () => {
    request.mockResolvedValueOnce(page([]) as never)

    const store = useLinksStore()
    store.setFilters({ q: ' promo ', status: 'disabled' })
    await store.load()

    const url = String(request.mock.calls[0]?.[0])

    expect(url).toContain('q=promo')
    expect(url).toContain('status=disabled')
  })

  it('keeps the previous page and deduplicates when loading more', async () => {
    request
      .mockResolvedValueOnce(page([link('1', 'one0001'), link('2', 'two0002')], 'cursor-1') as never)
      .mockResolvedValueOnce(page([link('2', 'two0002'), link('3', 'three03')]) as never)

    const store = useLinksStore()
    await store.load()
    await store.loadMore()

    expect(String(request.mock.calls[1]?.[0])).toContain('cursor=cursor-1')
    expect(store.items.map((item) => item.id)).toEqual(['1', '2', '3'])
    expect(store.hasMore).toBe(false)
    expect(store.nextCursor).toBeNull()
  })

  it('stores the error and stops loading when the request fails', async () => {
    request.mockRejectedValueOnce(new Error('boom'))

    const store = useLinksStore()
    await store.load()

    expect(store.error).toBeInstanceOf(Error)
    expect(store.loading).toBe(false)
    expect(store.items).toEqual([])
  })

  it('resets the items on a new filter load', async () => {
    request
      .mockResolvedValueOnce(page([link('1', 'one0001')]) as never)
      .mockResolvedValueOnce(page([]) as never)

    const store = useLinksStore()
    await store.load()
    expect(store.items).toHaveLength(1)

    store.setFilters({ status: 'blocked' })
    await store.load()
    expect(store.items).toEqual([])
  })

  it('deletes a link and removes it from the list', async () => {
    request.mockResolvedValueOnce(page([link('1', 'one0001')]) as never)

    const store = useLinksStore()
    await store.load()

    request.mockResolvedValueOnce(undefined as never)
    await store.remove('1')

    expect(request).toHaveBeenLastCalledWith('/links/1', { method: 'DELETE' })
    expect(store.items).toEqual([])
    expect(store.hasMore).toBe(false)
  })
})
