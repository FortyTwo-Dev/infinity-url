<script setup lang="ts">
import { apiRequest } from '~/lib/api/client'
import { formatLongDate } from '~/lib/format/date'
import { formatNumber } from '~/lib/format/number'
import { downloadStatsCsv } from '~/lib/stats/csv'
import {
  currentIsoWeekRange,
  fillDailySeries,
  rangeForDays,
} from '~/lib/stats/range'
import { isDailyPoint, isWeeklyPoint } from '~/lib/stats/types'
import type { DailyPoint, StatsResponse } from '~/lib/stats/types'

const props = defineProps<{ linkId: string }>()

const { t } = useI18n()
const { message } = useProblemMessage()
const intlLocale = useIntlLocale()

const preset = ref<7 | 30>(7)
const daily = ref<StatsResponse | null>(null)
const weekly = ref<StatsResponse | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const exporting = ref(false)
const exportError = ref<string | null>(null)

const range = computed(() => rangeForDays(preset.value))

const points = computed<DailyPoint[]>(() => {
  if (daily.value === null) {
    return []
  }

  return fillDailySeries(
    daily.value.series.filter(isDailyPoint),
    daily.value.from,
    daily.value.to,
  )
})

const clicks = computed(() => daily.value?.summary.clicks ?? null)

const todayUniques = computed<number | null>(() => {
  if (daily.value === null) {
    return null
  }

  return points.value.find((point) => point.date === daily.value?.to)?.uniques ?? 0
})

const weekUniques = computed<number | null>(() => {
  if (weekly.value === null) {
    return null
  }

  const series = weekly.value.series.filter(isWeeklyPoint)
  const last = series[series.length - 1]

  return last === undefined ? null : last.uniques
})

const isEmpty = computed(() =>
  daily.value !== null && daily.value.summary.clicks === 0,
)

function setPreset(value: 7 | 30): void {
  preset.value = value
}

async function load(): Promise<void> {
  loading.value = true
  error.value = null
  exportError.value = null

  const bounds = range.value
  const week = currentIsoWeekRange()
  const base = `/links/${encodeURIComponent(props.linkId)}/stats?`

  const [dailyResult, weeklyResult] = await Promise.allSettled([
    apiRequest<StatsResponse>(
      `${base}${new URLSearchParams({
        from: bounds.from,
        to: bounds.to,
        interval: 'day',
      }).toString()}`,
    ),
    apiRequest<StatsResponse>(
      `${base}${new URLSearchParams({
        from: week.from,
        to: week.to,
        interval: 'week',
      }).toString()}`,
    ),
  ])

  if (dailyResult.status === 'rejected') {
    daily.value = null
    weekly.value = null
    error.value = message(dailyResult.reason)
    loading.value = false

    return
  }

  daily.value = dailyResult.value
  weekly.value = weeklyResult.status === 'fulfilled' ? weeklyResult.value : null
  loading.value = false
}

async function exportCsv(): Promise<void> {
  if (daily.value === null) {
    return
  }

  exporting.value = true
  exportError.value = null

  try {
    await downloadStatsCsv(
      props.linkId,
      new URLSearchParams({
        from: daily.value.from,
        to: daily.value.to,
        interval: daily.value.interval,
      }),
    )
  } catch (cause) {
    exportError.value = message(cause)
  } finally {
    exporting.value = false
  }
}

onMounted(load)
watch(preset, () => {
  void load()
})
</script>

<template>
  <section class="stats">
    <header class="stats__header">
      <h2 class="it-h2">
        {{ t('stats.title') }}
      </h2>
      <div class="stats__ranges">
        <ItButton
          size="sm"
          :variant="preset === 7 ? 'primary' : 'secondary'"
          @click="setPreset(7)"
        >
          {{ t('stats.range7') }}
        </ItButton>
        <ItButton
          size="sm"
          :variant="preset === 30 ? 'primary' : 'secondary'"
          @click="setPreset(30)"
        >
          {{ t('stats.range30') }}
        </ItButton>
      </div>
    </header>

    <template v-if="loading">
      <div class="stats__summary">
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.totalClicks') }}</span>
          <strong>{{ t('common.dash') }}</strong>
        </div>
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.uniquesToday') }}</span>
          <strong>{{ t('common.dash') }}</strong>
        </div>
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.uniquesWeek') }}</span>
          <strong>{{ t('common.dash') }}</strong>
        </div>
      </div>
      <div class="stats__skeleton" role="status">
        <span class="it-sr-only">{{ t('common.loading') }}</span>
      </div>
    </template>

    <ErrorBanner v-else-if="error" :message="error" @retry="load" />

    <template v-else-if="daily">
      <div class="stats__summary">
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.totalClicks') }}</span>
          <strong>{{ formatNumber(clicks ?? 0, intlLocale) }}</strong>
        </div>
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.uniquesToday') }}</span>
          <strong>{{ todayUniques === null ? t('common.dash') : formatNumber(todayUniques, intlLocale) }}</strong>
        </div>
        <div class="stats__value">
          <span class="it-small it-muted">{{ t('stats.uniquesWeek') }}</span>
          <strong>{{ weekUniques === null ? t('common.dash') : formatNumber(weekUniques, intlLocale) }}</strong>
        </div>
      </div>

      <p class="it-small it-muted">
        {{ t('stats.uniquesNotSummed') }}
      </p>

      <p v-if="daily.clamped" class="it-small">
        {{ t('stats.clamped', { days: daily.retention_days }) }}
        {{ t('stats.effectiveRange', {
          from: formatLongDate(daily.from, intlLocale),
          to: formatLongDate(daily.to, intlLocale),
        }) }}
      </p>

      <p v-if="weekUniques === null" class="it-small it-muted">
        {{ t('stats.weeklyUnavailable') }}
      </p>

      <p v-if="isEmpty" class="it-p">
        {{ t('stats.empty') }}
      </p>

      <template v-else>
        <ClicksChart :points="points" :from="daily.from" :to="daily.to" />

        <h3 class="it-h3">
          {{ t('stats.devicesTitle') }}
        </h3>
        <DeviceBreakdown :devices="daily.devices" />
      </template>

      <div class="stats__export">
        <ItButton
          variant="secondary"
          size="sm"
          :loading="exporting"
          :disabled="exporting"
          @click="exportCsv"
        >
          {{ exporting ? t('stats.exporting') : t('stats.exportCsv') }}
        </ItButton>
        <p v-if="exportError" class="it-field-error" role="alert">
          {{ exportError }}
        </p>
      </div>
    </template>
  </section>
</template>
