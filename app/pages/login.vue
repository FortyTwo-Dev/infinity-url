<script setup lang="ts">
import { ApiProblem } from '~/lib/api/problem'
import { useAuthStore } from '~/stores/auth'

definePageMeta({ layout: 'auth', public: true, guestOnly: true })

const { t } = useI18n()
const localePath = useLocalePath()
const auth = useAuthStore()
const { message, fieldMessage } = useProblemMessage()

const email = ref('')
const password = ref('')
const code = ref('')
const recovery = ref(false)
const step = ref<'credentials' | 'totp'>('credentials')
const challenge = ref<string | null>(null)
const pending = ref(false)
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

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

async function submitCredentials(): Promise<void> {
  globalError.value = null
  fieldErrors.value = {}
  pending.value = true

  try {
    const outcome = await auth.login({
      email: email.value,
      password: password.value,
    })

    if (outcome.totpRequired) {
      challenge.value = outcome.challenge
      step.value = 'totp'

      return
    }

    await navigateTo(localePath('/links'))
  } catch (error) {
    applyProblem(error)
  } finally {
    pending.value = false
  }
}

async function submitCode(): Promise<void> {
  if (challenge.value === null) {
    return
  }

  globalError.value = null
  fieldErrors.value = {}
  pending.value = true

  try {
    if (recovery.value) {
      await auth.verifyRecoveryCode(challenge.value, code.value)
    } else {
      await auth.verifyTotp(challenge.value, code.value)
    }

    await navigateTo(localePath('/links'))
  } catch (error) {
    applyProblem(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section>
    <h1 class="it-h1">
      {{ step === 'credentials' ? t('auth.login.title') : t('auth.login.totpTitle') }}
    </h1>
    <p class="it-lead">
      {{ step === 'credentials' ? t('auth.login.subtitle') : t('auth.login.totpHint') }}
    </p>

    <form
      v-if="step === 'credentials'"
      class="auth-form"
      @submit.prevent="submitCredentials"
    >
      <ItField
        :label="t('auth.login.email')"
        html-for="login-email"
        :error="fieldErrors.email"
      >
        <ItInput
          id="login-email"
          v-model="email"
          type="email"
          autocomplete="email"
          :invalid="Boolean(fieldErrors.email)"
          required
        />
      </ItField>

      <ItField
        :label="t('auth.login.password')"
        html-for="login-password"
        :error="fieldErrors.password"
      >
        <ItInput
          id="login-password"
          v-model="password"
          type="password"
          autocomplete="current-password"
          :invalid="Boolean(fieldErrors.password)"
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
        {{ pending ? t('auth.login.submitting') : t('auth.login.submit') }}
      </ItButton>
    </form>

    <form v-else class="auth-form" @submit.prevent="submitCode">
      <ItField
        :label="recovery ? t('auth.login.recoveryCode') : t('auth.login.code')"
        html-for="login-code"
        :error="fieldErrors.code ?? fieldErrors.recovery_code"
      >
        <ItInput
          id="login-code"
          v-model="code"
          type="text"
          autocomplete="one-time-code"
          :invalid="Boolean(fieldErrors.code ?? fieldErrors.recovery_code)"
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
        {{ pending ? t('auth.login.verifying') : t('auth.login.verify') }}
      </ItButton>

      <ItButton
        type="button"
        variant="link"
        @click="recovery = !recovery"
      >
        {{ recovery ? t('auth.login.useTotp') : t('auth.login.useRecovery') }}
      </ItButton>
    </form>

    <div class="auth-links">
      <NuxtLink :to="localePath('/signup')" class="it-link-accent">
        {{ t('auth.login.noAccount') }} {{ t('auth.login.signupLink') }}
      </NuxtLink>
      <NuxtLink :to="localePath('/forgot')" class="it-link-accent">
        {{ t('auth.login.forgotLink') }}
      </NuxtLink>
    </div>
  </section>
</template>
