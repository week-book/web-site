<script setup lang="ts">
defineProps<{
  slug: string
  title: string
  date?: string | null
  excerpt?: string
  tags?: string[]
}>()
</script>

<template>
  <article class="post-card">
    <NuxtLink :to="`/posts/${slug}`">
      <h2 class="post-card__title">{{ title }}</h2>
    </NuxtLink>
    <div class="post-card__meta" v-if="date">{{ date }}</div>
    <p class="post-card__excerpt" v-if="excerpt">{{ excerpt }}</p>
    <div class="post-card__tags" v-if="tags && tags.length">
      <span class="tag" v-for="tag in tags" :key="tag">#{{ tag }}</span>
    </div>
  </article>
</template>

<style scoped>
.post-card {
  padding: 1.25rem 0;
  border-bottom: 1px solid var(--color-border, #e2e8f0);
}

.post-card__title {
  font-size: 1.25rem;
  margin: 0 0 0.25rem;
}

.post-card__title a,
.post-card a {
  text-decoration: none;
  color: inherit;
}

.post-card__title a:hover {
  text-decoration: underline;
}

.post-card__meta {
  font-size: 0.85rem;
  opacity: 0.55;
  margin-bottom: 0.5rem;
}

.post-card__excerpt {
  margin: 0.5rem 0;
  opacity: 0.8;
  line-height: 1.6;
}

.post-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  margin-top: 0.5rem;
}

.tag {
  font-size: 0.8rem;
  opacity: 0.6;
}
</style>
