import { describe, expect, it } from 'vitest'

import {
  addDays,
  currentIsoWeekRange,
  eachDay,
  fillDailySeries,
  rangeForDays,
  utcDay,
} from '~/lib/stats/range'

const NOW = new Date('2026-11-22T10:00:00Z')

describe('UTC ranges', () => {
  it('returns the seven UTC days ending today', () => {
    expect(rangeForDays(7, NOW)).toEqual({
      from: '2026-11-16',
      to: '2026-11-22',
    })
  })

  it('returns the thirty UTC days ending today', () => {
    expect(rangeForDays(30, NOW)).toEqual({
      from: '2026-10-24',
      to: '2026-11-22',
    })
  })

  it('starts the ISO week on Monday', () => {
    expect(currentIsoWeekRange(NOW)).toEqual({
      from: '2026-11-16',
      to: '2026-11-22',
    })
  })

  it('handles a Sunday and a Monday at the week boundary', () => {
    expect(currentIsoWeekRange(new Date('2026-11-23T10:00:00Z'))).toEqual({
      from: '2026-11-23',
      to: '2026-11-23',
    })
  })

  it('crosses a month and a year without losing a day', () => {
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(eachDay('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  it('reads the UTC day, not the local one', () => {
    expect(utcDay(new Date('2026-11-22T23:59:59Z'))).toBe('2026-11-22')
  })
})

describe('fillDailySeries', () => {
  it('fills the missing days with zero after reception', () => {
    expect(
      fillDailySeries(
        [
          { date: '2026-11-20', clicks: 2, uniques: 1 },
          { date: '2026-11-22', clicks: 1, uniques: 1 },
        ],
        '2026-11-20',
        '2026-11-22',
      ),
    ).toEqual([
      { date: '2026-11-20', clicks: 2, uniques: 1 },
      { date: '2026-11-21', clicks: 0, uniques: 0 },
      { date: '2026-11-22', clicks: 1, uniques: 1 },
    ])
  })

  it('returns a full zero series when the API has no bucket', () => {
    expect(fillDailySeries([], '2026-11-21', '2026-11-22')).toEqual([
      { date: '2026-11-21', clicks: 0, uniques: 0 },
      { date: '2026-11-22', clicks: 0, uniques: 0 },
    ])
  })
})
