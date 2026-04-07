# week-book 📓

Личный блог [Данила Синицкого](https://week-book.ru/about) — небольшой уголок в интернете без рекламы и алгоритмов. Посты пишутся в Obsidian, хранятся как Markdown-файлы на MinIO S3 и рендерятся на сервере через Nuxt 3 SSR.

🌐 **[week-book.ru](https://week-book.ru)**

---

## Стек

| Слой               | Технология                   |
| ------------------ | ---------------------------- |
| Фреймворк          | Nuxt 3 + TypeScript          |
| Рендеринг          | SSR (Server-Side Rendering)  |
| Сборка             | Vite + Nitro                 |
| Роутинг            | Nuxt File-based routing      |
| Стейт              | Pinia                        |
| Рендер постов      | marked (Markdown → HTML)     |
| Хранилище контента | MinIO S3 (`s3.week-book.ru`) |
| Деплой             | Docker + Node.js             |
| Линтер / форматер  | ESLint + oxlint + Prettier   |

---

## Структура проекта

```
├── app/
│   └── app.vue          # корневой компонент
├── components/          # Header, PostCard, ThemeToggle
├── pages/               # маршруты по файловой системе
│   ├── index.vue        # /
│   ├── about.vue        # /about
│   ├── games.vue        # /games
│   └── posts/
│       └── [slug].vue   # /posts/:slug
├── stores/              # Pinia-сторы
└── utils/
    └── loadPosts.ts     # типы для постов из S3
```

### Как работают посты

Посты хранятся на S3 в виде `.md`-файлов. Список постов лежит в `index.json`:

```
s3.week-book.ru/posts/
├── index.json            # манифест всех постов
└── 2026-03-16-day-21.md  # сами посты
```

При запросе страницы сервер Nuxt получает `index.json`, находит нужный пост, рендерит Markdown через `marked` и отдаёт браузеру готовый HTML — со всеми мета-тегами для SEO и соцсетей.

---

## Страницы

| Маршрут        | Описание       | SSR            |
| -------------- | -------------- | -------------- |
| `/`            | Лента постов   | ✅             |
| `/posts/:slug` | Отдельный пост | ✅             |
| `/about`       | О себе         | ✅             |
| `/games`       | Судоку и 2048  | ❌ client-only |

---

## Локальный запуск

**Требования:** Node.js `^20.19.0`

```bash
npm install
npm run dev
```

Другие команды:

```bash
npm run build        # продакшн-сборка
npm run preview      # предпросмотр продакшн-сборки локально
```

---

## Docker

Двухэтапная сборка: первый этап собирает проект через Nuxt, второй запускает Nitro-сервер.

```bash
docker build -t week-book .
docker run -p 3000:3000 week-book
```

Сервер поднимается на порту `3000`. В продакшне перед ним стоит reverse proxy.

---

## Добавление поста

1. Написать пост в Obsidian в виде `.md`-файла
2. Залить файл на S3 в `s3.week-book.ru/posts/`
3. Добавить запись в `index.json`:

```json
{
  "slug": "my-new-post",
  "filename": "2026-03-22-my-new-post.md",
  "meta": {
    "title": "Заголовок",
    "date": "2026-03-22",
    "excerpt": "Краткое описание",
    "tags": ["Мысли"]
  }
}
```

Новый пост появится на сайте сразу — перезапуск сервера не нужен.

---

## Планы

- [ ] API для публикации постов (вместо ручного обновления S3)
- [ ] Счётчик просмотров и реакции
- [ ] Telegram-канал с автоматическими анонсами
- [ ] Монетизация для покрытия расходов на инфраструктуру
- [ ] Sitemap для автоматической индексации постов

---

## Обратная связь

Нашёл баг или хочешь написать — [dekter13@gmail.com](mailto:dekter13@gmail.com?subject=Веб-сайт)

Код полностью открыт: [github.com/week-book](https://github.com/week-book)
