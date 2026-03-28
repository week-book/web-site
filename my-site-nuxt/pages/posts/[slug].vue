<script setup lang="ts">
const route = useRoute();
const config = useRuntimeConfig();

const { data: posts, error: postsError } = await useFetch<any[]>(
  `${config.public.postsBaseUrl}/index.json`
);

const summary = computed(() =>
  posts.value?.find((p: any) => p.slug === route.params.slug) ?? null
);

const { data: markdown } = await useFetch<string>(
  () => summary.value ? `${config.public.postsBaseUrl}/${summary.value.filename}` : null,
  { watch: [summary] }
);

const { marked } = await import('marked');
const html = computed(() => markdown.value ? marked(markdown.value) : '');

const loading = computed(() => !posts.value && !postsError.value);
const error = computed(() => postsError.value ? 'Не удалось загрузить пост.' : null);
const post = computed(() => summary.value ? { ...summary.value, html: html.value } : null);

useSeoMeta({
  title: () => post.value?.meta.title ?? 'Пост',
  description: () => post.value?.meta.excerpt ?? '',
  ogTitle: () => post.value?.meta.title ?? 'Пост',
  ogDescription: () => post.value?.meta.excerpt ?? '',
})
</script>

<template>
  <p v-if="loading">Загрузка...</p>
  <p v-else-if="error">{{ error }}</p>
  <p v-else-if="!post">Пост не найден.</p>
  <article class="post" v-else>
    <h1>{{ post.meta.title }}</h1>
    <div class="meta">{{ post.meta.date }}</div>
    <div v-html="post.html"></div>
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
</style>
