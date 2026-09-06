<script setup lang="ts">
import { YOU_LOVE_IT_LANDING_PATH } from '../utils/constants'

defineProps<{
  taggedPost?: boolean
}>()
</script>

<template>
  <div class="youloveit-promo">
    <div class="youloveit-promo__text">
      <p v-if="taggedPost" class="youloveit-promo__eyebrow">Этот пост — из рубрики YouLoveIt</p>
      <p class="youloveit-promo__title">У тебя тоже есть такая история?</p>
      <p class="youloveit-promo__subtitle">
        YouLoveIt — рубрика про маленькую любовь к вещам, книгам и людям. Расскажи свою.
      </p>
    </div>
    <NuxtLink :to="YOU_LOVE_IT_LANDING_PATH" class="youloveit-promo__cta">
      Читать YouLoveIt
    </NuxtLink>
  </div>
</template>

<style scoped>
.youloveit-promo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
  padding: 1.25rem;
  border: 1px solid var(--color-border);
  border-radius: 12px;
  margin-top: 2rem;
}

.youloveit-promo__text {
  min-width: 0;
}

.youloveit-promo__eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.03em;
  color: var(--color-accent);
}

.youloveit-promo__title {
  margin: 0 0 0.25rem;
  font-weight: 600;
}

.youloveit-promo__subtitle {
  margin: 0;
  opacity: 0.75;
  font-size: 0.9rem;
}

.youloveit-promo__cta {
  flex-shrink: 0;
  padding: 0.55rem 1.1rem;
  border-radius: 8px;
  border: 1px solid var(--color-accent);
  background: var(--color-accent);
  color: var(--color-accent-text);
  text-decoration: none;
  font-weight: 500;
  white-space: nowrap;
  display: inline-block;
  transform: scale(1);
  transition:
    opacity 0.15s ease,
    transform 0.12s ease;
}

.youloveit-promo__cta:hover {
  opacity: 0.85;
}

.youloveit-promo__cta:active {
  transform: scale(0.94);
}

@media (max-width: 640px) {
  .youloveit-promo {
    flex-direction: column;
    align-items: stretch;
  }

  .youloveit-promo__cta {
    text-align: center;
  }
}
</style>
