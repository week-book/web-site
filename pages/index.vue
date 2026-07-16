<script setup lang="ts">
import type { ApiPostList } from '../types/apiPost'

const PAGE_SIZE = 20

const route = useRoute()
const router = useRouter()

const page = computed(() => {
  const raw = Number(route.query.page)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
})

const offset = computed(() => (page.value - 1) * PAGE_SIZE)

const {
  data,
  error: fetchError,
  pending,
} = await useFetch<ApiPostList>('/api/posts', {
  query: { limit: PAGE_SIZE, offset },
  watch: [offset],
})

const posts = computed(() => data.value?.posts ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const loading = computed(() => pending.value)
const error = computed(() => (fetchError.value ? 'Не удалось загрузить посты.' : null))

function goToPage(next: number) {
  const clamped = Math.min(Math.max(1, next), totalPages.value)
  router.push({ query: { ...route.query, page: clamped === 1 ? undefined : clamped } })
}

useSeoMeta({
  title: 'Посты — Week-book',
  description: 'Все статьи блога Week-book',
  ogTitle: 'Посты — Week-book',
  ogDescription: 'Все статьи блога Week-book',
})
</script>

<template>
  <section>
    <h1>All posts</h1>
    <p v-if="loading">Загрузка...</p>
    <p v-else-if="error">{{ error }}</p>
    <template v-else-if="posts.length">
      <PostCard
        v-for="post in posts"
        :key="post.slug"
        :slug="post.slug"
        :title="post.title"
        :date="post.date"
        :excerpt="post.excerpt"
        :tags="post.tags"
      />
      <nav class="pagination" v-if="totalPages > 1">
        <button type="button" :disabled="page <= 1" @click="goToPage(page - 1)">← Назад</button>
        <span class="pagination__status">{{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages" @click="goToPage(page + 1)">
          Вперёд →
        </button>
      </nav>
    </template>
    <p v-else>Постов пока нет.</p>
  </section>
</template>

<style scoped>
.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid var(--color-border, #e2e8f0);
  background: transparent;
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__status {
  font-size: 0.9rem;
  opacity: 0.7;
}
</style>
