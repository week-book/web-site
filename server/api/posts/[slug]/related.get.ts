import { fetchPostsApi, PostsApiError } from '../../../utils/postsApi'

/**
 * Прокси GET /posts/:slug/related. Готовим заранее (см. sprint-3.md, День 1:
 * "related — если понадобится заранее для будущего виджета"), сам виджет
 * после поста — отдельный, следующий спринт (см. "Не делать" в sprint-3.md).
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  try {
    return await fetchPostsApi(`/posts/${encodeURIComponent(slug)}/related`)
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
