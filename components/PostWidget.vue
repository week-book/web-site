<script setup lang="ts">
import type { ApiPost } from '../types/apiPost'
import { YOU_LOVE_IT_TAG } from '../utils/constants'

const props = defineProps<{
  shareUrl: string
  shareTitle?: string
  related: ApiPost[]
  tags?: string[]
}>()

const hasYouLoveIt = computed(() => props.tags?.includes(YOU_LOVE_IT_TAG) ?? false)
</script>

<template>
  <div class="post-widget">
    <template v-if="hasYouLoveIt">
      <YouLoveItPromo :tagged-post="true" />
      <SelfPromo :share-url="shareUrl" :share-title="shareTitle" />
    </template>
    <template v-else>
      <SelfPromo :share-url="shareUrl" :share-title="shareTitle" />
    </template>

    <RelatedPosts :posts="related" />
  </div>
</template>

<style scoped>
.post-widget {
  margin-top: 1rem;
}
</style>
