<script setup lang="ts">
import type { LinkDisplayStatus } from '~/lib/links/status'

const props = defineProps<{ status: LinkDisplayStatus }>()
const { t } = useI18n()
</script>

<template>
  <span class="status-badge" :data-status="props.status">
    {{ t(`links.status.${props.status}`) }}
  </span>
</template>
