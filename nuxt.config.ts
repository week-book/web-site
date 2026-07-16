export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap', '@vite-pwa/nuxt'],
  ssr: true,
  runtimeConfig: {
    // Серверные значения — НЕ попадают в клиентский бандл.
    // Переопределяются через env: NUXT_POSTS_API_URL, NUXT_POSTS_API_KEY.
    postsApiUrl: 'https://api.week-book.ru',
    postsApiKey: '',
    public: {
      // Тело поста (.md) по-прежнему только на S3 — posts-api метаданные
      // отдаёт, контент нет (см. api-architecture.md). Используется теперь
      // только в pages/posts/[slug].vue по filename из ответа API.
      postsBaseUrl: 'https://s3.week-book.ru/posts',
    },
  },
  sitemap: {
    sitemapName: 'sitemap.xml',
    hosts: ['https://week-book.ru'],
    urls: async () => {
      // Переключено на posts-api (День 2 Sprint 3). Список теперь
      // пагинирован (limit/offset), поэтому обходим все страницы —
      // раньше index.json отдавал всё одним файлом.
      const apiUrl = process.env.NUXT_POSTS_API_URL ?? 'https://api.week-book.ru'
      const apiKey = process.env.NUXT_POSTS_API_KEY ?? ''
      const limit = 100
      let offset = 0
      const urls: { loc: string; lastmod?: string }[] = []

      while (true) {
        const res = await fetch(`${apiUrl}/posts?limit=${limit}&offset=${offset}`, {
          headers: { Authorization: `Bearer ${apiKey}` },
        })
        if (!res.ok) break
        const page: { posts: { slug: string; date?: string }[]; total: number } = await res.json()
        urls.push(...page.posts.map((p) => ({ loc: `/posts/${p.slug}`, lastmod: p.date })))
        offset += limit
        if (offset >= page.total || page.posts.length === 0) break
      }

      return urls
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
          // Метаданные постов теперь идут через собственный прокси-роут.
          urlPattern: /^\/api\/posts/,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'posts-api-proxy',
            expiration: { maxAgeSeconds: 60 * 60 * 24 },
          },
        },
        {
          // Осталось только под .md-файлы тела поста — index.json
          // через этот путь больше не запрашивается.
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
