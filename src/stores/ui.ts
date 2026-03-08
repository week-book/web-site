import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const theme = ref(localStorage.getItem('theme') || 'light');
  function setTheme(t) {
    theme.value = t;
    localStorage.setItem('theme', t);
    document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
  }
  return { theme, setTheme };
});
