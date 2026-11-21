## What

<what this PR does, in one to three sentences>

## Why

<the problem it solves, and the motivation>

## Testing

<the commands run, and what they showed>

## Invariants

Tick every line that applies, and leave the others unticked. An unticked line
that should be ticked is a reason to close the PR.

- [ ] No access token is written to `localStorage`, `sessionStorage`, IndexedDB
      or a cookie: it lives in memory only.
- [ ] The refresh cookie is never read by JavaScript — it is `HttpOnly`.
- [ ] No third-party script, font, analytics or embedded widget was added to any
      page, including marketing pages.
- [ ] The QR code is still generated client-side: no destination is sent to a
      third party.
- [ ] Any gated feature reads its capability from `GET /me`; no edition flag and
      no build-time switch.
- [ ] Every user-facing string is an i18n key, present in both `fr` and `en`.
- [ ] Each touched screen implements its four states: empty, loading, error,
      nominal.
- [ ] No `v-html` renders untrusted content.
- [ ] If a screen changed, `docs/14-ecrans.md` changed in the same PR.

## Decisions

- [ ] No settled decision was silently overridden.
- [ ] Or: the decision is recorded in the API repository's
      `docs/01-decisions.md`, with its reason.

## Notes

<breaking changes, follow-ups, open questions>
