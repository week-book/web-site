<script setup lang="ts">
import type { ApiPost } from '../types/apiPost'

const props = defineProps<{
  posts: ApiPost[]
}>()

const visiblePosts = computed(() => props.posts.slice(0, 3))
</script>

<template>
  <section v-if="visiblePosts.length" class="related-posts">
    <h2 class="related-posts__title">Читайте также</h2>
    <ul class="related-posts__list">
      <li v-for="post in visiblePosts" :key="post.slug" class="related-posts__item">
        <NuxtLink :to="`/posts/${post.slug}`" class="related-posts__link">
          {{ post.title }}
        </NuxtLink>
        <span v-if="post.date" class="related-posts__date">{{ post.date }}</span>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.related-posts {
  margin-top: 2rem;
}

.related-posts__title {
  font-size: 1.1rem;
  margin: 0 0 0.75rem;
}

.related-posts__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.related-posts__item {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.6rem 0;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.related-posts__item:last-child {
  border-bottom: none;
}

.related-posts__link {
  color: inherit;
  text-decoration: none;
  font-weight: 500;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.related-posts__link:hover {
  text-decoration: underline;
}

.related-posts__date {
  flex-shrink: 0;
  font-size: 0.8rem;
  opacity: 0.55;
}
</style>
