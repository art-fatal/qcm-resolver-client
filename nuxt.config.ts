import Aura from '@primeuix/themes/aura';
import tailwindcss from "@tailwindcss/vite";

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-05-15',
  devtools: { enabled: true },

  devServer: {
    port: 3033
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/fonts',
    '@nuxt/icon',
    '@nuxt/ui',
    '@primevue/nuxt-module'
  ],

  runtimeConfig: {
    public: {
      socketUrl: process.env.NUXT_PUBLIC_SOCKET_URL || 'http://localhost:3000'
    }
  },

  primevue: {
    components: {
      include: ['Card', 'Button', 'ProgressSpinner', 'Tag', 'Message', 'Toast']
    },
    options: {
      theme: {
        preset: Aura      ,
          options: {
          prefix: 'p',
          darkModeSelector: false,
          cssLayer: false
      }
      }
    }
  },
  vite: {
    plugins: [
      tailwindcss(),
    ],
  },
  css: ['~/assets/css/main.css']
})