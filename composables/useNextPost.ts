import type { ApiPost, ApiRelatedResponse } from '../types/apiPost'

const SESSION_LIMIT = 30

function extractPosts(raw: ApiRelatedResponse | null | undefined): ApiPost[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : (raw.posts ?? [])
}

/**
 * Логика "следующего поста" для бесшовной ленты (Sprint 4, День 2):
 * - выбор кандидата (related → фоллбэк на общую ленту по дате)
 * - защита от циклов через visitedSlugs (реактивный Set, живёт в состоянии
 *   страницы, НЕ localStorage — сбрасывается при новом заходе на сайт)
 * - лимит сессии в 30 постов
 */
export function useNextPost() {
  const visitedSlugs = reactive(new Set<string>())
  const celebrationShown = ref(false)

  const sessionCount = computed(() => visitedSlugs.size)
  const sessionLimitReached = computed(() => sessionCount.value >= SESSION_LIMIT)

  function markVisited(slug: string) {
    visitedSlugs.add(slug)
  }

  function isVisited(slug: string) {
    return visitedSlugs.has(slug)
  }

  /**
   * 1. related текущего поста (limit=10) — первый непосещённый кандидат
   * 2. фоллбэк — общая лента (GET /api/posts) по дате, минус посещённые
   * null — кандидатов не осталось (конец ленты, не то же самое, что
   * достижение лимита сессии — это отдельная проверка у вызывающего кода).
   */
  async function findNextSlug(currentSlug: string): Promise<string | null> {
    try {
      const related = await $fetch<ApiRelatedResponse>(`/api/posts/${currentSlug}/related`, {
        query: { limit: 10 },
      })
      const candidate = extractPosts(related).find((p) => !isVisited(p.slug))
      if (candidate) return candidate.slug
    } catch {
      // related недоступен/ошибка — не блокируем ленту, идём в фоллбэк
    }

    return findNextFromFeed()
  }

  async function findNextFromFeed(): Promise<string | null> {
    const pageSize = 20
    let offset = 0

    // Не больше 10 страниц (200 постов) переберём — защита от бесконечного цикла.
    for (let i = 0; i < 10; i++) {
      let page: { posts: ApiPost[]; total: number }
      try {
        page = await $fetch<{ posts: ApiPost[]; total: number }>('/api/posts', {
          query: { limit: pageSize, offset },
        })
      } catch {
        return null
      }

      const candidate = page.posts.find((p) => !isVisited(p.slug))
      if (candidate) return candidate.slug

      offset += pageSize
      if (offset >= page.total || page.posts.length === 0) return null
    }

    return null
  }

  return {
    visitedSlugs,
    sessionCount,
    sessionLimitReached,
    celebrationShown,
    markVisited,
    isVisited,
    findNextSlug,
  }
}
