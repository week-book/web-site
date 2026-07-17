<script setup lang="ts">
import type { ApiPost } from '../types/apiPost'

defineProps<{
  shareUrl: string
  shareDisplayUrl: string
  shareTitle?: string
  related: ApiPost[]
}>()
</script>

<template>
  <div class="post-widget">
    <SelfPromo
      :share-url="shareUrl"
      :share-display-url="shareDisplayUrl"
      :share-title="shareTitle"
    />
    <RelatedPosts :posts="related" />
  </div>
</template>

<style scoped>
.post-widget {
  margin-top: 1rem;
}
</style>
