# ADR-0004 : S5 abuse pages

- **Status** : `accepted`
- **Date** : 2026-11-23

## Validation

| Field        | Value |
|--------------|-------|
| Validated    | yes |
| Validated by | FortyTwo-Dev |
| Validated on | 2026-11-23 |

## Context

S5 adds two public screens to the dashboard repository: `/report`, the anonymous
report form, and `/abuse`, the operational procedure page. `docs/14-ecrans.md`
fixes their content, the API fixes the contract (`POST /v1/report`), and three
constraints shape the implementation: the pages must be reachable without a
session and without a cookie, they must be indexable while the rest of the
application is `noindex`, and no third party may be contacted.

The S4 ADR chose `ssr: false` globally, with the promise that S6 would
reintroduce hybrid rendering. S5 already needs it: an abuse page that requires
JavaScript to display a contact address is a broken abuse channel.

## Decision

- **SSR is enabled globally, and `/**` turns it off route by route.** Per-route
  `ssr: true` under a global `ssr: false` was tried first and does not work:
  the build prerendered `/abuse` as an empty SPA shell. The inverse works, so
  `ssr: true` is the default and `routeRules['/**'].ssr = false` keeps the
  dashboard and the auth screens client-side. `/report` and `/en/report` are
  rendered on demand; `/abuse` and `/en/abuse` are prerendered. The S4
  behaviour of the dashboard is unchanged.
- **The public layout is separate.** `layouts/public.vue` carries the product
  name, the locale switcher, the theme toggle and the footer, and nothing
  else: no authenticated shell, no navigation entry, no capability. A missing
  capability cannot hide these pages because they depend on none.
- **The middleware never touches the session on a public route.** For
  `meta.public`, it returns immediately on the server and skips the bootstrap
  entirely unless the route is `guestOnly`. `/report` therefore makes no
  `POST /auth/refresh`, sets no cookie and depends on no store. `guestOnly`
  keeps its S4 meaning on `/login` and `/signup`, client-side only.
- **The two pages override the global `noindex`** with
  `useSeoMeta({ robots: 'index, follow' })`. The prerendered HTML was checked:
  it contains the page text and a single `robots` meta with `index, follow`.
- **The report call is anonymous by construction.** A dedicated
  `app/lib/api/report.ts` uses `fetch` with `credentials: 'omit'`, no bearer,
  no refresh and no retry. The shared client cannot be used here: it sends the
  refresh cookie by default, and retrying on `401` makes no sense for a public
  endpoint.
- **The form follows the three interface rules of `docs/14`.** No checkbox, no
  consent, no third-party CAPTCHA; the honeypot is off-screen, `aria-hidden`
  and `tabindex="-1"`, so it is neither seen nor announced; the confirmation
  gives a reference and "within 48 hours" without saying whether the link
  exists. The optional email is presented as optional, with the anonymity
  sentence visible rather than in a tooltip. A network failure keeps every
  field.
- **Errors are translated by stable code.** `errors.fields.category` and
  `errors.fields.details` are added to both catalogs, `signups_closed` gets a
  dedicated closed state on `/signup` instead of a failing form, and
  `account_suspended` is translated so the create form explains why the action
  is refused. The English `detail` is never displayed.
- **No third-party request, no cookie.** The E2E journey records every request
  and asserts that only the application host and the API host are contacted,
  and that `context.cookies()` is empty after a report.

## Consequences

- The server renderer is part of every build, even for a mostly client-side
  application. Components used by the dashboard must not assume `window` at
  module scope; the theme plugin already no-ops on the server.
- `/abuse` is frozen at build time: a change to the procedure requires a
  deploy. That is acceptable for a page that changes less often than the
  application.
- The E2E job still checks out `develop` for the API by default. Until the S5
  API is merged, the report journey requires the repository variable
  `API_REF=feat/s5-abuse`; otherwise the job fails on a missing endpoint.
- The AUP is not written here. `/abuse` describes the procedure; the acceptable
  use policy is S6, and the page says so implicitly by not pretending to be a
  contract.
