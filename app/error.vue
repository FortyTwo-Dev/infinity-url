<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const { t } = useI18n()
const localePath = useLocalePath()

const status = computed(() => props.error.statusCode ?? 500)

const title = computed(() => {
  if (status.value === 403) {
    return t('errors.page.forbiddenTitle')
  }

  if (status.value === 404) {
    return t('errors.page.notFoundTitle')
  }

  return t('errors.page.serverErrorTitle')
})

const body = computed(() => {
  if (status.value === 403) {
    return t('errors.page.forbiddenBody')
  }

  if (status.value === 404) {
    return t('errors.page.notFoundBody')
  }

  return t('errors.page.serverErrorBody')
})

function goHome(): void {
  clearError({ redirect: localePath('/links') })
}
</script>

<template>
  <div class="auth-shell">
    <div class="auth-card">
      <h1 class="it-h2">
        {{ title }}
      </h1>
      <p class="it-p">
        {{ body }}
      </p>
      <ItButton variant="primary" @click="goHome">
        {{ t('errors.page.backHome') }}
      </ItButton>
    </div>
  </div>
</template>
