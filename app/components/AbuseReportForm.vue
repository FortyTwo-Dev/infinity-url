<script setup lang="ts">
import { submitReport } from '~/lib/api/report'
import type { ReportCategory, ReportReceipt } from '~/lib/api/report'
import { ApiProblem } from '~/lib/api/problem'

const props = defineProps<{ initialSlug?: string }>()

const { t } = useI18n()
const { message, fieldMessage } = useProblemMessage()

const slug = ref(props.initialSlug ?? '')
const category = ref<ReportCategory>('phishing')
const details = ref('')
const email = ref('')
// Honeypot: a human never sees it and never fills it.
const website = ref('')

const pending = ref(false)
const receipt = ref<ReportReceipt | null>(null)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

watch(
  () => props.initialSlug,
  (value) => {
    if (typeof value === 'string' && value !== '') {
      slug.value = value
    }
  },
)

function validate(): boolean {
  const fields: Record<string, string> = {}

  if (slug.value.trim() === '') {
    fields.slug = fieldMessage('slug')
  }

  if (details.value.length > 2000) {
    fields.details = fieldMessage('details')
  }

  if (email.value !== '' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value)) {
    fields.email = fieldMessage('email')
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

  try {
    receipt.value = await submitReport({
      slug: slug.value.trim(),
      category: category.value,
      details: details.value.trim() === '' ? undefined : details.value.trim(),
      email: email.value.trim() === '' ? undefined : email.value.trim(),
      website: website.value,
    })
  } catch (error) {
    // The input is never cleared: a network failure must not lose the text.
    applyProblem(error)
  } finally {
    pending.value = false
  }
}

function reportAnother(): void {
  receipt.value = null
  details.value = ''
  slug.value = ''
}
</script>

<template>
  <div v-if="receipt" class="public-card">
    <h2 class="it-h2">
      {{ t('abuse.report.successTitle') }}
    </h2>
    <output class="it-p">
      {{ t('abuse.report.successBody', { reference: receipt.reference }) }}
    </output>
    <p class="it-p">
      {{ t('abuse.report.successAnonymity') }}
    </p>
    <ItButton variant="secondary" @click="reportAnother">
      {{ t('abuse.report.successAgain') }}
    </ItButton>
  </div>

  <form v-else class="public-card report-form" @submit.prevent="submit">
    <p v-if="globalError" class="it-field-error" role="alert">
      {{ globalError }}
    </p>

    <ItField
      :label="t('abuse.report.slug')"
      html-for="report-slug"
      :hint="t('abuse.report.slugHint')"
      :error="fieldErrors.slug"
    >
      <ItInput
        id="report-slug"
        v-model="slug"
        type="text"
        autocomplete="off"
        :invalid="Boolean(fieldErrors.slug)"
        :disabled="pending"
      />
    </ItField>

    <ItField
      :label="t('abuse.report.category')"
      html-for="report-category"
      :error="fieldErrors.category"
    >
      <ItSelect
        id="report-category"
        v-model="category"
        :invalid="Boolean(fieldErrors.category)"
        :disabled="pending"
      >
        <ItOption value="phishing" :text="t('abuse.report.categoryPhishing')" />
        <ItOption value="malware" :text="t('abuse.report.categoryMalware')" />
        <ItOption value="other" :text="t('abuse.report.categoryOther')" />
      </ItSelect>
    </ItField>

    <ItField
      :label="t('abuse.report.details')"
      html-for="report-details"
      :hint="t('abuse.report.detailsHint')"
      :error="fieldErrors.details"
    >
      <ItTextarea
        id="report-details"
        v-model="details"
        :rows="4"
        :invalid="Boolean(fieldErrors.details)"
        :disabled="pending"
      />
    </ItField>

    <ItField
      :label="t('abuse.report.email')"
      html-for="report-email"
      :hint="t('abuse.report.emailHint')"
      :error="fieldErrors.email"
    >
      <ItInput
        id="report-email"
        v-model="email"
        type="email"
        autocomplete="email"
        :invalid="Boolean(fieldErrors.email)"
        :disabled="pending"
      />
    </ItField>

    <p class="report-form__anonymity it-small it-muted">
      {{ t('abuse.report.anonymityNote') }}
    </p>

    <div class="honeypot" aria-hidden="true">
      <label for="report-website">{{ t('abuse.report.website') }}</label>
      <input
        id="report-website"
        v-model="website"
        type="text"
        tabindex="-1"
        autocomplete="off"
      >
    </div>

    <ItButton
      variant="primary"
      type="submit"
      :loading="pending"
      :disabled="pending"
    >
      {{ pending ? t('abuse.report.submitting') : t('abuse.report.submit') }}
    </ItButton>
  </form>
</template>
