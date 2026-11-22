<script setup lang="ts">
import { formatBucketDate, formatLongDate } from '~/lib/format/date'
import { formatNumber } from '~/lib/format/number'
import type { DailyPoint } from '~/lib/stats/types'

const props = defineProps<{
  points: DailyPoint[]
  from: string
  to: string
}>()

const { t } = useI18n()
const intlLocale = useIntlLocale()

const width = 600
const height = 200
const padding = 8

const maxClicks = computed(() =>
  Math.max(1, ...props.points.map((point) => point.clicks)),
)

const label = computed(() =>
  t('stats.chartLabel', {
    from: formatLongDate(props.from, intlLocale.value),
    to: formatLongDate(props.to, intlLocale.value),
  }),
)

function barWidth(): number {
  return props.points.length === 0 ? 0 : width / props.points.length
}

function barHeight(clicks: number): number {
  return (clicks / maxClicks.value) * (height - padding * 2)
}

function barX(index: number): number {
  return index * barWidth()
}

function barY(clicks: number): number {
  return height - padding - barHeight(clicks)
}

function tooltip(point: DailyPoint): string {
  return `${formatBucketDate(point.date, intlLocale.value)}: ${formatNumber(point.clicks, intlLocale.value)}`
}
</script>

<template>
  <figure v-if="points.length > 0" class="chart">
    <svg
      :viewBox="`0 0 ${width} ${height}`"
      role="img"
      :aria-label="label"
      preserveAspectRatio="none"
    >
      <line
        :x1="0"
        :y1="height - padding"
        :x2="width"
        :y2="height - padding"
        class="chart__baseline"
      />
      <rect
        v-for="(point, index) in points"
        :key="point.date"
        :x="barX(index)"
        :y="barY(point.clicks)"
        :width="Math.max(barWidth() * 0.82, 0.5)"
        :height="Math.max(barHeight(point.clicks), point.clicks > 0 ? 1 : 0)"
        class="chart__bar"
      >
        <title>{{ tooltip(point) }}</title>
      </rect>
    </svg>

    <div class="it-sr-only">
      <table>
        <caption>{{ t('stats.tableCaption') }}</caption>
        <thead>
          <tr>
            <th scope="col">{{ t('stats.columnDate') }}</th>
            <th scope="col">{{ t('stats.columnClicks') }}</th>
            <th scope="col">{{ t('stats.columnUniques') }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="point in points" :key="point.date">
            <td>{{ formatBucketDate(point.date, intlLocale) }}</td>
            <td>{{ formatNumber(point.clicks, intlLocale) }}</td>
            <td>{{ formatNumber(point.uniques, intlLocale) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </figure>
</template>
