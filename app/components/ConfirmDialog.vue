<script setup lang="ts">
const props = defineProps<{
  open: boolean
  title: string
  body: string
  confirmLabel: string
  pending?: boolean
  error?: string | null
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

const { t } = useI18n()
const dialog = ref<HTMLDialogElement | null>(null)

watch(
  () => props.open,
  (open) => {
    if (open) {
      dialog.value?.showModal()

      return
    }

    dialog.value?.close()
  },
)

onBeforeUnmount(() => {
  dialog.value?.close()
})
</script>

<template>
  <dialog ref="dialog" class="confirm-dialog" @cancel.prevent="emit('cancel')">
    <h2 class="it-h3">
      {{ title }}
    </h2>
    <p class="it-p">
      {{ body }}
    </p>
    <p v-if="error" class="it-field-error" role="alert">
      {{ error }}
    </p>
    <div class="confirm-actions">
      <ItButton variant="secondary" @click="emit('cancel')">
        {{ t('common.cancel') }}
      </ItButton>
      <ItButton
        variant="danger"
        :loading="pending"
        :disabled="pending"
        @click="emit('confirm')"
      >
        {{ confirmLabel }}
      </ItButton>
    </div>
  </dialog>
</template>
