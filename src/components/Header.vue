<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue';
</script>

<template>
  <header class="header">
    <nav class="nav">
      <RouterLink class="nav__logo" to="/">Week-book</RouterLink>
      <nav class="nav__links">
        <RouterLink class="nav__link" to="/">Посты</RouterLink>
        <RouterLink class="nav__link" to="/games">Игры</RouterLink>
        <RouterLink class="nav__link" to="/about">О себе</RouterLink>
      </nav>
      <ThemeToggle />
    </nav>
  </header>
</template>

<style scoped>
.header {
  border-bottom: 1px solid var(--color-border, #e2e8f0);
  padding: 0 1rem;
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
