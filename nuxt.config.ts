// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  // Enable Nuxt 4 compatibility mode
  future: {
    compatibilityVersion: 4,
  },

  // Enable devtools
  devtools: { enabled: true },

  // Modules
  modules: [
    '@unocss/nuxt',
    'nuxt-auth-utils',
  ],

  // CSS reset for DaisyUI
  css: ['@unocss/reset/tailwind.css'],

  // Nitro configuration for server
  nitro: {
    experimental: {
      asyncContext: true,
    },
    // Serve uploads directory as static files
    publicAssets: [
      {
        dir: 'uploads',
        baseURL: '/uploads',
        maxAge: 60 * 60 * 24 * 7 // 7 days cache
      }
    ]
  },

  // Runtime config
  runtimeConfig: {
    // Database path
    dbPath: './lostandfound.db',
    // Auth secret (set via NUXT_SESSION_SECRET env var)
    session: {
      maxAge: 60 * 60 * 24 * 7, // 7 days
    },
  },

  compatibilityDate: '2025-12-17',
})
