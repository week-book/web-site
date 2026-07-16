export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap', '@vite-pwa/nuxt'],
  ssr: true,
  runtimeConfig: {
    // Серверные значения — НЕ попадают в клиентский бандл.
    // Переопределяются через env: NUXT_POSTS_API_URL, NUXT_POSTS_API_KEY.
    postsApiUrl: 'https://api.week-book.ru',
    postsApiKey: '',
    public: {
      // Оставлено для обратной совместимости на время миграции (День 1 Sprint 3):
      // pages/index.vue и pages/posts/[slug].vue ещё бьют сюда напрямую.
      // Переключение — День 2 Sprint 3, после чего это поле убирается,
      // а вместе с ним и прямые обращения к s3.week-book.ru/posts из кода сайта.
      postsBaseUrl: 'https://s3.week-book.ru/posts',
    },
  },
  sitemap: {
    sitemapName: 'sitemap.xml',
    hosts: ['https://week-book.ru'],
    urls: async () => {
      // TODO (День 2 Sprint 3): переключить на /api/posts (прокси) вместо
      // прямого чтения index.json — см. sprint-3.md, задача 3.
      const res = await fetch('https://s3.week-book.ru/posts/index.json')
      const posts = await res.json()
      return posts.map((p: { slug: string; meta?: { date?: string } }) => ({
        loc: `/posts/${p.slug}`,
        lastmod: p.meta.date ?? undefined,
      }))
    },
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  pwa: {
    registerType: 'autoUpdate',
    manifest: {
      name: 'week-book',
      short_name: 'week-book',
      start_url: '/',
      display: 'standalone',
      background_color: '#ffffff',
      theme_color: '#ffffff',
      icons: [
        { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
    },
    workbox: {
      navigateFallback: '/',
      globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      runtimeCaching: [
        {
          urlPattern: /^https:\/\/week-book\.ru\/games/,
          handler: 'CacheFirst',
          options: {
            cacheName: 'games-page',
            expiration: { maxAgeSeconds: 60 * 60 * 24 * 30 },
          },
        },
        {
          // TODO (День 2 Sprint 3): заменить на паттерн /api/posts (прокси)
          // после переключения страниц — см. sprint-3.md, задача 3.
          urlPattern: /^https:\/\/s3\.week-book\.ru\/posts/,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 's3-posts',
            expiration: { maxAgeSeconds: 60 * 60 * 24 },
          },
        },
      ],
    },
  },
})
