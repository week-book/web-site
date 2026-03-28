import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const theme = ref(
    import.meta.client ? (localStorage.getItem('theme') || 'light') : 'light'
  );

  function setTheme(t: string) {
    theme.value = t;
    if (import.meta.client) {
      localStorage.setItem('theme', t);
      document.documentElement.setAttribute('data-theme', t === 'dark' ? 'dark' : '');
    }
  }

  return { theme, setTheme };
});
