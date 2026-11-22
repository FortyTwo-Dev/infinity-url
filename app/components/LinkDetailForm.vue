<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'
import {
  fromLocalDateTimeInput,
  toLocalDateTimeInput,
} from '~/lib/format/date'
import type { LinkItem } from '~/stores/links'

const props = defineProps<{
  link: LinkItem
  canWrite: boolean
}>()

const emit = defineEmits<{ saved: [link: LinkItem] }>()

const { t } = useI18n()
const { message, fieldMessage, codeMessage } = useProblemMessage()

const destination = ref(props.link.destination)
const slug = ref(props.link.slug)
const expiresAt = ref(toLocalDateTimeInput(props.link.expires_at))
const pending = ref(false)
const renameOpen = ref(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

watch(
  () => props.link,
  (link) => {
    destination.value = link.destination
    slug.value = link.slug
    expiresAt.value = toLocalDateTimeInput(link.expires_at)
    globalError.value = null
    fieldErrors.value = {}
  },
)

const slugChanged = computed(() => slug.value.trim() !== props.link.slug)

function validate(): boolean {
  const fields: Record<string, string> = {}
  const value = destination.value.trim()

  if (value === '') {
    fields.destination = fieldMessage('destination')
  } else {
    try {
      const url = new URL(value)

      if (
        (url.protocol !== 'http:' && url.protocol !== 'https:')
        || url.username !== ''
        || url.password !== ''
      ) {
        fields.destination = fieldMessage('destination')
      }
    } catch {
      fields.destination = fieldMessage('destination')
    }
  }

  if (!/^[A-Za-z0-9_-]{2,64}$/.test(slug.value.trim())) {
    fields.slug = fieldMessage('slug')
  }

  if (expiresAt.value !== '') {
    const when = new Date(expiresAt.value)

    if (Number.isNaN(when.getTime()) || when.getTime() <= Date.now()) {
      fields.expires_at = fieldMessage('expires_at')
    }
  }

  fieldErrors.value = fields

  return Object.keys(fields).length === 0
}

function requestSave(): void {
  globalError.value = null
  fieldErrors.value = {}

  if (!validate()) {
    return
  }

  if (slugChanged.value) {
    renameOpen.value = true

    return
  }

  void save()
}

function applyProblem(error: unknown): void {
  const fields: Record<string, string> = {}

  if (error instanceof ApiProblem) {
    for (const field of Object.keys(error.errors)) {
      fields[field] = fieldMessage(field)
    }

    if (error.code === 'slug_taken' || error.code === 'slug_reserved') {
      fields.slug = codeMessage(error.code)
    }
  }

  fieldErrors.value = fields
  globalError.value = message(error)
}

async function save(): Promise<void> {
  renameOpen.value = false
  pending.value = true

  const body: Record<string, unknown> = {}
  const nextExpiration = fromLocalDateTimeInput(expiresAt.value)
  const expirationChanged =
    toLocalDateTimeInput(props.link.expires_at) !== expiresAt.value

  if (destination.value.trim() !== props.link.destination) {
    body.destination = destination.value.trim()
  }

  if (slugChanged.value) {
    body.slug = slug.value.trim()
  }

  if (expirationChanged) {
    body.expires_at = nextExpiration
  }

  if (
    props.link.status === 'disabled'
    && nextExpiration !== null
    && new Date(nextExpiration).getTime() > Date.now()
  ) {
    body.status = 'active'
  }

  if (Object.keys(body).length === 0) {
    pending.value = false

    return
  }

  try {
    const updated = await apiRequest<LinkItem>(
      `/links/${encodeURIComponent(props.link.id)}`,
      { method: 'PATCH', body },
    )

    emit('saved', updated)
  } catch (error) {
    applyProblem(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section v-if="canWrite" class="edit-form">
    <h2 class="it-h2">
      {{ t('links.detail.editTitle') }}
    </h2>

    <form class="auth-form" @submit.prevent="requestSave">
      <ItField
        :label="t('links.detail.destination')"
        html-for="detail-destination"
        :error="fieldErrors.destination"
      >
        <ItInput
          id="detail-destination"
          v-model="destination"
          type="url"
          autocomplete="url"
          :invalid="Boolean(fieldErrors.destination)"
          required
        />
      </ItField>

      <ItField
        :label="t('links.detail.slug')"
        html-for="detail-slug"
        :error="fieldErrors.slug"
      >
        <ItInput
          id="detail-slug"
          v-model="slug"
          type="text"
          autocomplete="off"
          :invalid="Boolean(fieldErrors.slug)"
          required
        />
      </ItField>

      <p v-if="slugChanged" class="it-small">
        {{ t('links.detail.slugRenameWarning') }}
      </p>

      <ItField
        :label="t('links.detail.expiresAt')"
        html-for="detail-expires"
        :error="fieldErrors.expires_at"
      >
        <ItInput
          id="detail-expires"
          v-model="expiresAt"
          type="datetime-local"
          :invalid="Boolean(fieldErrors.expires_at)"
        />
      </ItField>

      <p v-if="globalError" class="it-field-error" role="alert">
        {{ globalError }}
      </p>

      <ItButton
        type="submit"
        variant="primary"
        :loading="pending"
        :disabled="pending"
      >
        {{ pending ? t('links.detail.saving') : t('links.detail.save') }}
      </ItButton>
    </form>

    <ConfirmDialog
      :open="renameOpen"
      :title="t('links.detail.editTitle')"
      :body="t('links.detail.slugRenameWarning')"
      :confirm-label="t('common.confirm')"
      :pending="pending"
      @confirm="save"
      @cancel="renameOpen = false"
    />
  </section>
</template>
