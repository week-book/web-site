<script setup lang="ts">
import type { ApiPost } from '../../types/apiPost'

const route = useRoute()
const config = useRuntimeConfig()
const slug = computed(() => String(route.params.slug))

const { data: post, error: postError } = await useFetch<ApiPost>(() => `/api/posts/${slug.value}`)

const { data: markdown, error: markdownError } = await useFetch<string>(
  () => (post.value ? `${config.public.postsBaseUrl}/${post.value.filename}` : null),
  { watch: [post] },
)

function stripFrontmatter(md: string): string {
  return md.replace(/^---[\s\S]*?---\n?/, '')
}

const { marked } = await import('marked')

const html = computed(() => (markdown.value ? marked(stripFrontmatter(markdown.value)) : ''))

const notFound = computed(() => postError.value?.statusCode === 404)
const loading = computed(() => !post.value && !postError.value)
const error = computed(() =>
  postError.value && !notFound.value
    ? 'Не удалось загрузить пост.'
    : markdownError.value
      ? 'Не удалось загрузить текст поста.'
      : null,
)

// Счётчик просмотров: считаем один раз за монтирование страницы поста,
// dedup по TTL (18ч) — на стороне posts-api, см. api.md.
const displayedViews = ref<number | null>(null)

watch(
  post,
  (value) => {
    if (value) displayedViews.value = value.views
  },
  { immediate: true },
)

onMounted(async () => {
  if (!post.value) return
  const clientKey = useClientKey()
  if (!clientKey) return

  try {
    const result = await $fetch<{ counted: boolean }>(`/api/posts/${slug.value}/views`, {
      method: 'POST',
      body: { client_key: clientKey },
    })
    if (result.counted && displayedViews.value !== null) {
      displayedViews.value += 1
    }
  } catch {
    // Тихо игнорируем — счётчик просмотров не должен ломать чтение поста.
  }
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
  if (dx > 70 && Math.abs(dy) < 50) {
    navigateTo('/')
  }
}

useSeoMeta({
  title: () => (post.value?.title ? `${post.value.title} — Week-book` : 'Week-book'),
  description: () => post.value?.excerpt ?? '',
  ogTitle: () => (post.value?.title ? `${post.value.title} — Week-book` : 'Week-book'),
  ogDescription: () => post.value?.excerpt ?? '',
})
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="notFound">Пост не найден.</p>
  <p v-else-if="error">{{ error }}</p>
  <p v-else-if="!post">Пост не найден.</p>
  <article class="post" v-else @touchstart="onTouchStart" @touchend="onTouchEnd">
    <h1>{{ post.title }}</h1>
    <div class="meta">
      {{ post.date }}
      <span v-if="displayedViews !== null" class="views">
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
        {{ displayedViews }}
      </span>
    </div>
    <div v-html="html"></div>
  </article>
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
</style>
