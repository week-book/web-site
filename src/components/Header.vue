<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue';
</script>

<template>
  <header class="header">
    <nav class="nav">
      <RouterLink class="nav__logo" to="/">Week-book</RouterLink>
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
</style>
