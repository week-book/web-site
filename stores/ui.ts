import { defineStore } from 'pinia'

export const useUiStore = defineStore('ui', () => {
  const themeCookie = useCookie<'light' | 'dark'>('theme', {
    default: () => 'light',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  const theme = computed(() => themeCookie.value)

  function setTheme(t: 'light' | 'dark') {
    themeCookie.value = t
  }

  return { theme, setTheme }
})
