export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap', '@vite-pwa/nuxt'],
  ssr: true,
  runtimeConfig: {
    public: {
      postsBaseUrl: 'https://s3.week-book.ru/posts',
    },
  },
  sitemap: {
    sitemapName: 'sitemap.xml',
    hosts: ['https://week-book.ru'],
    urls: async () => {
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
      start_url: '/games',
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
