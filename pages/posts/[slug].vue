<script setup lang="ts">
import type { ApiPost, ApiRelatedResponse } from '../../types/apiPost'

interface LoadedPost {
  slug: string
  post: ApiPost
  html: string
  related: ApiPost[]
  viewCounted: boolean
}

function stripFrontmatter(md: string): string {
  return md.replace(/^---[\s\S]*?---\n?/, '')
}

const { marked } = await import('marked')

const route = useRoute()
const config = useRuntimeConfig()
const initialSlug = String(route.params.slug)

// Первый пост — как и раньше, SSR useFetch (SEO, og-теги, прямые переходы
// по /posts/:slug должны работать независимо от бесшовного режима).
const { data: firstPost, error: postError } = await useFetch<ApiPost>(
  () => `/api/posts/${initialSlug}`,
)
const { data: firstMarkdown, error: markdownError } = await useFetch<string>(
  () => (firstPost.value ? `${config.public.postsBaseUrl}/${firstPost.value.filename}` : null),
  { watch: [firstPost] },
)
const { data: firstRelatedRaw } = await useFetch<ApiRelatedResponse>(
  () => (firstPost.value ? `/api/posts/${initialSlug}/related` : null),
  { query: { limit: 10 }, watch: [firstPost] },
)

function extractRelated(raw: ApiRelatedResponse | null | undefined): ApiPost[] {
  if (!raw) return []
  return Array.isArray(raw) ? raw : (raw.posts ?? [])
}

const notFound = computed(() => postError.value?.statusCode === 404)
const loading = computed(() => !firstPost.value && !postError.value)
const error = computed(() =>
  postError.value && !notFound.value
    ? 'Не удалось загрузить пост.'
    : markdownError.value
      ? 'Не удалось загрузить текст поста.'
      : null,
)

const {
  sessionLimitReached,
  celebrationShown,
  markVisited,
  findNextSlug,
} = useNextPost()

const loadedPosts = ref<LoadedPost[]>([])
const loadingNext = ref(false)
const feedExhausted = ref(false)

watch(
  firstPost,
  (value) => {
    if (!value || loadedPosts.value.length) return
    loadedPosts.value = [
      {
        slug: initialSlug,
        post: value,
        html: firstMarkdown.value ? (marked(stripFrontmatter(firstMarkdown.value)) as string) : '',
        related: extractRelated(firstRelatedRaw.value),
        viewCounted: false,
      },
    ]
    markVisited(initialSlug)
  },
  { immediate: true },
)

async function appendNextPost() {
  if (loadingNext.value || feedExhausted.value || sessionLimitReached.value) return
  const last = loadedPosts.value[loadedPosts.value.length - 1]
  if (!last) return

  loadingNext.value = true
  try {
    const nextSlug = await findNextSlug(last.slug)
    if (!nextSlug) {
      feedExhausted.value = true
      return
    }

    const nextPost = await $fetch<ApiPost>(`/api/posts/${nextSlug}`)
    const nextMarkdown = await $fetch<string>(`${config.public.postsBaseUrl}/${nextPost.filename}`)

    let nextRelated: ApiPost[] = []
    try {
      const raw = await $fetch<ApiRelatedResponse>(`/api/posts/${nextSlug}/related`, {
        query: { limit: 10 },
      })
      nextRelated = extractRelated(raw)
    } catch {
      nextRelated = []
    }

    loadedPosts.value.push({
      slug: nextSlug,
      post: nextPost,
      html: marked(stripFrontmatter(nextMarkdown)) as string,
      related: nextRelated,
      viewCounted: false,
    })
    markVisited(nextSlug)
  } catch {
    // Сеть/API недоступны — не рушим ленту, просто прекращаем подгрузку.
    feedExhausted.value = true
  } finally {
    loadingNext.value = false
  }
}

async function countView(entry: LoadedPost) {
  if (entry.viewCounted) return
  const clientKey = useClientKey()
  if (!clientKey) return
  entry.viewCounted = true // ставим сразу — не задваиваем при повторном срабатывании observer'а

  try {
    const result = await $fetch<{ counted: boolean }>(`/api/posts/${entry.slug}/views`, {
      method: 'POST',
      body: { client_key: clientKey },
    })
    if (result.counted) entry.post.views += 1
  } catch {
    // Тихо игнорируем — счётчик не должен мешать чтению.
  }
}

const sentinel = ref<HTMLElement | null>(null)
let sentinelObserver: IntersectionObserver | null = null

const articleRefs = new Map<string, HTMLElement>()
function setArticleRef(slug: string, el: Element | null) {
  if (el instanceof HTMLElement) {
    articleRefs.set(slug, el)
    activeObserver?.observe(el)
  } else {
    const existing = articleRefs.get(slug)
    if (existing) activeObserver?.unobserve(existing)
    articleRefs.delete(slug)
  }
}

let activeObserver: IntersectionObserver | null = null

function updateHistoryAndTitle(entry: LoadedPost) {
  const path = `/posts/${entry.slug}`
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path)
  }
  document.title = entry.post.title ? `${entry.post.title} — Week-book` : 'Week-book'
}

onMounted(() => {
  sentinelObserver = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) appendNextPost()
    },
    { rootMargin: '600px 0px 600px 0px' },
  )
  if (sentinel.value) sentinelObserver.observe(sentinel.value)

  // Тонкая горизонтальная полоса у верха вьюпорта — какой пост её
  // пересекает, тот и считается "текущим" независимо от его высоты.
  activeObserver = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        const slug = (e.target as HTMLElement).dataset.slug
        const entry = loadedPosts.value.find((p) => p.slug === slug)
        if (entry) {
          updateHistoryAndTitle(entry)
          countView(entry)
        }
      }
    },
    { rootMargin: '-45% 0px -50% 0px', threshold: 0 },
  )

  for (const [, el] of articleRefs) activeObserver.observe(el)

  // Первый пост уже виден при маунте — считаем сразу.
  if (loadedPosts.value[0]) countView(loadedPosts.value[0])
})

onBeforeUnmount(() => {
  sentinelObserver?.disconnect()
  activeObserver?.disconnect()
})

let touchStartX = 0
let touchStartY = 0

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX
  touchStartY = e.touches[0].clientY
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX
  const dy = e.changedTouches[0].clientY - touchStartY
  if (dx > 70 && Math.abs(dy) < 50) navigateTo('/')
}

function shareUrlFor(post: ApiPost) {
  if (post.short_id) return `${config.public.redirectBaseUrl}/${post.short_id}`
  return `${config.public.siteBaseUrl}/posts/${post.slug}`
}

useSeoMeta({
  title: () => (firstPost.value?.title ? `${firstPost.value.title} — Week-book` : 'Week-book'),
  description: () => firstPost.value?.excerpt ?? '',
  ogTitle: () => (firstPost.value?.title ? `${firstPost.value.title} — Week-book` : 'Week-book'),
  ogDescription: () => firstPost.value?.excerpt ?? '',
})
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="notFound">Пост не найден.</p>
  <p v-else-if="error">{{ error }}</p>
  <template v-else>
    <article
      v-for="entry in loadedPosts"
      :key="entry.slug"
      :ref="(el) => setArticleRef(entry.slug, el as Element | null)"
      :data-slug="entry.slug"
      class="post"
      @touchstart="onTouchStart"
      @touchend="onTouchEnd"
    >
      <h1>{{ entry.post.title }}</h1>
      <div class="meta">
        {{ entry.post.date }}
        <span class="views">
          <svg
            class="views-icon"
            viewBox="0 0 24 24"
            width="14"
            height="14"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          {{ entry.post.views }}
        </span>
      </div>
      <div v-html="entry.html"></div>

      <PostWidget
        :share-url="shareUrlFor(entry.post)"
        :share-title="entry.post.title"
        :related="entry.related"
      />
    </article>

    <div ref="sentinel" class="feed-sentinel" aria-hidden="true"></div>
    <p v-if="loadingNext" class="feed-loading">Загружаю следующий пост…</p>

    <EndOfFeed
      v-if="sessionLimitReached"
      :already-shown="celebrationShown"
      @shown="celebrationShown = true"
    />
  </template>
</template>

<style scoped>
:deep(img) {
  max-width: 480px;
  width: 100%;
  height: auto;
  border-radius: 8px;
  border: 1px solid var(--color-border);
  display: block;
  margin: 1rem auto;
}
:deep(h2),
:deep(h3) {
  margin-top: 2rem;
}

:deep(p) {
  line-height: 1.8;
}

:deep(code) {
  background: var(--color-border);
  padding: 0.2em 0.4em;
  border-radius: 4px;
  font-size: 0.9em;
}

:deep(pre) {
  background: var(--color-border);
  padding: 1rem;
  border-radius: 8px;
  overflow-x: auto;
}

.post {
  margin-bottom: 3rem;
}

.meta {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  flex-wrap: wrap;
}

.views {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  opacity: 0.6;
  font-size: 0.85em;
}

.views-icon {
  flex-shrink: 0;
}

.feed-sentinel {
  height: 1px;
}

.feed-loading {
  text-align: center;
  opacity: 0.6;
  font-size: 0.9rem;
  padding: 1rem 0;
}
</style>
