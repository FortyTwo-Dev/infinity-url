import { describe, expect, it } from 'vitest'

import {
  formatBucketDate,
  formatDateTime,
  formatLongDate,
} from '~/lib/format/date'
import { formatNumber } from '~/lib/format/number'
import { truncate } from '~/lib/format/text'

describe('date formatting', () => {
  it('formats an RFC 3339 instant in UTC for both locales', () => {
    expect(formatDateTime('2026-11-22T23:30:00Z', 'fr-FR')).toBe('22 nov. 2026')
    expect(formatDateTime('2026-11-22T23:30:00Z', 'en-GB')).toBe('22 Nov 2026')
  })

  it('returns null for a missing or invalid date', () => {
    expect(formatDateTime(null, 'fr-FR')).toBeNull()
    expect(formatDateTime('not-a-date', 'fr-FR')).toBeNull()
  })

  it('formats a bucket as a UTC day, never shifted by the local timezone', () => {
    expect(formatBucketDate('2026-11-22', 'fr-FR')).toBe('22 nov.')
    expect(formatLongDate('2026-11-22', 'en-GB')).toBe('22 November 2026')
  })
})

describe('number formatting', () => {
  it('uses the locale grouping', () => {
    expect(formatNumber(1234, 'en-GB')).toBe('1,234')
    expect(formatNumber(1234, 'fr-FR')).toMatch(/^1\s234$/)
  })
})

describe('truncate', () => {
  it('leaves a short value untouched and truncates a long one to 40 characters', () => {
    expect(truncate('https://example.com/a', 40)).toBe('https://example.com/a')
    expect(truncate('https://example.com/' + 'a'.repeat(60), 40)).toHaveLength(40)
    expect(truncate('https://example.com/' + 'a'.repeat(60), 40).endsWith('…')).toBe(true)
  })
})
