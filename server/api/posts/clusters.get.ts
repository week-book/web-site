import { fetchPostsApi, PostsApiError } from '../../utils/postsApi'

/**
 * Прокси GET /posts/clusters — список уникальных значений cluster
 * для UI-фильтра на главной (см. sprint-5.md, День 1).
 * Файл-роут статичный (clusters.get.ts), поэтому Nitro резолвит его
 * раньше динамического [slug].get.ts — конфликта маршрутов, как в chi,
 * здесь в принципе нет (роутинг не зависит от порядка регистрации).
 */
export default defineEventHandler(async () => {
  try {
    return await fetchPostsApi('/posts/clusters')
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
