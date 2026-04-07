<script setup lang="ts">
import type PostSummary from '../types/post.ts'

const config = useRuntimeConfig()

const {
  data: posts,
  error: fetchError,
  pending,
} = await useFetch<PostSummary[]>(`${config.public.postsBaseUrl}/index.json`, {
  transform: (data) =>
    [...data].sort((a, b) => (b.meta.date ?? '').localeCompare(a.meta.date ?? '')),
})

const loading = computed(() => pending.value)
const error = computed(() => (fetchError.value ? 'Не удалось загрузить посты.' : null))

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
        :title="post.meta.title"
        :date="post.meta.date"
        :excerpt="post.meta.excerpt"
        :tags="post.meta.tags"
      />
    </template>
    <p v-else>Постов пока нет.</p>
  </section>
</template>
