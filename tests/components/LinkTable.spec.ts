import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import LinkTable from '~/components/LinkTable.vue'

const destination =
  'https://example.com/produits/offre-speciale-de-novembre-2026'

const item = {
  id: 'link-1',
  slug: 'promo42',
  destination,
  short_url: 'https://iurl.fr/promo42',
  status: 'active' as const,
  expires_at: null,
  created_at: '2026-11-22T10:00:00Z',
  updated_at: '2026-11-22T10:00:00Z',
  clicks_7d: 7,
}

function mountTable(overrides: Record<string, unknown> = {}) {
  return mountSuspended(LinkTable, {
    props: {
      items: [],
      loading: false,
      loadingMore: false,
      hasMore: false,
      error: null,
      hasFilters: false,
      ...overrides,
    },
  })
}

function buttonWithText(
  wrapper: Awaited<ReturnType<typeof mountTable>>,
  text: string,
) {
  const button = wrapper
    .findAll('button')
    .find((candidate) => candidate.text() === text)

  if (!button) {
    throw new Error(`No button labelled "${text}" was rendered.`)
  }

  return button
}

describe('LinkTable', () => {
  it('renders three skeletons and no table while the first page loads', async () => {
    const wrapper = await mountTable({ loading: true })

    expect(wrapper.findAll('.link-skeleton')).toHaveLength(3)
    expect(wrapper.find('table').exists()).toBe(false)
  })

  it('offers to create a first link when there is no item and no filter', async () => {
    const wrapper = await mountTable()

    expect(wrapper.text()).toContain("Aucun lien pour l'instant.")
    expect(wrapper.find('table').exists()).toBe(false)

    await buttonWithText(wrapper, 'Créer un lien').trigger('click')

    expect(wrapper.emitted('create')).toHaveLength(1)
  })

  it('reports no result and can clear the filters when a filter is active', async () => {
    const wrapper = await mountTable({ hasFilters: true })

    expect(wrapper.text()).toContain('Aucun résultat')
    expect(wrapper.text()).not.toContain("Aucun lien pour l'instant.")

    await buttonWithText(wrapper, 'Effacer les filtres').trigger('click')

    expect(wrapper.emitted('clearFilters')).toHaveLength(1)
  })

  it('shows the error in an alert banner and retries on demand', async () => {
    const wrapper = await mountTable({ error: 'Erreur' })

    const alert = wrapper.find('[role="alert"]')

    expect(alert.exists()).toBe(true)
    expect(alert.text()).toContain('Erreur')
    expect(wrapper.find('table').exists()).toBe(false)

    await buttonWithText(wrapper, 'Réessayer').trigger('click')

    expect(wrapper.emitted('retry')).toHaveLength(1)
  })

  it('renders a row and a mobile card for each item, with a truncated destination', async () => {
    const wrapper = await mountTable({ items: [item] })

    const row = wrapper.find('.link-table tbody tr')

    expect(row.exists()).toBe(true)
    expect(row.text()).toContain('promo42')
    expect(row.text()).toContain('7')
    expect(row.text()).toContain('Actif')

    const shown = row.findAll('td')[1]?.text() ?? ''

    expect(destination).toHaveLength(60)
    expect(shown).toHaveLength(40)
    expect(shown.endsWith('…')).toBe(true)
    expect(destination.startsWith(shown.slice(0, -1))).toBe(true)

    const card = wrapper.find('.link-card')

    expect(card.exists()).toBe(true)
    expect(card.text()).toContain('promo42')
    expect(card.text()).toContain('Actif')
  })

  it('offers to load more only when the page has a successor', async () => {
    const withMore = await mountTable({ items: [item], hasMore: true })
    const withoutMore = await mountTable({ items: [item], hasMore: false })

    await buttonWithText(withMore, 'Charger plus').trigger('click')

    expect(withMore.emitted('loadMore')).toHaveLength(1)

    const labels = withoutMore.findAll('button').map((button) => button.text())

    expect(labels).not.toContain('Charger plus')
  })

  it('emits delete with the row item from the delete button', async () => {
    const wrapper = await mountTable({ items: [item] })

    const remove = wrapper.find('button[aria-label="Supprimer ce lien"]')

    expect(remove.exists()).toBe(true)

    await remove.trigger('click')

    expect(wrapper.emitted('delete')).toEqual([[item]])
  })
})
