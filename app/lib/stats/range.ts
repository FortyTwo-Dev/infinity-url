export interface DateRange {
  from: string
  to: string
}

/** The UTC calendar day of a date, as `YYYY-MM-DD`. */
export function utcDay(date: Date = new Date()): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(day: string, amount: number): string {
  const date = new Date(`${day}T00:00:00Z`)

  date.setUTCDate(date.getUTCDate() + amount)

  return utcDay(date)
}

/** The last `days` UTC days, including today. */
export function rangeForDays(days: number, now: Date = new Date()): DateRange {
  const to = utcDay(now)

  return { from: addDays(to, -(days - 1)), to }
}

/** The current ISO week, from Monday to today, both in UTC. */
export function currentIsoWeekRange(now: Date = new Date()): DateRange {
  const to = utcDay(now)
  const weekday = now.getUTCDay()
  const sinceMonday = (weekday + 6) % 7

  return { from: addDays(to, -sinceMonday), to }
}

/** Every UTC day between two inclusive bounds, in ascending order. */
export function eachDay(from: string, to: string): string[] {
  const days: string[] = []
  let current = from

  while (current <= to) {
    days.push(current)
    current = addDays(current, 1)
  }

  return days
}

/**
 * Complete a sparse daily series with zero buckets after reception. The API
 * only emits buckets with rows; an absent day is a real zero, but it must
 * never be invented before the response arrives.
 */
export function fillDailySeries(
  series: Array<{ date: string; clicks: number; uniques: number }>,
  from: string,
  to: string,
): Array<{ date: string; clicks: number; uniques: number }> {
  const byDate = new Map(series.map((point) => [point.date, point]))

  return eachDay(from, to).map((date) =>
    byDate.get(date) ?? { date, clicks: 0, uniques: 0 },
  )
}
