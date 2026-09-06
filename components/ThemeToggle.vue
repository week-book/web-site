<script setup lang="ts">
import { useUiStore } from '../stores/ui'

const ui = useUiStore()

function toggle() {
  ui.setTheme(ui.theme === 'dark' ? 'light' : 'dark')
}
</script>

<template>
  <button
    class="theme-toggle"
    @click="toggle"
    :aria-label="`Switch to ${ui.theme === 'dark' ? 'light' : 'dark'} mode`"
  >
    {{ ui.theme === 'dark' ? '☀️' : '🌙' }}
  </button>
</template>

<style scoped>
.theme-toggle {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.25rem;
  line-height: 1;
  transform: scale(1);
  transition: transform 0.12s ease;
}

.theme-toggle:active {
  transform: scale(0.85) rotate(-8deg);
}
</style>
