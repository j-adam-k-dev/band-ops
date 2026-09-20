// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxt/ui'],
  css: ['~/assets/css/main.css'],

  // API base URLs are read at runtime so they can be overridden per environment
  // (e.g. in production) without a rebuild. Consumed by the Nitro proxy handlers
  // in server/routes/api/ — the browser only ever talks to the Nuxt origin, which
  // forwards to the two backend services (BFF pattern, sidesteps CORS).
  runtimeConfig: {
    coreApiUrl: process.env.CORE_API_URL || 'http://localhost:3001',
    notesApiUrl: process.env.NOTES_API_URL || 'http://localhost:3002',
  },
})
