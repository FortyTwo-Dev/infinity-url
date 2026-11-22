<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'

definePageMeta({ layout: 'auth', public: true, guestOnly: true })

const { t } = useI18n()
const localePath = useLocalePath()
const { message, fieldMessage } = useProblemMessage()

const email = ref('')
const pending = ref(false)
const done = ref(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

async function submit(): Promise<void> {
  pending.value = true
  done.value = false
  globalError.value = null
  fieldErrors.value = {}

  try {
    await apiRequest('/auth/password/forgot', {
      method: 'POST',
      body: { email: email.value },
      auth: false,
    })

    done.value = true
  } catch (error) {
    if (error instanceof ApiProblem) {
      for (const field of Object.keys(error.errors)) {
        fieldErrors.value[field] = fieldMessage(field)
      }
    }

    globalError.value = message(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="it-h1">
      {{ t('auth.forgot.title') }}
    </h1>
    <p class="it-lead">
      {{ t('auth.forgot.subtitle') }}
    </p>

    <template v-if="done">
      <h2 class="it-h2">
        {{ t('auth.forgot.successTitle') }}
      </h2>
      <p class="it-p" role="status">
        {{ t('auth.forgot.successBody') }}
      </p>
    </template>

    <form v-else class="auth-form" @submit.prevent="submit">
      <ItField
        :label="t('auth.forgot.email')"
        html-for="forgot-email"
        :error="fieldErrors.email"
      >
        <ItInput
          id="forgot-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :invalid="Boolean(fieldErrors.email)"
          required
        />
      </ItField>

      <p v-if="globalError" class="it-field-error" role="alert">
        {{ globalError }}
      </p>

      <ItButton
        type="submit"
        variant="primary"
        block
        :loading="pending"
        :disabled="pending"
      >
        {{ pending ? t('auth.forgot.submitting') : t('auth.forgot.submit') }}
      </ItButton>
    </form>

    <div class="auth-links">
      <NuxtLink :to="localePath('/login')" class="it-link-accent">
        {{ t('auth.forgot.backToLogin') }}
      </NuxtLink>
    </div>
  </section>
</template>
