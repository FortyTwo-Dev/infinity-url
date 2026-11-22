// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@pinia/nuxt', '@nuxt/eslint'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // The dashboard is a client-side application: the access token lives in
  // memory, so there is nothing to render on the server. The marketing pages
  // of S6 will move to route rules, not a second application.
  ssr: false,

  app: {
    head: {
      htmlAttrs: { class: 'it-theme' },
      meta: [{ name: 'robots', content: 'noindex, nofollow' }],
      script: [
        {
          // Set the mode before the first paint: stored choice, then system.
          innerHTML:
            "(function(){try{var k='iurl:theme',t=localStorage.getItem(k);"
            + "if(t!=='dark'&&t!=='light'){t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';}"
            + "document.documentElement.dataset.theme=t;}catch(e){}})();",
        },
      ],
    },
  },

  css: ['@infinitylib/infinity-theme', '~/assets/css/main.css'],

  runtimeConfig: {
    public: {
      apiBase: 'https://api.url.infinityproject.fr/v1',
    },
  },

  // The locale lives in the URL only: "/" is French, "/en/..." is English.
  // No cookie, no automatic redirect.
  i18n: {
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français', file: 'fr.json' },
      { code: 'en', language: 'en-GB', name: 'English', file: 'en.json' },
    ],
    detectBrowserLanguage: false,
  },
})
