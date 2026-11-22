<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { useAuthStore } from '~/stores/auth'

const auth = useAuthStore()
const { t } = useI18n()
const { message } = useProblemMessage()

const pending = ref(false)
const sent = ref(false)
const error = ref<string | null>(null)

async function resend(): Promise<void> {
  if (auth.user?.email == null) {
    return
  }

  pending.value = true
  sent.value = false
  error.value = null

  try {
    await apiRequest('/auth/verification/resend', {
      method: 'POST',
      body: { email: auth.user.email },
      auth: false,
    })

    sent.value = true
  } catch (cause) {
    error.value = message(cause)
  } finally {
    pending.value = false
  }
}
</script>

<template>
  <div class="notice" role="status">
    <p class="it-p">
      <strong>{{ t('auth.resendBanner.title') }}</strong>
      {{ t('auth.resendBanner.body') }}
    </p>
    <p v-if="sent" class="it-small">
      {{ t('auth.resendBanner.sent') }}
    </p>
    <p v-if="error" class="it-field-error" role="alert">
      {{ error }}
    </p>
    <ItButton
      variant="secondary"
      size="sm"
      :loading="pending"
      :disabled="pending"
      @click="resend"
    >
      {{ t('auth.resendBanner.action') }}
    </ItButton>
  </div>
</template>
