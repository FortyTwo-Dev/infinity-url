<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { ApiProblem } from '~/lib/api/problem'

definePageMeta({ layout: 'auth', public: true, guestOnly: true })

const { t } = useI18n()
const localePath = useLocalePath()
const { message, fieldMessage } = useProblemMessage()

const email = ref('')
const password = ref('')
const pending = ref(false)
const done = ref(false)
const closed = ref(false)
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

  // A closed registration is not an error the user can fix: show the state,
  // not a form that will fail again.
  if (error instanceof ApiProblem && error.code === 'signups_closed') {
    closed.value = true

    return
  }

  globalError.value = message(error)
}

async function submit(): Promise<void> {
  globalError.value = null
  fieldErrors.value = {}
  pending.value = true

  try {
    await apiRequest('/auth/register', {
      method: 'POST',
      body: { email: email.value, password: password.value },
      auth: false,
    })

    done.value = true
  } catch (error) {
    applyProblem(error)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <section>
    <template v-if="closed">
      <h1 class="it-h1">
        {{ t('auth.signup.closedTitle') }}
      </h1>
      <p class="it-p">
        {{ t('auth.signup.closedBody') }}
      </p>
    </template>

    <template v-else-if="done">
      <h1 class="it-h1">
        {{ t('auth.signup.successTitle') }}
      </h1>
      <p class="it-p">
        {{ t('auth.signup.successBody') }}
      </p>
      <NuxtLink :to="localePath('/login')" class="it-link-accent">
        {{ t('auth.signup.loginLink') }}
      </NuxtLink>
    </template>

    <template v-else>
      <h1 class="it-h1">
        {{ t('auth.signup.title') }}
      </h1>
      <p class="it-lead">
        {{ t('auth.signup.subtitle') }}
      </p>

      <form class="auth-form" @submit.prevent="submit">
        <ItField
          :label="t('auth.signup.email')"
          html-for="signup-email"
          :error="fieldErrors.email"
        >
          <ItInput
            id="signup-email"
            v-model="email"
            type="email"
            autocomplete="email"
            :invalid="Boolean(fieldErrors.email)"
            required
          />
        </ItField>

        <ItField
          :label="t('auth.signup.password')"
          html-for="signup-password"
          :hint="t('auth.signup.passwordHint')"
          :error="fieldErrors.password"
        >
          <ItInput
            id="signup-password"
            v-model="password"
            type="password"
            autocomplete="new-password"
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
          {{ pending ? t('auth.signup.submitting') : t('auth.signup.submit') }}
        </ItButton>
      </form>

      <div class="auth-links">
        <NuxtLink :to="localePath('/login')" class="it-link-accent">
          {{ t('auth.signup.haveAccount') }} {{ t('auth.signup.loginLink') }}
        </NuxtLink>
      </div>
    </template>
  </section>
</template>
