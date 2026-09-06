<template>
  <Header />
  <NuxtLoadingIndicator color="var(--color-accent)" />
  <main class="main">
    <NuxtPage>
      <template #fallback>
        <div class="post-skeleton" aria-hidden="true">
          <div class="skeleton skeleton--title"></div>
          <div class="skeleton skeleton--meta"></div>
          <div class="skeleton skeleton--line"></div>
          <div class="skeleton skeleton--line"></div>
          <div class="skeleton skeleton--line skeleton--short"></div>
        </div>
      </template>
    </NuxtPage>
  </main>
</template>

<script setup lang="ts">
import { useUiStore } from '/stores/ui'

const ui = useUiStore()

useHead({
  htmlAttrs: { lang: 'ru' },
  meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }],
  link: [
    { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32x32.png' },
    { rel: 'icon', type: 'image/png', sizes: '16x16', href: '/favicon-16x16.png' },
    { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
    { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
    { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' },
    { rel: 'manifest', href: '/manifest.webmanifest' },
  ],
})

onMounted(() => {
  document.documentElement.setAttribute('data-theme', ui.theme === 'dark' ? 'dark' : '')
})
</script>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

/* Убирает дешёвую синюю/серую подсветку по тапу на мобильных WebKit/Chromium —
   именно она давала "прямоугольник" при клике на телефоне. */
* {
  -webkit-tap-highlight-color: transparent;
}

a,
button {
  -webkit-tap-highlight-color: transparent;
}

/* Не убираем фокус полностью (это важно для доступности с клавиатуры) —
   заменяем дефолтный браузерный outline на свой, но только когда фокус
   реально получен с клавиатуры/скринридера (:focus-visible), не по тапу. */
a:focus,
button:focus {
  outline: none;
}

a:focus-visible,
button:focus-visible {
  outline: 2px solid var(--color-accent);
  outline-offset: 2px;
  border-radius: 4px;
}

:root {
  --color-bg: #ffffff;
  --color-text: #1a202c;
  --color-border: #e2e8f0;
  --color-accent: #1a202c;
  --color-accent-text: #ffffff;
}

[data-theme='dark'] {
  --color-bg: #1a202c;
  --color-text: #e2e8f0;
  --color-border: #2d3748;
  --color-accent: #e2e8f0;
  --color-accent-text: #1a202c;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  transition:
    background 0.2s,
    color 0.2s;
}

a {
  color: inherit;
}

.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem 22rem;
}

.page-enter-active,
.page-leave-active {
  transition: opacity 0.18s ease;
}

.page-enter-from,
.page-leave-to {
  opacity: 0;
}

.post-skeleton {
  padding: 1rem 0;
}

.skeleton {
  background: var(--color-border);
  border-radius: 6px;
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton--title {
  height: 2rem;
  width: 70%;
  margin-bottom: 0.75rem;
}

.skeleton--meta {
  height: 0.9rem;
  width: 30%;
  margin-bottom: 1.5rem;
  opacity: 0.6;
}

.skeleton--line {
  height: 1rem;
  margin-bottom: 0.7rem;
}

.skeleton--short {
  width: 60%;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}
</style>
