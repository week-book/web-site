<template>
  <article class="post" v-if="post">
    <h1>{{ post.meta.title }}</h1>
    <div class="meta">{{ post.meta.date }}</div>
    <div v-html="post.html"></div>
  </article>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { loadPosts } from '../utils/loadPosts';

const props = defineProps({ slug: String });
const post = ref(null);

onMounted(() => {
  const posts = loadPosts();
  post.value = posts.find(p => p.slug === props.slug);
});
</script>

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
