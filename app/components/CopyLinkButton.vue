<script setup lang="ts">
const props = defineProps<{ value: string }>()

const { t } = useI18n()

const copied = ref(false)
const failed = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

async function copy(): Promise<void> {
  failed.value = false

  try {
    if (navigator.clipboard?.writeText !== undefined) {
      await navigator.clipboard.writeText(props.value)
    } else {
      fallbackCopy(props.value)
    }

    copied.value = true

    if (timer !== null) {
      clearTimeout(timer)
    }

    timer = setTimeout(() => {
      copied.value = false
    }, 2000)
  } catch {
    failed.value = true
  }
}

function fallbackCopy(value: string): void {
  const textarea = document.createElement('textarea')

  textarea.value = value
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  document.execCommand('copy')
  textarea.remove()
}

onBeforeUnmount(() => {
  if (timer !== null) {
    clearTimeout(timer)
  }
})
</script>

<template>
  <div class="copy-link">
    <code class="copy-link__value">{{ value }}</code>
    <ItButton variant="secondary" size="sm" @click="copy">
      {{ copied ? t('common.copied') : t('common.copy') }}
    </ItButton>
    <p v-if="failed" class="it-small it-field-error" role="alert">
      {{ t('common.copyError') }}
    </p>
  </div>
</template>
