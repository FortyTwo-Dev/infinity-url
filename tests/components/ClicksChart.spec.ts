import { mountSuspended } from '@nuxt/test-utils/runtime'
import { describe, expect, it } from 'vitest'

import ClicksChart from '~/components/ClicksChart.vue'

type Point = { date: string; clicks: number; uniques: number }

const points: Point[] = [
  { date: '2026-11-20', clicks: 3, uniques: 2 },
  { date: '2026-11-21', clicks: 5, uniques: 4 },
]

function mountChart(chartPoints: Point[], from = '2026-11-20', to = '2026-11-21') {
  return mountSuspended(ClicksChart, {
    props: { points: chartPoints, from, to },
  })
}

function thousandPoints(): Point[] {
  return Array.from({ length: 1000 }, (_, index) => ({
    date: new Date(Date.UTC(2025, 0, 1) + index * 86_400_000)
      .toISOString()
      .slice(0, 10),
    clicks: index,
    uniques: Math.floor(index / 2),
  }))
}

describe('ClicksChart', () => {
  it('renders no chart at all without a point', async () => {
    const wrapper = await mountChart([])

    expect(wrapper.find('svg').exists()).toBe(false)
    expect(wrapper.findAll('rect.chart__bar')).toHaveLength(0)
  })

  it('draws one bar and one accessible table row for one point', async () => {
    const wrapper = await mountChart([points[0] as Point])

    const bars = wrapper.findAll('rect.chart__bar')

    expect(bars).toHaveLength(1)

    const rows = wrapper.findAll('tbody tr')

    expect(rows).toHaveLength(1)

    const cells = rows[0]?.findAll('td').map((cell) => cell.text()) ?? []

    expect(cells).toHaveLength(3)
    expect(cells[0] ?? '').toMatch(/\d/)
    expect(cells[1]).toBe('3')
    expect(cells[2]).toBe('2')
  })

  it('draws a bar per point for a thousand points without failing', async () => {
    const wrapper = await mountChart(thousandPoints())

    expect(wrapper.findAll('rect.chart__bar')).toHaveLength(1000)
    expect(wrapper.findAll('tbody tr')).toHaveLength(1000)
  })

  it('exposes the chart as one labelled image', async () => {
    const wrapper = await mountChart(points)

    const svg = wrapper.find('svg')

    expect(svg.attributes('role')).toBe('img')
    expect(svg.attributes('aria-label')).toBeTruthy()
    expect(svg.attributes('aria-label')).toContain('Clics par jour')
  })
})
