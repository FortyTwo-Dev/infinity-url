<script setup lang="ts">
import { formatNumber } from '~/lib/format/number'
import type { DeviceRow } from '~/lib/stats/types'

const props = defineProps<{ devices: DeviceRow[] }>()

const { t } = useI18n()
const intlLocale = useIntlLocale()

const total = computed(() =>
  props.devices.reduce((sum, row) => sum + row.clicks, 0),
)

function label(device: string): string {
  const key = `stats.device${device.charAt(0).toUpperCase()}${device.slice(1)}`

  return t(key)
}

function share(clicks: number): string {
  if (total.value === 0) {
    return '0%'
  }

  return `${Math.round((clicks / total.value) * 100)}%`
}
</script>

<template>
  <ul v-if="devices.length > 0" class="device-list">
    <li v-for="row in devices" :key="row.device" class="device-row">
      <span class="device-row__label">{{ label(row.device) }}</span>
      <span class="device-row__value">
        {{ formatNumber(row.clicks, intlLocale) }} ({{ share(row.clicks) }})
      </span>
    </li>
  </ul>
  <p v-else class="it-small it-muted">
    {{ t('stats.empty') }}
  </p>
</template>
