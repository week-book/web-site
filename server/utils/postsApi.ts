/**
 * Тонкий серверный клиент к posts-api.
 * Ключ и базовый URL берутся из серверного runtimeConfig (не public) —
 * никогда не попадают в клиентский бандл. См. sprint-3.md, День 1.
 */

interface PostsApiErrorPayload {
  error?: string
}

export class PostsApiError extends Error {
  statusCode: number

  constructor(statusCode: number, message: string) {
    super(message)
    this.statusCode = statusCode
  }
}

function client() {
  const config = useRuntimeConfig()
  const baseURL = config.postsApiUrl
  const apiKey = config.postsApiKey

  if (!baseURL) {
    throw new PostsApiError(500, 'postsApiUrl не задан в runtimeConfig')
  }

  return { baseURL, apiKey }
}

/**
 * Запрос к защищённым эндпоинтам (GET /posts, /posts/:slug, /posts/:slug/related).
 * Авторизация — Authorization: Bearer <key>, формат подтверждён api.md.
 */
export async function fetchPostsApi<T>(
  path: string,
  opts: {
    query?: Record<string, unknown>
    method?: 'GET' | 'POST' | 'DELETE'
    body?: unknown
  } = {},
): Promise<T> {
  const { baseURL, apiKey } = client()

  if (!apiKey) {
    throw new PostsApiError(500, 'postsApiKey не задан в runtimeConfig')
  }

  try {
    return await $fetch<T>(path, {
      baseURL,
      method: opts.method ?? 'GET',
      query: opts.query,
      body: opts.body,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  } catch (err) {
    throw mapError(err)
  }
}

/**
 * Запрос к единственному открытому эндпоинту (POST /posts/:slug/views) —
 * без ключа, так задумано в api-architecture.md.
 */
export async function fetchPostsApiPublic<T>(
  path: string,
  opts: { method?: 'GET' | 'POST'; body?: unknown } = {},
): Promise<T> {
  const { baseURL } = client()

  try {
    return await $fetch<T>(path, {
      baseURL,
      method: opts.method ?? 'GET',
      body: opts.body,
    })
  } catch (err) {
    throw mapError(err)
  }
}

/**
 * Приводит ошибку $fetch к PostsApiError с сохранённым статусом,
 * не пробрасывая тело/детали upstream-ответа наружу без необходимости.
 */
function mapError(err: unknown): PostsApiError {
  const fetchErr = err as {
    response?: { status?: number; _data?: PostsApiErrorPayload }
    message?: string
  }
  const status = fetchErr?.response?.status ?? 502
  const message =
    fetchErr?.response?._data?.error ?? fetchErr?.message ?? 'posts-api request failed'
  return new PostsApiError(status, message)
}
