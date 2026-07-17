import { fetchPostsApi, PostsApiError } from '../../../utils/postsApi'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  const query = getQuery(event)

  try {
    return await fetchPostsApi(`/posts/${encodeURIComponent(slug)}/related`, {
      query: { limit: query.limit },
    })
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
