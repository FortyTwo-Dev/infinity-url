<script setup lang="ts">
import type { LinkItem } from '~/stores/links'
import { useAuthStore } from '~/stores/auth'
import { useLinksStore } from '~/stores/links'

definePageMeta({ capability: 'links:read' })

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const store = useLinksStore()
const { message } = useProblemMessage()

const search = ref(store.filters.q)
const selected = ref<LinkItem | null>(null)
const deleting = ref(false)
const deleteError = ref<string | null>(null)
let debounce: ReturnType<typeof setTimeout> | null = null

const errorMessage = computed(() =>
  store.error ? message(store.error) : null,
)

const hasFilters = computed(() =>
  store.filters.q !== '' || store.filters.status !== '',
)

onMounted(() => {
  void store.load()
})

onBeforeUnmount(() => {
  if (debounce !== null) {
    clearTimeout(debounce)
  }
})

watch(search, (value) => {
  if (debounce !== null) {
    clearTimeout(debounce)
  }

  debounce = setTimeout(() => {
    store.setFilters({ q: value.trim() })
    void store.load()
  }, 300)
})

function setStatus(value: string | undefined): void {
  store.setFilters({
    status: value === 'active' || value === 'disabled' || value === 'blocked'
      ? value
      : '',
  })
  void store.load()
}

function setSort(value: string | undefined): void {
  store.setFilters({ sort: value === 'created_at' ? 'created_at' : '-created_at' })
  void store.load()
}

function clearFilters(): void {
  search.value = ''
  store.resetFilters()
  void store.load()
}

function create(): void {
  void navigateTo(localePath('/links/new'))
}

function askDelete(item: LinkItem): void {
  selected.value = item
  deleteError.value = null
}

function cancelDelete(): void {
  selected.value = null
  deleteError.value = null
}

async function confirmDelete(): Promise<void> {
  if (selected.value === null) {
    return
  }

  deleting.value = true
  deleteError.value = null

  try {
    await store.remove(selected.value.id)
    selected.value = null
  } catch (error) {
    deleteError.value = message(error)
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <section>
    <header class="page-header">
      <h1 class="it-h1">
        {{ t('links.list.title') }}
      </h1>
      <ItButton
        v-if="auth.can('links:write')"
        variant="primary"
        @click="create"
      >
        {{ t('links.list.create') }}
      </ItButton>
    </header>

    <EmailVerificationBanner v-if="!auth.emailVerified" />

    <div class="links-toolbar">
      <ItField :label="t('links.list.searchLabel')" html-for="links-search">
        <ItInput
          id="links-search"
          v-model="search"
          type="search"
          :placeholder="t('links.list.searchPlaceholder')"
        />
      </ItField>

      <ItField :label="t('links.list.statusLabel')" html-for="links-status">
        <ItSelect
          id="links-status"
          :model-value="store.filters.status"
          @update:model-value="setStatus"
        >
          <ItOption value="" :text="t('links.list.statusAll')" />
          <ItOption value="active" :text="t('links.status.active')" />
          <ItOption value="disabled" :text="t('links.status.disabled')" />
          <ItOption value="blocked" :text="t('links.status.blocked')" />
        </ItSelect>
      </ItField>

      <ItField :label="t('links.list.sortLabel')" html-for="links-sort">
        <ItSelect
          id="links-sort"
          :model-value="store.filters.sort"
          @update:model-value="setSort"
        >
          <ItOption value="-created_at" :text="t('links.list.sortNewest')" />
          <ItOption value="created_at" :text="t('links.list.sortOldest')" />
        </ItSelect>
      </ItField>
    </div>

    <LinkTable
      :items="store.items"
      :loading="store.loading"
      :loading-more="store.loadingMore"
      :has-more="store.hasMore"
      :error="errorMessage"
      :has-filters="hasFilters"
      @retry="store.load()"
      @load-more="store.loadMore()"
      @create="create"
      @clear-filters="clearFilters"
      @delete="askDelete"
    />

    <ConfirmDialog
      :open="selected !== null"
      :title="t('links.list.deleteTitle')"
      :body="t('links.list.deleteBody')"
      :confirm-label="t('common.delete')"
      :pending="deleting"
      :error="deleteError"
      @confirm="confirmDelete"
      @cancel="cancelDelete"
    />
  </section>
</template>
