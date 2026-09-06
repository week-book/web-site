<script setup lang="ts">
const props = defineProps<{ alreadyShown: boolean }>()
const emit = defineEmits<{ shown: [] }>()

onMounted(async () => {
  if (props.alreadyShown) return
  emit('shown')

  const confetti = (await import('canvas-confetti')).default
  confetti({
    particleCount: 140,
    spread: 80,
    origin: { y: 0.6 },
  })
})
</script>

<template>
  <section class="end-of-feed">
    <p class="end-of-feed__emoji" aria-hidden="true">🎉</p>
    <h2 class="end-of-feed__title">Вы дочитали до конца ленты</h2>
    <p class="end-of-feed__text">
      30 постов за один присест — солидно. Возвращайтесь позже, будут новые.
    </p>
    <NuxtLink to="/" class="end-of-feed__link">На главную</NuxtLink>
  </section>
</template>

<style scoped>
.end-of-feed {
  text-align: center;
  padding: 3rem 1rem;
  border-top: 1px solid var(--color-border, #e2e8f0);
  margin-top: 2rem;
}

.end-of-feed__emoji {
  font-size: 2.5rem;
  margin: 0 0 0.5rem;
}

.end-of-feed__title {
  margin: 0 0 0.5rem;
}

.end-of-feed__text {
  opacity: 0.7;
  margin: 0 0 1.5rem;
}

.end-of-feed__link {
  color: inherit;
  text-decoration: underline;
  display: inline-block;
  transform: scale(1);
  transition: transform 0.12s ease;
}

.end-of-feed__link:active {
  transform: scale(0.95);
}
</style>
