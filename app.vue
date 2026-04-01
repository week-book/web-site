<template>
  <Header />
  <main class="main">
    <NuxtPage />
  </main>
</template>

<script setup lang="ts">
import { useUiStore } from '/stores/ui';

const ui = useUiStore();

useHead({
  htmlAttrs: { lang: 'ru' },
  meta: [
    { name: 'viewport', content: 'width=device-width, initial-scale=1' },
  ],
  link: [
    { rel: 'sitemap', type: 'application/xml', href: '/sitemap.xml' }
  ]
})

onMounted(() => {
  document.documentElement.setAttribute('data-theme', ui.theme === 'dark' ? 'dark' : '');
});
</script>

<style>
*, *::before, *::after {
  box-sizing: border-box;
}

:root {
  --color-bg: #ffffff;
  --color-text: #1a202c;
  --color-border: #e2e8f0;
}

[data-theme="dark"] {
  --color-bg: #1a202c;
  --color-text: #e2e8f0;
  --color-border: #2d3748;
}

body {
  margin: 0;
  background: var(--color-bg);
  color: var(--color-text);
  font-family: system-ui, sans-serif;
  line-height: 1.6;
  transition: background 0.2s, color 0.2s;
}

a {
  color: inherit;
}

.main {
  max-width: 700px;
  margin: 0 auto;
  padding: 2rem 1rem;
}
</style>

