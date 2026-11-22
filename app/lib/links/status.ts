export type LinkDisplayStatus = 'active' | 'disabled' | 'blocked' | 'expired'

/**
 * The API stores `active|disabled|blocked`; expiration is derived until the
 * expiration job exists (ADR-0002 known gap). A link whose `expires_at` is
 * past answers 410 even when its stored status is still active.
 */
export function displayStatus(
  link: { status: string; expires_at: string | null },
  now: number = Date.now(),
): LinkDisplayStatus {
  if (link.status === 'blocked') {
    return 'blocked'
  }

  if (link.status === 'disabled') {
    return 'disabled'
  }

  if (link.expires_at !== null) {
    const expiresAt = Date.parse(link.expires_at)

    if (!Number.isNaN(expiresAt) && expiresAt <= now) {
      return 'expired'
    }
  }

  return 'active'
}
