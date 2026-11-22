# ADR-0003 : S4 dashboard choices

- **Status** : `accepted`
- **Date** : 2026-11-22

## Validation

| Field        | Value |
|--------------|-------|
| Validated    | yes |
| Validated by | FortyTwo-Dev |
| Validated on | 2026-11-22 |

## Context

S4 is the dashboard of Infinity URL: the authenticated shell, the minimal
account flow without which no session exists, the link list, creation, detail,
editing, deletion, statistics and the client-side QR code. `docs/14-ecrans.md`
fixes the screens, `docs/10-api.md` fixes the HTTP contract and
`docs/decisions/0002-s3-analytics.md` fixes the statistics shape.

Several points were left open, and two constraints shape all of them. The
access token must never reach persistent storage (D-45), and the API rotates
the refresh token with replay detection: a parallel refresh revokes the whole
family, so the dashboard must serialise it. The API also exposes the link list
without click counters, and a list of counters cannot be built by calling
`/stats` once per row.

The S0 foundation of this repository was incomplete at the start of S4: no
theme package, no QR WASM package, no test runner, no linter, no `AGENTS.md`.
The foundation commits are therefore part of S4, not a separate step.

## Decision

- **The dashboard is a client-side application.** `ssr: false` and a global
  `noindex` for S4. The access token lives in memory, so there is nothing to
  render on the server. S6 will reintroduce hybrid rendering with route rules
  for the marketing pages, not with a second application.
- **Session model.** The access token is a `ref` in a Pinia setup store, never
  written to `localStorage`, `sessionStorage`, IndexedDB or a JavaScript
  cookie. Boot calls `POST /auth/refresh` with `credentials: 'include'`; the
  refresh cookie is `__Host-iurl_refresh`, `HttpOnly`, and is never read by
  JavaScript. A `401` triggers **one** refresh through a single shared promise,
  then **one** replay of the request. A refused refresh clears the state and
  sends the user to `/login`. A refused logout keeps the local session and
  surfaces the error: pretending to log out while the cookie survives would
  log the user back in at the next boot.
- **Error contract.** The UI translates the stable `code` through
  `errors.codes.<code>`. The English `detail` is never displayed. The
  per-field `errors` map only identifies the fields; the visible text comes
  from `errors.fields.<field>` in both catalogs, so French never falls back to
  a Laravel sentence. A non-problem body maps to `server_error`, and a network
  failure to `network_error`.
- **Capabilities drive access.** `GET /me` returns `capabilities`. The nav
  entry and the route both depend on `links:read` or `links:write`; a missing
  capability is a redirect to the localized 403 page, never a greyed button.
  Sub-blocks follow the same rule: statistics need `stats:read`, the QR needs
  `qr`, editing and deletion need `links:write`.
- **i18n lives in the URL only.** `prefix_except_default`, `/` is French,
  `/en/...` is English, no cookie and no browser detection. The language
  switcher uses `switchLocalePath` and preserves the current route. Every
  visible string, including `aria-label`, `title` and error copy, is a key
  present in `fr` and `en`; a unit test compares the two flattened catalogs.
- **The list sorts by date only in v0.1.** The API only offers
  `sort=created_at|-created_at`, and `clicks_7d` is computed per page: sorting
  a page by clicks would reorder an incomplete set. The clicks sort is
  deferred and `docs/14` is amended. Search is debounced and only sent from
  two characters, because the API rejects one. Pagination is cursor-based
  "load more", never an offset and never a client-built cursor.
- **`clicks_7d` is an opt-in list field.** `GET /links?include=clicks_7d` adds
  the sum of `link_stats_daily.clicks` for the seven UTC days ending today,
  zero when the link has no row. The API computes it for the whole page in one
  aggregate query; the dashboard never calls `/stats` per row. Without the
  parameter the response is unchanged, which keeps `LinkCrudTest` green.
- **The detail screen needs two statistics calls.** `interval=day` feeds the
  chart, the click total and the uniques of the day. `interval=week`, bounded
  from the current ISO Monday to today, feeds the uniques of the week. The
  API does not expose weekly uniques in the daily series, and S4 does not
  change the statistics contract. Uniques are never summed: the screen shows
  per-bucket values and says so.
- **Buckets are UTC, display is localized.** The chart's missing days are
  filled with zero only after the response arrives, between the effective
  `from` and `to`. A click at 00:30 local time therefore counts on the
  previous UTC day; this is documented rather than hidden. `clamped: true`
  shows the effective bounds and a discreet note.
- **CSV is downloaded with `fetch`.** The access token cannot travel in an
  `<a href>`, so the export fetches the blob with the same `from`, `to` and
  `interval` as the displayed panel, reads the filename from
  `Content-Disposition`, and triggers a local download. The CSV is the raw
  series, one row per bucket with data, as the API contract specifies; the
  chart's zero-fill is a display concern and is not written back into the
  export.
- **The chart is a hand-written SVG.** No chart dependency. It renders bars
  with an accessible label and a visually hidden table, and is tested at zero,
  one and one thousand points. The statistics-empty state replaces the chart
  with a sentence; a loading state shows a skeleton and em dashes, never
  fabricated zeros.
- **The QR code is generated locally.** `@infinitylib/iqrcode-wasm` is
  initialised lazily with its local `.wasm` asset, and the matrix is rendered
  to a canvas and to a standalone SVG. PNG and SVG are downloaded from a blob;
  no destination or slug leaves the browser. The QR is shown for every status,
  with a badge and the response the link domain gives (`410` expired or
  deleted, `403` blocked), because a QR of a dead link is a trap if it is not
  labelled.
- **Creation lands on the detail screen**, not on the list: the short URL, the
  QR and the first statistics are the reason the link was created.
- **The theme follows the shared package, with a local toggle.** The dashboard
  honours `@infinitylib/infinity-theme` light and dark modes (D-76) with a
  button in the authenticated and auth headers. The choice is stored in
  `localStorage` under `iurl:theme`, falls back to `prefers-color-scheme`, and
  is applied by an inline script before the first paint so a reload never
  flashes the other mode. It is a display preference, never a token and never
  sent anywhere; the access token still lives in memory only.
- **Local short URLs use an optional API base.** The API accepts `LINK_URL`
  (`http://iurl.test:8001` locally) and builds `short_url` from it; the default
  stays `https://{host}`, so production is unchanged. The developer adds
  `127.0.0.1 iurl.test` to `/etc/hosts` and can click the displayed short URL
  without touching the public `iurl.fr` domain. The API test suite pins
  `LINK_HOST=iurl.fr` and an empty `LINK_URL`.
- **OpenAPI is vendored.** The API exports `openapi.json`; the dashboard
  commits a copy in `types/openapi.json` and generates `types/api.d.ts` with
  `openapi-typescript`. CI regenerates the types and fails on a diff. Fetching
  the spec from the deployment at CI time would couple the dashboard to a
  live service and make the check non-deterministic. The S4 API change adds
  the item schema and the `include` parameter, so the generated list type is
  real rather than `unknown`.
- **E2E uses the real API.** Playwright runs two journeys (signup → Mailpit →
  verification → login → creation → click → statistics, and an API creation
  with a Bearer plus the `RateLimit-*` and problem shapes). The first journey
  ends with the 360 px checks on the list, the creation form and the detail.
  The click is a real browser navigation: Chromium maps `iurl.fr` to
  `127.0.0.1` and the test visits `http://iurl.fr:8000/{slug}`; Laravel
  matches the host without the port, so the redirect route answers.
  `scripts/e2e.sh` prepares a disposable `infinity_url_e2e` database, clears
  the Valkey cache (the registration limiter allows two accounts per IP per
  day), starts the API with a synchronous queue so a click is counted before
  the statistics assertion, and runs the two journeys. CI checks out the
  public API repository, starts PostgreSQL, Valkey and Mailpit as services,
  and repeats the same preparation.
- **The foundation dependencies are pinned**: the theme (CSS and Vue
  wrappers), the QR WASM package, Vitest, `@nuxt/test-utils`, happy-dom,
  Playwright, `openapi-typescript` and ESLint. No chart, icon, date or
  persistence package is added.

## Consequences

- **Positive**: a stolen access token has a fifteen-minute life and no disk
  trace; a refresh burst cannot revoke its own family; the list stays one API
  request per page; a failed logout never fakes success; the stats screen
  cannot accidentally add uniques; the QR and the chart work offline and call
  no third party; the generated types catch contract drift between the two
  repositories.
- **Negative**: the S4 branch carries the S0 foundation, so its first commits
  are infrastructure rather than screens; the detail screen pays two
  statistics requests; zero-filling makes the chart differ from the CSV row
  count; the E2E setup needs a PHP toolchain and a cloned API repository.
- **Trade-offs**: `ssr: false` is global for one step, with S6 moving the
  marketing pages to route rules; the E2E click relies on a Chromium resolver
  rule rather than a public DNS entry; the vendored OpenAPI file is refreshed
  manually when the API changes, and its CI check only proves the generated
  types match the vendored spec.

## Rejected alternatives

- **An access token in `localStorage` or `sessionStorage`**: survives the tab,
  readable by any script, contradicts D-45 and the privacy promise.
- **A refresh per `401`, without single-flight**: two parallel requests revoke
  the refresh family; the API detects the replay and logs the user out.
- **Clearing the local session when logout fails**: the `HttpOnly` cookie
  survives, so the next boot silently restores the session.
- **Displaying `detail` or the raw `errors` strings**: English fragments in a
  French interface, and a dependency on server wording that `docs/10` keeps
  out of the contract.
- **Sorting by clicks on the client**: wrong as soon as the list has more than
  one page; the API would need an aggregate and an index.
- **A `stats` call per list row**: one request per link, the exact N+1 the S4
  API field exists to avoid.
- **A chart library**: a new dependency for a few hundred lines of SVG, with
  its own bundle and accessibility story.
- **Composing `short_url` from the slug**: the domain belongs to the API
  response; composing it would break on any future domain.
- **An `<a href>` for the CSV**: the Bearer cannot be attached to a navigation.
- **One `/stats` call and summing daily uniques**: uniques are not additive
  (D-34), and no total of uniques exists in the API.
- **Fetching `openapi.json` from the deployed API in CI**: non-deterministic,
  network-dependent, and red when the API is down.
- **A QR editor (logo, colours) or a server-side QR**: out of v0.1 and, for the
  server, it would send the destination to us for rendering.

## Known gaps (out of S4)

- The destination blocklist codes (`destination_blocked`,
  `destination_private_address`) arrive with S5; the catalogs already carry
  their translations, but no S4 test can produce them.
- The link expiration job is not implemented; the dashboard derives "expired"
  from `expires_at` past and shows `410`, which matches `ResolveLink`.
- `/settings/*`, `/report`, `/legal/*`, custom domains, country statistics,
  account deletion, API tokens and password/2FA management screens are out of
  S4.
- The UI organization and final validation are **S7**, after the last v0.1
  dashboard screen (settings); S4 leaves the layouts functional and the design
  tokens shared. S7 creates no screen and changes no contract.
- The clicks sort and the custom-domain selector remain deferred; `docs/14`
  is amended to say so.

## References

- **Project dossier**: `docs/14-ecrans.md`, `docs/10-api.md` §3 to §9,
  `docs/01-decisions.md` (D-24, D-34, D-41, D-45, D-77, D-80, D-89, D-103,
  D-104, D-105, D-108, D-112, D-114, D-115, D-117, D-119, D-120, D-127,
  D-134), `docs/09-tests.md` §3, `docs/06-lia.md`, `docs/12-uml.md` §5.1 and
  §6.3.
- **API decisions**: `docs/decisions/0002-s3-analytics.md` (statistics shape,
  `clicks_7d` as an opt-in list field, one query, no uniques total).
- **Implementation references**: `@infinitylib/infinity-theme`,
  `@infinitylib/iqrcode-wasm`, the Nuxt `@nuxtjs/i18n` URL strategy, and the
  Playwright `--host-resolver-rules` mechanism.
