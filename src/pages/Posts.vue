<script setup lang="ts">
import { computed } from 'vue';
import { loadPosts } from '../utils/loadPosts';
import PostCard from '../components/PostCard.vue';

const posts = computed(() => loadPosts());
</script>

<template>
  <section>
    <h1>All posts</h1>
    <template v-if="posts.length">
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
    <p v-else>No posts yet. Add a <code>.md</code> file to <code>src/posts/</code> to get started.</p>
  </section>
</template>
