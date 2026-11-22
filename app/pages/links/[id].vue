<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'
import { displayStatus } from '~/lib/links/status'
import { useAuthStore } from '~/stores/auth'
import type { LinkItem } from '~/stores/links'

definePageMeta({ capability: 'links:read' })

const route = useRoute()
const auth = useAuthStore()
const { t } = useI18n()
const localePath = useLocalePath()
const { message } = useProblemMessage()

const id = computed(() => String(route.params.id))
const link = ref<LinkItem | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const notFound = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const deleteError = ref<string | null>(null)

const status = computed(() =>
  link.value === null ? null : displayStatus(link.value),
)

const canWrite = computed(() =>
  auth.can('links:write') && status.value !== 'blocked',
)

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  notFound.value = false

  try {
    link.value = await apiRequest<LinkItem>(
      `/links/${encodeURIComponent(id.value)}`,
    )
  } catch (cause) {
    link.value = null

    if (cause instanceof ApiProblem && cause.code === 'link_not_found') {
      notFound.value = true
    } else {
      error.value = message(cause)
    }
  } finally {
    loading.value = false
  }
}

function saved(updated: LinkItem): void {
  link.value = updated
}

async function confirmDelete(): Promise<void> {
  deleting.value = true
  deleteError.value = null

  try {
    await apiRequest<undefined>(`/links/${encodeURIComponent(id.value)}`, {
      method: 'DELETE',
    })
    await navigateTo(localePath('/links'))
  } catch (cause) {
    deleteError.value = message(cause)
  } finally {
    deleting.value = false
  }
}

function cancelDelete(): void {
  deleteOpen.value = false
  deleteError.value = null
}

onMounted(load)
</script>

<template>
  <section>
    <div v-if="loading" class="detail">
      <div class="link-skeleton detail__skeleton" />
      <output class="it-small it-muted">
        {{ t('common.loading') }}
      </output>
    </div>

    <div v-else-if="notFound" class="empty-state">
      <h1 class="it-h2">
        {{ t('links.detail.notFoundTitle') }}
      </h1>
      <p class="it-p">
        {{ t('links.detail.notFoundBody') }}
      </p>
      <NuxtLink :to="localePath('/links')" class="it-link-accent">
        {{ t('links.detail.backToLinks') }}
      </NuxtLink>
    </div>

    <ErrorBanner v-else-if="error" :message="error" @retry="load" />

    <template v-else-if="link">
      <header class="page-header">
        <div class="detail__heading">
          <p class="it-small it-muted">
            {{ t('links.detail.title') }}
          </p>
          <h1 class="it-h1">
            {{ link.slug }}
          </h1>
        </div>
        <div class="detail__heading">
          <LinkStatusBadge v-if="status" :status="status" />
          <NuxtLink :to="localePath('/links')" class="it-link-accent">
            {{ t('links.detail.backToLinks') }}
          </NuxtLink>
        </div>
      </header>

      <div class="detail__card">
        <h2 class="it-h3">
          {{ t('links.detail.shortUrl') }}
        </h2>
        <CopyLinkButton :value="link.short_url" />
      </div>

      <output v-if="status === 'expired'" class="notice">
        {{ t('links.detail.expiredNote') }}
      </output>
      <output v-else-if="status === 'blocked'" class="notice">
        {{ t('links.detail.blockedNote') }}
      </output>
      <output v-else-if="status === 'disabled'" class="notice">
        {{ t('links.detail.disabledNote') }}
        {{ t('links.detail.reactivateWithExpiry') }}
      </output>

      <LinkDetailForm
        v-if="canWrite"
        :link="link"
        :can-write="canWrite"
        @saved="saved"
      />

      <div v-if="auth.can('links:write')" class="detail__danger">
        <ItButton variant="danger" @click="deleteOpen = true">
          {{ t('links.detail.delete') }}
        </ItButton>
      </div>

      <StatsPanel v-if="auth.can('stats:read')" :link-id="link.id" />

      <LinkQr
        v-if="auth.can('qr')"
        :short-url="link.short_url"
        :slug="link.slug"
        :status="displayStatus(link)"
      />

      <ConfirmDialog
        :open="deleteOpen"
        :title="t('links.detail.deleteTitle')"
        :body="t('links.detail.deleteBody')"
        :confirm-label="t('common.delete')"
        :pending="deleting"
        :error="deleteError"
        @confirm="confirmDelete"
        @cancel="cancelDelete"
      />
    </template>
  </section>
</template>
