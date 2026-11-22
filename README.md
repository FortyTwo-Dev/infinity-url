# Infinity URL — Dashboard

Le dashboard d'Infinity URL : Nuxt 4, Vue 3, TypeScript. Il consomme le **même
contrat public** que `iQuiz` ou un tiers ; il n'existe aucun endpoint privé.

## Périmètre

S4 couvre le shell authentifié, l'inscription et la vérification d'email, la
connexion (dont TOTP et codes de récupération), la réinitialisation du mot de
passe, la liste, la création, le détail, l'édition et la suppression des liens,
les statistiques, l'export CSV et le QR généré dans le navigateur.

Les écrans et leurs quatre états sont décrits dans `docs/14-ecrans.md`. Les
décisions du dashboard sont dans
`docs/decisions/0003-s4-dashboard.md`.

## Démarrer

```sh
bun install
cp .env.example .env
bun run dev
```

L'API doit tourner sur `http://localhost:8000` avec :

```sh
DASHBOARD_URL=http://localhost:3000
LINK_HOST=iurl.fr
LINK_URL=
QUEUE_CONNECTION=sync
```

Pour tester un clic en local avec un vrai hostname, utilise plutôt
`LINK_HOST=iurl.test` et `LINK_URL=http://iurl.test:8001`, ajoute
`127.0.0.1 iurl.test` à ton `/etc/hosts`, et lance l'API sur le port 8001.
L'URL courte affichée devient `http://iurl.test:8001/{slug}`, cliquable.

Mailpit est disponible sur <http://localhost:8025>. L'API de développement et
la base e2e sont décrites dans le dépôt `infinity-url-api`.

## Vérifier

```sh
bun run lint
bun run typecheck
bun run test
bun run build
bun run test:e2e        # voir scripts/e2e.sh pour l'API réelle
```

`bun run test` couvre les composables, les stores et les composants. Les deux
parcours Playwright couvrent l'inscription jusqu'aux statistiques, puis une
création par API avec un Bearer, les en-têtes `RateLimit-*` et la forme
`application/problem+json`.

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
  préférence de thème clair/sombre est locale et n'est jamais envoyée.
- Aucun script tiers, aucune police externe, aucun analytics.
- Le QR est généré localement avec `@infinitylib/iqrcode-wasm`.
- Toutes les chaînes visibles sont des clés `fr` et `en`.
- Les uniques ne s'additionnent pas ; les seaux sont en UTC.

## Licence

AGPL-3.0-only. Voir `LICENSE`.
