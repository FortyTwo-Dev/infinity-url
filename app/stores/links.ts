import { defineStore } from 'pinia'
import { ref } from 'vue'

import { apiRequest } from '~/lib/api/client'
import type { operations } from '~~/types/api'

export type LinkListResponse =
  operations['link.index']['responses'][200]['content']['application/json']
export type LinkItem = LinkListResponse['data'][number]

export type LinkStatusFilter = '' | 'active' | 'disabled' | 'blocked'
export type LinkSort = 'created_at' | '-created_at'

export interface LinkFilters {
  q: string
  status: LinkStatusFilter
  sort: LinkSort
}

const DEFAULT_FILTERS: LinkFilters = {
  q: '',
  status: '',
  sort: '-created_at',
}

const PAGE_SIZE = 20

export const useLinksStore = defineStore('links', () => {
  const items = ref<LinkItem[]>([])
  const loading = ref(false)
  const loadingMore = ref(false)
  const loaded = ref(false)
  const error = ref<unknown>(null)
  const nextCursor = ref<string | null>(null)
  const hasMore = ref(false)
  const filters = ref<LinkFilters>({ ...DEFAULT_FILTERS })

  let requestId = 0

  function query(cursor: string | null): string {
    const params = new URLSearchParams({
      limit: String(PAGE_SIZE),
      include: 'clicks_7d',
      sort: filters.value.sort,
    })

    const search = filters.value.q.trim()

    if (search.length >= 2) {
      params.set('q', search)
    }

    if (filters.value.status !== '') {
      params.set('status', filters.value.status)
    }

    if (cursor !== null) {
      params.set('cursor', cursor)
    }

    return params.toString()
  }

  async function load(reset = true): Promise<void> {
    const current = ++requestId

    if (reset) {
      loading.value = true
      nextCursor.value = null
      hasMore.value = false
    } else {
      loadingMore.value = true
    }

    error.value = null

    try {
      const response = await apiRequest<LinkListResponse>(
        `/links?${query(reset ? null : nextCursor.value)}`,
      )

      if (current !== requestId) {
        return
      }

      items.value = reset
        ? response.data
        : merge(items.value, response.data)
      nextCursor.value = response.next_cursor
      hasMore.value = response.has_more
      loaded.value = true
    } catch (cause) {
      if (current === requestId) {
        error.value = cause
      }
    } finally {
      if (current === requestId) {
        loading.value = false
        loadingMore.value = false
      }
    }
  }

  async function loadMore(): Promise<void> {
    if (!hasMore.value || loading.value || loadingMore.value) {
      return
    }

    await load(false)
  }

  function setFilters(next: Partial<LinkFilters>): void {
    filters.value = { ...filters.value, ...next }
  }

  function resetFilters(): void {
    filters.value = { ...DEFAULT_FILTERS }
  }

  function clearError(): void {
    error.value = null
  }

  async function remove(id: string): Promise<void> {
    await apiRequest<undefined>(`/links/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    })

    items.value = items.value.filter((item) => item.id !== id)

    if (items.value.length === 0) {
      hasMore.value = false
      nextCursor.value = null
    }
  }

  function reset(): void {
    items.value = []
    loaded.value = false
    error.value = null
    nextCursor.value = null
    hasMore.value = false
    filters.value = { ...DEFAULT_FILTERS }
  }

  return {
    items,
    loading,
    loadingMore,
    loaded,
    error,
    nextCursor,
    hasMore,
    filters,
    load,
    loadMore,
    setFilters,
    resetFilters,
    clearError,
    remove,
    reset,
  }
})

function merge(existing: LinkItem[], page: LinkItem[]): LinkItem[] {
  const byId = new Map<string, LinkItem>()

  for (const item of existing) {
    byId.set(item.id, item)
  }

  for (const item of page) {
    byId.set(item.id, item)
  }

  return [...byId.values()]
}
