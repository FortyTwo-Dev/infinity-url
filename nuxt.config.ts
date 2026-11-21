// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@pinia/nuxt'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // La langue vit uniquement dans l'URL : « / » est le français, « /en/… »
  // l'anglais. Aucun cookie, aucune redirection automatique (D-104).
  i18n: {
    defaultLocale: 'fr',
    strategy: 'prefix_except_default',
    locales: [
      { code: 'fr', language: 'fr-FR', name: 'Français' },
      { code: 'en', language: 'en-GB', name: 'English' },
    ],
    detectBrowserLanguage: false,
  },
})
