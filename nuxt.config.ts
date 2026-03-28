export default defineNuxtConfig({
  modules: ['@pinia/nuxt'],
  ssr: true,
  runtimeConfig: {
    public: {
      postsBaseUrl: 'https://s3.week-book.ru/posts'
    }
  },
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true }
})
