import type { operations } from '~~/types/api'

export type StatsResponse =
  operations['linkStats.show']['responses'][200]['content']['application/json']
export type SeriesPoint = StatsResponse['series'][number]
export type DailyPoint = {
  date: string
  clicks: number
  uniques: number
}
export type WeeklyPoint = {
  iso_year: number
  iso_week: number
  week_start: string
  clicks: number
  uniques: number
}
export type DeviceRow = StatsResponse['devices'][number]

export function isDailyPoint(point: SeriesPoint): point is DailyPoint {
  return 'date' in point
}

export function isWeeklyPoint(point: SeriesPoint): point is WeeklyPoint {
  return 'week_start' in point
}
