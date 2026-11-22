import { describe, expect, it } from 'vitest'

import { displayStatus } from '~/lib/links/status'

const NOW = Date.parse('2026-11-22T10:00:00Z')

describe('displayStatus', () => {
  it('keeps the stored active status when the expiration is in the future', () => {
    expect(
      displayStatus(
        { status: 'active', expires_at: '2026-11-23T10:00:00Z' },
        NOW,
      ),
    ).toBe('active')
  })

  it('derives expired from a past expiration even when the stored status is active', () => {
    expect(
      displayStatus(
        { status: 'active', expires_at: '2026-11-21T10:00:00Z' },
        NOW,
      ),
    ).toBe('expired')
  })

  it('keeps disabled and blocked above the expiration check', () => {
    expect(
      displayStatus(
        { status: 'disabled', expires_at: '2026-11-21T10:00:00Z' },
        NOW,
      ),
    ).toBe('disabled')
    expect(
      displayStatus(
        { status: 'blocked', expires_at: null },
        NOW,
      ),
    ).toBe('blocked')
  })

  it('ignores an invalid expiration string', () => {
    expect(
      displayStatus({ status: 'active', expires_at: 'not-a-date' }, NOW),
    ).toBe('active')
  })
})
