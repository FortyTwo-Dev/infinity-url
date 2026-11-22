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

const password = ref('')
const pending = ref(false)
const done = ref(false)
const invalid = ref(token.value === '')
const globalError = ref<string | null>(null)
const fieldErrors = ref<Record<string, string>>({})

async function submit(): Promise<void> {
  if (token.value === '') {
    invalid.value = true

    return
  }

  pending.value = true
  globalError.value = null
  fieldErrors.value = {}

  try {
    await apiRequest('/auth/password/reset', {
      method: 'POST',
      body: { token: token.value, password: password.value },
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
      {{ t('auth.reset.title') }}
    </h1>

    <template v-if="done">
      <h2 class="it-h2">
        {{ t('auth.reset.successTitle') }}
      </h2>
      <p class="it-p">
        {{ t('auth.reset.successBody') }}
      </p>
      <NuxtLink :to="localePath('/login')" class="it-link-accent">
        {{ t('auth.forgot.backToLogin') }}
      </NuxtLink>
    </template>

    <template v-else-if="invalid">
      <h2 class="it-h2">
        {{ t('auth.reset.invalidTitle') }}
      </h2>
      <p class="it-p">
        {{ t('auth.reset.invalidBody') }}
      </p>
      <NuxtLink :to="localePath('/forgot')" class="it-link-accent">
        {{ t('auth.forgot.submit') }}
      </NuxtLink>
    </template>

    <template v-else>
      <p class="it-lead">
        {{ t('auth.reset.subtitle') }}
      </p>

      <form class="auth-form" @submit.prevent="submit">
        <ItField
          :label="t('auth.reset.password')"
          html-for="reset-password"
          :hint="t('auth.reset.passwordHint')"
          :error="fieldErrors.password"
        >
          <ItInput
            id="reset-password"
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
          {{ pending ? t('auth.reset.submitting') : t('auth.reset.submit') }}
        </ItButton>
      </form>
    </template>
  </section>
</template>
