import { fetchPostsApiPublic, PostsApiError } from '../../../utils/postsApi'

/**
 * Прокси POST /posts/:slug/views — единственный открытый эндпоинт posts-api,
 * ключ не нужен ни здесь, ни на upstream. Проксируем всё равно через сервер
 * (а не зовём posts-api прямо с клиента), чтобы домен API не был жёстко
 * зашит в клиентский бандл и весь трафик к posts-api шёл через один слой.
 *
 * Тело: { client_key: string } — генерируется и хранится на клиенте
 * (localStorage), см. sprint-3.md День 4. Сама реализация клиентской части
 * (генерация client_key, вызов при маунте страницы поста) — отдельная задача,
 * этот роут только готовит прокси заранее.
 */
export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) {
    throw createError({ statusCode: 400, statusMessage: 'slug is required' })
  }

  const body = await readBody<{ client_key?: string }>(event)
  if (!body?.client_key) {
    throw createError({ statusCode: 400, statusMessage: 'client_key is required' })
  }

  try {
    return await fetchPostsApiPublic(`/posts/${encodeURIComponent(slug)}/views`, {
      method: 'POST',
      body: { client_key: body.client_key },
    })
  } catch (err) {
    if (err instanceof PostsApiError) {
      throw createError({ statusCode: err.statusCode, statusMessage: err.message })
    }
    throw err
  }
})
