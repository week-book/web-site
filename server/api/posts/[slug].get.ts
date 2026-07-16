import { fetchPostsApi, PostsApiError } from '../../utils/postsApi'

/**
 * Прокси GET /posts/:slug. 404 от posts-api пробрасывается как есть —
 * страница поста сама решает, что показать (см. pages/posts/[slug].vue).
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  try {
    return await fetchPostsApi(`/posts/${encodeURIComponent(slug)}`)
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
