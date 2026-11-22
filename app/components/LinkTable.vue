<script setup lang="ts">
import { formatDateTime } from '~/lib/format/date'
import { formatNumber } from '~/lib/format/number'
import { truncate } from '~/lib/format/text'
import { displayStatus } from '~/lib/links/status'
import type { LinkItem } from '~/stores/links'

defineProps<{
  items: LinkItem[]
  loading: boolean
  loadingMore: boolean
  hasMore: boolean
  error: string | null
  hasFilters: boolean
}>()

const emit = defineEmits<{
  retry: []
  loadMore: []
  create: []
  clearFilters: []
  delete: [item: LinkItem]
}>()

const { t } = useI18n()
const localePath = useLocalePath()
const intlLocale = useIntlLocale()

function created(item: LinkItem): string {
  return formatDateTime(item.created_at, intlLocale.value) ?? t('common.dash')
}

function clicks(item: LinkItem): string {
  return formatNumber(item.clicks_7d ?? 0, intlLocale.value)
}

function destination(item: LinkItem): string {
  return truncate(item.destination, 40)
}
</script>

<template>
  <div v-if="loading && items.length === 0" class="link-skeletons">
    <output class="it-sr-only">{{ t('common.loading') }}</output>
    <div v-for="row in 3" :key="row" class="link-skeleton" />
  </div>

  <ErrorBanner
    v-else-if="error && items.length === 0"
    :message="error"
    @retry="emit('retry')"
  />

  <div v-else-if="items.length === 0" class="empty-state">
    <h2 class="it-h3">
      {{ hasFilters ? t('links.list.noResultsTitle') : t('links.list.emptyTitle') }}
    </h2>
    <p class="it-p">
      {{ hasFilters ? t('links.list.noResultsBody') : t('links.list.emptyBody') }}
    </p>
    <ItButton
      v-if="hasFilters"
      variant="secondary"
      @click="emit('clearFilters')"
    >
      {{ t('common.clearFilters') }}
    </ItButton>
    <ItButton v-else variant="primary" @click="emit('create')">
      {{ t('links.list.create') }}
    </ItButton>
  </div>

  <div v-else class="link-list">
    <ErrorBanner v-if="error" :message="error" @retry="emit('retry')" />

    <table class="link-table">
      <thead>
        <tr>
          <th scope="col">
            {{ t('links.list.columnSlug') }}
          </th>
          <th scope="col">
            {{ t('links.list.columnDestination') }}
          </th>
          <th scope="col">
            {{ t('links.list.columnClicks') }}
          </th>
          <th scope="col">
            {{ t('links.list.columnStatus') }}
          </th>
          <th scope="col">
            {{ t('links.list.columnCreated') }}
          </th>
          <th scope="col">
            <span class="it-sr-only">{{ t('common.delete') }}</span>
          </th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="item in items" :key="item.id">
          <td>
            <NuxtLink :to="localePath(`/links/${item.id}`)" class="it-link-accent">
              {{ item.slug }}
            </NuxtLink>
          </td>
          <td>
            <span :title="item.destination">{{ destination(item) }}</span>
          </td>
          <td class="link-clicks">
            {{ clicks(item) }}
          </td>
          <td>
            <LinkStatusBadge :status="displayStatus(item)" />
          </td>
          <td>{{ created(item) }}</td>
          <td>
            <ItButton
              variant="ghost"
              size="sm"
              :aria-label="t('links.list.deleteLabel')"
              @click="emit('delete', item)"
            >
              {{ t('common.delete') }}
            </ItButton>
          </td>
        </tr>
      </tbody>
    </table>

    <ul class="link-cards">
      <li v-for="item in items" :key="item.id" class="link-card">
        <NuxtLink :to="localePath(`/links/${item.id}`)" class="link-card__main">
          <span class="link-card__slug">{{ item.slug }}</span>
          <span class="link-card__destination">{{ destination(item) }}</span>
          <span class="link-card__meta">
            <LinkStatusBadge :status="displayStatus(item)" />
            <span>{{ t('links.list.columnClicks') }}: {{ clicks(item) }}</span>
            <span>{{ created(item) }}</span>
          </span>
        </NuxtLink>
        <ItButton
          variant="ghost"
          size="sm"
          :aria-label="t('links.list.deleteLabel')"
          @click="emit('delete', item)"
        >
          {{ t('common.delete') }}
        </ItButton>
      </li>
    </ul>

    <div v-if="hasMore" class="link-more">
      <ItButton
        variant="secondary"
        :loading="loadingMore"
        :disabled="loadingMore"
        @click="emit('loadMore')"
      >
        {{ t('common.loadMore') }}
      </ItButton>
    </div>
  </div>
</template>
