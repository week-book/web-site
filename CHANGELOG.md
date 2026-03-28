# Changelog

Все значимые изменения в проекте фиксируются здесь.

Формат основан на [Keep a Changelog](https://keepachangelog.com/ru/1.0.0/).
Версионирование следует [Semantic Versioning](https://semver.org/lang/ru/).

---

## [Unreleased]

### Added
- `CHANGELOG.md` — этот файл

---

## [2.0.0] — 2026-03-28

Полная миграция с SPA (Vue 3 + Vite) на SSR (Nuxt 3).

### Added
- Server-Side Rendering через Nuxt 3 + Nitro — страницы постов теперь отдают готовый HTML
- Мета-теги для SEO на всех страницах через `useSeoMeta`: `title`, `description`, `ogTitle`, `ogDescription`
- Глобальный `titleTemplate` в `app.vue` — автоматически добавляет `— Week-book` к заголовку каждой страницы
- `runtimeConfig` в `nuxt.config.ts` для хранения `postsBaseUrl`
- `lang="ru"` на `<html>` через `useHead`

### Changed
- Фреймворк: Vue 3 + Vite → Nuxt 3
- Деплой: Nginx (статика) → Node.js + Nitro (SSR-сервер), порт `3000`
- Загрузка данных: `onMounted + fetch` → `useFetch` с серверным рендерингом
- Роутинг: `vue-router` + ручной `router/index.ts` → файловый роутинг Nuxt
- `<RouterLink>` → `<NuxtLink>`, `<RouterView>` → `<NuxtPage>`
- Dockerfile: двухэтапная сборка Node → Nginx заменена на Node → Node

### Fixed
- `localStorage` в `stores/ui.ts` теперь вызывается только на клиенте через `import.meta.client`
- `setInterval` в `pages/games.vue` перенесён в `onMounted` — устранён SSR-краш с кодом 500
- Страница `/games` переведена в `client-only` режим через `definePageMeta({ ssr: false })`

### Removed
- `src/router/index.ts` — роутинг теперь файловый
- `src/main.ts` и `index.html` — точка входа управляется Nuxt
- `src/stores/counter.ts` — не использовался
- Зависимость `vue-router` как явная зависимость проекта
- Nginx из Docker-образа

---

## [1.2.2] — 2026-03-25

Последняя версия SPA-архитектуры на Vue 3 + Vite.
