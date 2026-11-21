// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  modules: ['@nuxtjs/i18n', '@pinia/nuxt'],

  compatibilityDate: '2025-07-15',

  devtools: { enabled: true },

  // The locale lives in the URL only: "/" is French, "/en/..." is English.
  // No cookie, no automatic redirect.
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
