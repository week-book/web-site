# week-book 📓

Личный блог [Данила Синицкого](https://week-book.ru/about) — небольшой уголок в интернете без рекламы и алгоритмов. Посты пишутся в Obsidian, хранятся как Markdown-файлы на MinIO S3 и отдаются SPA на Vue 3.

🌐 **[week-book.ru](https://week-book.ru)**

---

## Стек

| Слой | Технология |
|---|---|
| Фреймворк | Vue 3 + TypeScript |
| Сборка | Vite |
| Роутинг | Vue Router 5 |
| Стейт | Pinia |
| Рендер постов | marked (Markdown → HTML) |
| Хранилище контента | MinIO S3 (`s3.week-book.ru`) |
| Деплой | Docker + Nginx |
| Тесты | Vitest |
| Линтер / форматер | ESLint + oxlint + Prettier |

---

## Структура проекта

```
src/
├── components/      # Header, PostCard, ThemeToggle
├── pages/           # Home, Posts, PostView, About, Games
├── router/          # Vue Router — маршруты SPA
├── stores/          # Pinia-сторы
└── utils/
    └── loadPosts.ts # Загрузка постов из S3
```

### Как работают посты

Посты хранятся на S3 в виде `.md`-файлов. Список постов лежит в `index.json`:

```
s3.week-book.ru/posts/
├── index.json            # манифест всех постов
└── 2026-03-16-day-21.md  # сами посты
```

`loadPosts.ts` тянет `index.json`, сортирует посты по дате и рендерит нужный `.md` через `marked`.

---

## Страницы

| Маршрут | Описание |
|---|---|
| `/` | Лента постов |
| `/posts/:slug` | Отдельный пост |
| `/about` | О себе |
| `/games` | Судоку |

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
npm run test:unit    # юнит-тесты через Vitest
npm run lint         # oxlint + eslint
npm run format       # prettier
```

---

## Docker

Двухэтапная сборка: Node собирает проект, Nginx отдаёт статику.

```bash
docker build -t week-book .
docker run -p 80:80 week-book
```

Nginx настроен на SPA-fallback — все пути отдают `index.html`.

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

---

## Планы

- [ ] API для публикации постов (вместо ручного обновления S3)
- [ ] Счётчик просмотров и реакции
- [ ] Telegram-канал с автоматическими анонсами
- [ ] Монетизация для покрытия расходов на инфраструктуру
- [ ] Раздел с играми — судоку уже есть ✅

---

## Обратная связь

Нашёл баг или хочешь написать — [dekter13@gmail.com](mailto:dekter13@gmail.com?subject=Веб-сайт)

Код полностью открыт: [github.com/week-book](https://github.com/week-book)
