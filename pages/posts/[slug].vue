<script setup lang="ts">
import type { ApiPost, ApiRelatedResponse } from '../../types/apiPost'
import { renderPostBody } from '../../utils/renderPostBody'
import { initCarousels } from '../../composables/useCarousels'

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

const { sessionLimitReached, celebrationShown, markVisited, findNextSlug } = useNextPost()

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
        html: firstMarkdown.value ? renderPostBody(stripFrontmatter(firstMarkdown.value)) : '',
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
      html: renderPostBody(stripFrontmatter(nextMarkdown)),
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

// Обёртка со всей лентой постов — на неё вешаем MutationObserver, чтобы
// карусели инициализировались сами при появлении любого нового поста
// (первый рендер, бесшовная подгрузка следующего — не важно, откуда).
const feedContainer = ref<HTMLElement | null>(null)
let carouselObserver: MutationObserver | null = null

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

  if (feedContainer.value) {
    carouselObserver = new MutationObserver(() => {
      if (feedContainer.value) initCarousels(feedContainer.value)
    })
    carouselObserver.observe(feedContainer.value, { childList: true, subtree: true })
    // на случай, если контент уже отрисован к моменту маунта
    initCarousels(feedContainer.value)
  }
})

onBeforeUnmount(() => {
  sentinelObserver?.disconnect()
  activeObserver?.disconnect()
  carouselObserver?.disconnect()
})

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
    <div ref="feedContainer">
      <article
        v-for="entry in loadedPosts"
        :key="entry.slug"
        :ref="(el) => setArticleRef(entry.slug, el as Element | null)"
        :data-slug="entry.slug"
        class="post"
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
    </div>
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

/* --- Карусель фото --- */
:deep(.post-carousel) {
  margin: 1.5rem 0;
}

:deep(.carousel-viewport) {
  position: relative;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
}

:deep(.carousel-track) {
  display: flex;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  cursor: grab;
  scrollbar-width: none;
}
:deep(.carousel-track::-webkit-scrollbar) {
  display: none;
}
:deep(.carousel-track.dragging) {
  cursor: grabbing;
  scroll-snap-type: none;
}

:deep(.carousel-slide) {
  flex: 0 0 100%;
  scroll-snap-align: start;
  aspect-ratio: 4 / 3;
}
:deep(.carousel-slide img) {
  width: 100% !important;
  height: 100% !important;
  max-width: none !important;
  object-fit: cover !important;
  margin: 0 !important;
  border: none !important;
  border-radius: 0 !important;
  display: block !important;
  user-select: none;
  -webkit-user-drag: none;
}

:deep(.carousel-arrow) {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  width: 34px;
  height: 34px;
  border-radius: 50%;
  border: none;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 1.3rem;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(2px);
  transition:
    opacity 0.15s,
    background 0.15s;
}
:deep(.carousel-arrow:hover) {
  background: rgba(0, 0, 0, 0.65);
}
:deep(.carousel-arrow:disabled) {
  opacity: 0;
  pointer-events: none;
}
:deep(.carousel-arrow--prev) {
  left: 10px;
}
:deep(.carousel-arrow--next) {
  right: 10px;
}

:deep(.carousel-counter) {
  position: absolute;
  bottom: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.5);
  color: #fff;
  font-size: 0.75rem;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
  backdrop-filter: blur(2px);
}

@media (hover: none) {
  :deep(.carousel-arrow) {
    display: none; /* на тач-устройствах хватает свайпа */
  }
}
</style>
