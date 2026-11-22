<script setup lang="ts">
defineProps<{ message: string }>()

const emit = defineEmits<{ retry: [] }>()
const { t } = useI18n()
</script>

<template>
  <div class="error-banner" role="alert">
    <p class="it-p">
      {{ message }}
    </p>
    <ItButton variant="secondary" size="sm" @click="emit('retry')">
      {{ t('common.retry') }}
    </ItButton>
  </div>
</template>
