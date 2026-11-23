# Infinity URL — Dashboard

Le dashboard et le site public d'Infinity URL : Nuxt 4, Vue 3, TypeScript. Le
dashboard consomme le **même contrat public** que `iQuiz` ou un tiers ; il
n'existe aucun endpoint privé.

## Périmètre

- Dashboard authentifié : liste, création, détail, édition et suppression des
  liens, statistiques, export CSV, QR généré dans le navigateur, réglages du
  compte.
- Authentification : inscription, vérification d'email, connexion (dont TOTP et
  codes de récupération), réinitialisation du mot de passe.
- Public : `/report`, `/abuse`, `/legal/*`, `/en/legal/*`, `/` et `/en`.
- Les écrans et leurs quatre états sont décrits dans `docs/14-ecrans.md`. Les
  décisions du dashboard sont dans `docs/decisions/0003-s4-dashboard.md`, celles
  du signalement dans `0004-s5-abuse.md`, celles du légal dans `0005-s6-legal.md`.

## Pages légales

Les six documents sont `/legal/notice`, `/legal/terms`, `/legal/aup`,
`/legal/privacy`, `/legal/subcontractors` et `/legal/client-clause`.

- La prose légale vit dans `app/lib/legal/fr.ts`, un module typé
  (`title`, `updatedAt`, `sections[]` avec `heading` et `paragraphs[]`). Ce n'est
  pas un libellé d'interface : elle n'est pas dans `i18n/locales/*.json`.
- Les catalogues ne portent que `legal.nav.*`, `legal.updated`, `legal.back` et
  `legal.englishNotice`.
- Les textes sont **français uniquement**. `/en/legal/*` sert le même texte
  français avec l'avertissement traduit et `lang="fr"` sur le document ; le
  français fait foi.
- Les pages sont rendues côté serveur et prérendues (`routeRules`). Elles
  portent `robots: index, follow`, ne posent aucun cookie et ne chargent aucun
  tiers.
- Le pied de page du layout public et celui du dashboard portent les six liens,
  plus `/abuse`, `/report` et le lien « Code source ».

## Démarrer

```sh
bun install
cp .env.example .env          # NUXT_PUBLIC_API_BASE
bun run dev                   # http://localhost:3000
```

Pour un démarrage sur le port manuel 3003 :

```sh
bun run dev --port 3003
```

L'API doit tourner sur `http://localhost:8000` avec :

```sh
DASHBOARD_URL=http://localhost:3003
LINK_HOST=iurl.fr
LINK_URL=
QUEUE_CONNECTION=sync
```

Pour tester un clic en local avec un vrai hostname, utilise plutôt
`LINK_HOST=iurl.test` et `LINK_URL=http://iurl.test:8002`, ajoute
`127.0.0.1 iurl.test` à ton `/etc/hosts`, et lance l'API sur le port 8002.
L'URL courte affichée devient `http://iurl.test:8002/{slug}`, cliquable.

Mailpit est disponible sur <http://localhost:8025>. L'API de développement et
la base e2e sont décrites dans le dépôt `infinity-url-api`.

## Construire et prévisualiser

```sh
bun run build
bun run preview
```

Le build prérend les pages publiques : `/`, `/en`, `/abuse`, `/en/abuse`, les
six routes `/legal/*` et leurs six équivalents `/en/legal/*`. Le HTML produit
est dans `.output/public/` ; il est indexable et ne contient pas de cookie.

## Vérifier

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run types:check
```

`bun run test` couvre les composables, les stores, les composants et le module
de contenu légal. Les parcours Playwright couvrent l'inscription jusqu'aux
statistiques, la création par API avec un Bearer, le signalement anonyme, les
pages légales et l'accueil marketing.

### E2E

```sh
./scripts/e2e.sh
```

Le script utilise une base API dédiée (`infinity_url_e2e`), PostgreSQL, Valkey
et Mailpit réels, l'API sur `http://localhost:8000` et le site construit sur
`http://localhost:3002`. Il ne touche ni à la base de développement, ni au port
3000, ni au port 8001.

Si le checkout API n'est pas à côté du dépôt :

```sh
INFINITY_URL_API_DIR=/chemin/vers/infinity-url-api ./scripts/e2e.sh
```

L'API E2E tourne avec `ABUSE_CHECK_ENABLED=false` pour que la vérification de
destination ne dépende pas du réseau du runner. Playwright attend un build de
Chromium précis : installe-le avec `./node_modules/.bin/playwright install
chromium`, ou épingle un binaire existant dans
`PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

## Contrat

Les types viennent d'`openapi.json` :

```sh
bun run types:api       # types/openapi.json -> types/api.d.ts
bun run types:check     # échoue si le fichier généré a dérivé
```

Le fichier `types/openapi.json` est un instantané du contrat de l'API. La CI
régénère les types et échoue sur un diff.

## Invariants

- Aucun jeton d'accès en stockage persistant : il vit en mémoire dans le store
  Pinia. Le refresh est un cookie `HttpOnly` géré par le navigateur. La
  préférence de thème (`iurl:theme`) est un stockage local d'affichage, jamais
  transmise.
- Aucun script tiers, aucune police externe, aucun analytics, aucun pixel.
- Aucun cookie sur les pages publiques (`/`, `/report`, `/abuse`, `/legal/*`).
- Le QR est généré localement avec `@infinitylib/iqrcode-wasm`.
- Toutes les chaînes visibles sont des clés `fr` et `en`, sauf la prose légale,
  qui est du contenu français dans `app/lib/legal/fr.ts`.
- Les uniques ne s'additionnent pas ; les seaux sont en UTC.

## Licence

AGPL-3.0-only. Voir `LICENSE`.
