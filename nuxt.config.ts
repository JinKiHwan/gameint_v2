// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  runtimeConfig: {
    public: {
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      kakaoRestApiKey: process.env.NUXT_PUBLIC_KAKAO_REST_API_KEY
    }
  },
  modules: [
    '@pinia/nuxt',
    '@vite-pwa/nuxt'
  ],
  app: {
    head: {
      title: 'GAMEINT',
      meta: [
        { name: 'theme-color', content: '#1E88E5' },
        { name: 'apple-mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' }
      ],
      link: [
        { rel: 'apple-touch-icon', href: '/icon-192.png' },
        { rel: 'icon', type: 'image/png', href: '/icon-192.png' }
      ]
    }
  },
  pwa: {
    manifest: {
      name: 'GAMEINT',
      short_name: 'GAMEINT',
      description: '독서 그 이상의 경험, 게임인 독서 클럽',
      theme_color: '#1E88E5',
      background_color: '#FFFFFF',
      icons: [
        {
          src: '/icon-192.png',
          sizes: '192x192',
          type: 'image/png',
          purpose: 'any maskable'
        },
        {
          src: '/icon-512.png',
          sizes: '512x512',
          type: 'image/png',
          purpose: 'any maskable'
        }
      ]
    },
    workbox: {
      navigateFallback: '/'
    },
    devOptions: {
      enabled: true,
      type: 'module'
    }
  },
  css: ['~/assets/scss/main.scss'],
  vite: {
    css: {
      preprocessorOptions: {
        scss: {
          // 모든 파일에서 변수, 믹스인 자동 주입
          additionalData: `@use "~/assets/scss/_variables.scss" as *;`
        }
      }
    }
  }
})
