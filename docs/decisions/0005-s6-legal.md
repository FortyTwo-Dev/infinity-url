# ADR-0005 : S6 legal pages and public marketing

- **Status** : `proposed`
- **Date** : 2026-11-23

## Validation

| Field        | Value |
|--------------|-------|
| Validated    | no |
| Validated by | [À FOURNIR : validateur] |
| Validated on | [À FOURNIR : date] |

## Context

S6 adds six legal documents and a public home page to the dashboard repository.
The API repository fixes the facts in `docs/03`, `docs/04`, `docs/06`, `docs/15`
and `docs/16`, and its ADR 0004 records the claim-to-source audit. This ADR
records the front-end choices.

Three constraints shape them. The legal texts are French only: they bind the
publisher, and the English version is not normative in S6. The repository rule
says every visible string is an i18n key. The `/` route used to read the session
and redirect to `/login` or `/links`; the marketing page must be public,
indexable and independent of any session.

The S5 ADR already established the rendering mechanism: `ssr: true` globally,
`/**` in `ssr: false`, and per-route overrides. The legal pages and the home page
must follow it and be prerendered, not assumed to be.

## Decision

- **The legal prose lives in `app/lib/legal/fr.ts`.** It is a typed content
  module (`title`, `updatedAt`, `sections[]` with `heading` and `paragraphs[]`),
  not an i18n catalog. The catalogs keep only `legal.nav.*`, `legal.updated`,
  `legal.back` and `legal.englishNotice`. This is an explicit exception to "every
  visible string is a key": prose is content, and duplicating it in `fr.json` and
  `en.json` would create two sources of truth.
- **The six documents are `/legal/notice`, `/legal/terms`, `/legal/aup`,
  `/legal/privacy`, `/legal/subcontractors` and `/legal/client-clause`.** A
  dynamic page renders the module; an unknown slug answers `404`. The page
  declares `robots: index, follow`, uses the public layout and adds no data.
- **French only, with a translated notice on the English routes.**
  `/en/legal/*` renders the same French text, sets `htmlAttrs.lang = 'fr'` and
  shows `legal.englishNotice` on an element with `lang="en"`. The notice says the
  French version prevails. The marketing page, unlike the legal texts, is
  translated in both catalogs.
- **The legal and home pages are server-rendered and prerendered.** `routeRules`
  sets `ssr: true, prerender: true` for `/`, `/en`, `/legal/**` and
  `/en/legal/**`. Nitro also receives the concrete routes: a wildcard prerender
  rule does not enumerate a dynamic route. `/report` stays server-rendered on
  demand. The generated HTML is opened and checked, not assumed.
- **The `/` session redirect disappears.** The home page is a public
  presentation: product, promises, free v0.1 offer without SLA, and entry links.
  It does not import the auth store, does not call the API and does not set a
  cookie. `/en` is the English marketing page. The "Sign in" link replaces the
  automatic redirect.
- **The footer is the legal navigation.** The shared footer, used by the public,
  dashboard and auth layouts, carries the six documents, `/abuse`, `/report` and
  the source link. `/abuse` also links to the AUP and the privacy policy.
- **No third party, no cookie on the public pages.** The legal and marketing
  pages load the first-party Nuxt bundle and the existing theme initializer, which
  reads `iurl:theme` from `localStorage`. The privacy policy discloses that
  preference. No external font, script, pixel or analytics is added.
- **The tests pin the promises.** A unit test checks the content shape, the six
  slugs and the absence of placeholders. Playwright checks server rendering,
  `robots: index, follow`, the absence of a cookie and of a third-party request,
  the 360 px layout, the English notice, the footer links and the absence of the
  old redirect. The S5 report assertion is scoped to the main content because the
  footer now carries a second report link.
- **The local E2E suite runs on port 3002.** The Playwright server, the API
  `DASHBOARD_URL` and the helper defaults use 3002, leaving the user's port 3000
  free. CI keeps its own 3000 through `E2E_BASE_URL`.

## Consequences

- A legal text change requires a deploy: the pages are prerendered. That is
  acceptable for documents that change less often than the application.
- The content module is long and is not translated. A future English version
  would need a new decision, a new source of truth and a review of the "French
  version prevails" notice.
- The legal pages carry the first-party theme initializer and its `localStorage`
  preference. The privacy policy discloses it; removing the toggle would not
  remove the dashboard's need for the same disclosure.
- The English legal routes are not a translation. A reader who needs the English
  text is told that the French version is the only normative one.
- The marketing page is bilingual and indexable; the legal pages are
  French-only and indexable. Both are prerendered and free of session access.
- The shared footer changes the DOM of every screen, including the S5 pages. The
  report test now scopes its link assertion to `main`.

## Rejected alternatives

- **Put the legal prose in `fr.json` and `en.json`.** Rejected: two copies, two
  translations, and a prose edit that becomes an i18n change.
- **Translate the legal texts into English in S6.** Rejected: the French text is
  the only normative version, and a translation would create a second authority
  before a legal review.
- **Keep the `/` session redirect.** Rejected: the mission makes `/` a public,
  indexable presentation, and the "Sign in" link covers the authenticated user.
- **Rely on `/legal/**` with `prerender: true` alone.** Rejected after the build:
  the wildcard renders the pages but does not enumerate the dynamic routes, so the
  concrete routes are listed in `nitro.prerender.routes`.
- **Remove the theme toggle from the legal pages.** Rejected: the dashboard uses
  the same preference, so the privacy policy would still have to disclose it. The
  toggle stays and the policy says what it does.
- **Add a third-party consent or legal-page widget.** Rejected: a third party on
  a legal page contradicts the product's own promise and the no-third-party rule.

## Validation gate

The ADR stays `proposed` and no page is merged until the user has reviewed the
French texts, the liability and governing-law wording, and the identity data.
The API ADR 0004 holds the claim-to-source table and the remaining open
questions.
