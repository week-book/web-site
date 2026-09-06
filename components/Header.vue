<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'

// Умная шапка: прячется при скролле вниз, появляется при скролле вверх.
// Наверху страницы (scrollY ниже порога) всегда видна — иначе первый же
// микро-скролл вниз с самого верха мгновенно её бы прятал.
const THRESHOLD = 8 // px за один тик, отсекает дрожание трекпада/мыши
const REVEAL_NEAR_TOP = 80 // px от начала страницы, где шапка всегда видна

const visible = ref(true)
let lastScrollY = 0
let ticking = false

function onScroll() {
  if (ticking) return
  ticking = true
  requestAnimationFrame(() => {
    const currentY = window.scrollY
    const delta = currentY - lastScrollY

    if (currentY <= REVEAL_NEAR_TOP) {
      visible.value = true
    } else if (delta > THRESHOLD) {
      visible.value = false // листает вниз — прячем
    } else if (delta < -THRESHOLD) {
      visible.value = true // листает вверх — показываем
    }

    lastScrollY = currentY
    ticking = false
  })
}

onMounted(() => {
  lastScrollY = window.scrollY
  window.addEventListener('scroll', onScroll, { passive: true })
})

onUnmounted(() => {
  window.removeEventListener('scroll', onScroll)
})
</script>

<template>
  <header class="header" :class="{ 'header--hidden': !visible }">
    <nav class="nav">
      <NuxtLink class="nav__logo" to="/">Week-book</NuxtLink>
      <nav class="nav__links">
        <NuxtLink class="nav__link" to="/">Посты</NuxtLink>
        <NuxtLink class="nav__link" to="/games">Игры</NuxtLink>
        <NuxtLink class="nav__link" to="/about">О себе</NuxtLink>
      </nav>
      <ThemeToggle />
    </nav>
  </header>
</template>

<style scoped>
.header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--color-bg);
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding: 0 1rem;
  transform: translateY(0);
  transition: transform 0.25s ease;
}

.header--hidden {
  transform: translateY(-100%);
}

.nav {
  max-width: 700px;
  margin: 0 auto;
  height: 56px;
  display: flex;
  align-items: center;
}

.nav__logo {
  font-weight: 700;
  font-size: 1.1rem;
  text-decoration: none;
  margin-right: auto;
}

.nav__links {
  display: flex;
  gap: 1rem;
  margin-right: 1rem;
}

.nav__link {
  font-size: 0.95rem;
  text-decoration: none;
  opacity: 0.75;
  transition: opacity 0.15s;
}

.nav__link:hover,
.nav__link.router-link-active {
  opacity: 1;
}
</style>
