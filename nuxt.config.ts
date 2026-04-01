export default defineNuxtConfig({
  modules: ['@pinia/nuxt', '@nuxtjs/sitemap'],
  ssr: true,
  runtimeConfig: {
    public: {
      postsBaseUrl: 'https://s3.week-book.ru/posts'
    }
  },
  sitemap: {
    sitemapName: 'sitemap.xml',
    hosts: ['https://week-book.ru'],
    urls: async () => {
      const res = await fetch('https://s3.week-book.ru/posts/index.json')
      const posts = await res.json()
      return posts.map((p: any) => ({
        loc: `/posts/${p.slug}`,
        lastmod: p.meta.date ?? undefined,
      }))
    }
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
