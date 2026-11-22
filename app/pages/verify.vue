<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'

definePageMeta({ layout: 'auth', public: true })

const { t } = useI18n()
const localePath = useLocalePath()
const route = useRoute()
const { message, fieldMessage } = useProblemMessage()

const token = computed(() =>
  typeof route.query.token === 'string' ? route.query.token : '',
)

const state = ref<'verifying' | 'success' | 'invalid'>('verifying')
const email = ref('')
const resendPending = ref(false)
const resent = ref(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

onMounted(async () => {
  if (token.value === '') {
    state.value = 'invalid'

    return
  }

  try {
    await apiRequest('/auth/verify-email', {
      method: 'POST',
      body: { token: token.value },
      auth: false,
    })

    state.value = 'success'
  } catch {
    state.value = 'invalid'
  }
})

async function resend(): Promise<void> {
  resendPending.value = true
  resent.value = false
  globalError.value = null
  fieldErrors.value = {}

  try {
    await apiRequest('/auth/verification/resend', {
      method: 'POST',
      body: { email: email.value },
      auth: false,
    })

    resent.value = true
  } catch (error) {
    if (error instanceof ApiProblem) {
      for (const field of Object.keys(error.errors)) {
        fieldErrors.value[field] = fieldMessage(field)
      }
    }

    globalError.value = message(error)
  } finally {
    resendPending.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="it-h1">
      {{ t('auth.verify.title') }}
    </h1>

    <p v-if="state === 'verifying'" class="it-p">
      {{ t('auth.verify.verifying') }}
    </p>

    <template v-else-if="state === 'success'">
      <h2 class="it-h2">
        {{ t('auth.verify.successTitle') }}
      </h2>
      <p class="it-p">
        {{ t('auth.verify.successBody') }}
      </p>
      <NuxtLink :to="localePath('/login')" class="it-link-accent">
        {{ t('auth.verify.backToLogin') }}
      </NuxtLink>
    </template>

    <template v-else>
      <h2 class="it-h2">
        {{ t('auth.verify.invalidTitle') }}
      </h2>
      <p class="it-p">
        {{ t('auth.verify.invalidBody') }}
      </p>

      <form class="auth-form" @submit.prevent="resend">
        <ItField
          :label="t('auth.verify.resendTitle')"
          html-for="verify-email"
          :error="fieldErrors.email"
        >
          <ItInput
            id="verify-email"
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

        <p v-if="resent" class="it-small" role="status">
          {{ t('auth.verify.resendSuccess') }}
        </p>

        <ItButton
          type="submit"
          variant="primary"
          block
          :loading="resendPending"
          :disabled="resendPending"
        >
          {{ resendPending ? t('auth.verify.resending') : t('auth.verify.resendSubmit') }}
        </ItButton>
      </form>

      <div class="auth-links">
        <NuxtLink :to="localePath('/login')" class="it-link-accent">
          {{ t('auth.verify.backToLogin') }}
        </NuxtLink>
      </div>
    </template>
  </section>
</template>
