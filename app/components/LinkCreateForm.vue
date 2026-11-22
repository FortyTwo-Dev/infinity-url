<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'
import { LINK_DOMAIN } from '~/lib/links/domain'
import type { LinkItem } from '~/stores/links'

const emit = defineEmits<{ created: [link: LinkItem] }>()

const { t } = useI18n()
const { message, fieldMessage, codeMessage } = useProblemMessage()

const destination = ref('')
const slug = ref('')
const expiresAt = ref('')
const pending = ref(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

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

  if (slug.value !== '' && !/^[A-Za-z0-9_-]{2,64}$/.test(slug.value)) {
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

async function submit(): Promise<void> {
  globalError.value = null
  fieldErrors.value = {}

  if (!validate()) {
    return
  }

  pending.value = true

  const body: Record<string, string> = {
    destination: destination.value.trim(),
  }

  if (slug.value.trim() !== '') {
    body.slug = slug.value.trim()
  }

  if (expiresAt.value !== '') {
    body.expires_at = new Date(expiresAt.value).toISOString()
  }

  try {
    const link = await apiRequest<LinkItem>('/links', {
      method: 'POST',
      body,
    })

    emit('created', link)
  } catch (error) {
    applyProblem(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <form class="auth-form" @submit.prevent="submit">
    <ItField
      :label="t('links.create.destination')"
      html-for="link-destination"
      :hint="t('links.create.destinationHint')"
      :error="fieldErrors.destination"
    >
      <ItInput
        id="link-destination"
        v-model="destination"
        type="url"
        autocomplete="url"
        :invalid="Boolean(fieldErrors.destination)"
        required
      />
    </ItField>

    <ItField
      :label="t('links.create.slug')"
      html-for="link-slug"
      :hint="t('links.create.slugHint')"
      :error="fieldErrors.slug"
    >
      <ItInput
        id="link-slug"
        v-model="slug"
        type="text"
        autocomplete="off"
        :invalid="Boolean(fieldErrors.slug)"
      />
    </ItField>

    <ItField
      :label="t('links.create.domain')"
      html-for="link-domain"
      :hint="t('links.create.domainHint')"
    >
      <ItInput
        id="link-domain"
        :model-value="LINK_DOMAIN"
        type="text"
        disabled
      />
    </ItField>

    <ItField
      :label="t('links.create.expiresAt')"
      html-for="link-expires"
      :hint="t('links.create.expiresAtHint')"
      :error="fieldErrors.expires_at"
    >
      <ItInput
        id="link-expires"
        v-model="expiresAt"
        type="datetime-local"
        :invalid="Boolean(fieldErrors.expires_at)"
      />
    </ItField>

    <p v-if="globalError" class="it-field-error" role="alert">
      {{ globalError }}
    </p>

    <p v-if="pending" class="it-small" role="status">
      {{ t('links.create.waiting') }}
    </p>

    <ItButton
      type="submit"
      variant="primary"
      :loading="pending"
      :disabled="pending"
    >
      {{ pending ? t('links.create.submitting') : t('links.create.submit') }}
    </ItButton>
  </form>
</template>
