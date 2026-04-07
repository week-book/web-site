import { marked } from 'marked'

export interface PostMeta {
  title: string
  date: string | null
  excerpt: string
  tags: string[]
}

export interface PostSummary {
  slug: string
  filename: string
  meta: PostMeta
}

export interface Post extends PostSummary {
  html: string
}

const BASE_URL = 'https://s3.week-book.ru/posts'

/**
 * Загружает список постов из index.json в MinIO.
 * Используется на страницах Home и Posts.
 */
export async function loadPosts(): Promise<PostSummary[]> {
  const res = await fetch(`${BASE_URL}/index.json`)
  if (!res.ok) throw new Error(`Не удалось загрузить index.json: ${res.status}`)
  const posts: PostSummary[] = await res.json()
  return posts.sort((a, b) => (b.meta.date ?? '').localeCompare(a.meta.date ?? ''))
}

/**
 * Загружает один пост по slug — сначала ищет filename в index.json,
 * потом загружает сам .md файл.
 * Используется на странице PostView.
 */
export async function loadPost(slug: string): Promise<Post | null> {
  const posts = await loadPosts()
  const summary = posts.find((p) => p.slug === slug)
  if (!summary) return null

  const res = await fetch(`${BASE_URL}/${summary.filename}`)
  if (!res.ok) throw new Error(`Не удалось загрузить пост ${summary.filename}: ${res.status}`)

  const markdown = await res.text()
  const html = await marked(markdown)

  return { ...summary, html }
}
