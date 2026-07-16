import { fetchPostsApi, PostsApiError } from '../../utils/postsApi'

/**
 * Прокси GET /posts. Пробрасывает limit/offset/tag как есть —
 * валидацию диапазонов делает сам posts-api (см. api.md: вне диапазона → 20).
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)

  try {
    return await fetchPostsApi('/posts', {
      query: {
        limit: query.limit,
        offset: query.offset,
        tag: query.tag,
      },
    })
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
