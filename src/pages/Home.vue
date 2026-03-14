<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { loadPosts, type PostSummary } from '../utils/loadPosts';
import PostCard from '../components/PostCard.vue';

const posts = ref<PostSummary[]>([]);
const loading = ref(true);
const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const all = await loadPosts();
    posts.value = all.slice(0, 5);
  } catch (e) {
    error.value = 'Не удалось загрузить посты.';
    console.error(e);
  } finally {
    loading.value = false;
  }
});
</script>

<template>
  <section>
    <h1>Latest posts</h1>
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
