/**
 * client_key — случайный идентификатор читателя для dedup просмотров
 * на стороне posts-api (см. api.md: TTL 18ч, POST /posts/:slug/views).
 * Генерируется один раз и переиспользуется из localStorage.
 * Только клиент — на SSR localStorage недоступен, вызывать из onMounted.
 */
const STORAGE_KEY = 'wb_client_key'

export function useClientKey(): string {
  if (typeof window === 'undefined') {
    // Не должно вызываться на сервере, но на всякий случай не падаем.
    return ''
  }

  const existing = window.localStorage.getItem(STORAGE_KEY)
  if (existing) return existing

  const generated =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`

  window.localStorage.setItem(STORAGE_KEY, generated)
  return generated
}
