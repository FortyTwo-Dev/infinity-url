/** Format an RFC 3339 timestamp in UTC, for the given Intl locale. */
export function formatDateTime(value: string | null, locale: string): string | null {
  if (value === null || value === '') {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeZone: 'UTC',
  }).format(date)
}

/** Format a `YYYY-MM-DD` bucket as a UTC calendar day. */
export function formatBucketDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(date)
}

/** Format a `YYYY-MM-DD` bucket as a long UTC day, for the CSV note. */
export function formatLongDate(value: string, locale: string): string {
  const date = new Date(`${value}T00:00:00Z`)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'long',
    timeZone: 'UTC',
  }).format(date)
}

/** Convert an RFC 3339 instant to a `datetime-local` value in local time. */
export function toLocalDateTimeInput(value: string | null): string {
  if (value === null || value === '') {
    return ''
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000)

  return local.toISOString().slice(0, 16)
}

/** Convert a `datetime-local` value to an RFC 3339 instant, or null. */
export function fromLocalDateTimeInput(value: string): string | null {
  if (value === '') {
    return null
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

