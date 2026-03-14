<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { loadPost, type Post } from '../utils/loadPosts';

const props = defineProps<{ slug: string }>();

const post = ref<Post | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    post.value = await loadPost(props.slug);
  } catch (e) {
    error.value = 'Не удалось загрузить пост.';
    console.error(e);
  } finally {
    loading.value = false;
  }
});
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
