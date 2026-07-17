export interface ApiPost {
  slug: string
  filename: string
  title: string
  date: string
  excerpt: string
  tags: string[]
  short_id: string | null
  published_at: string
  notified_at: string | null
  cover: string | null
  cluster: string | null
  views: number
}

export interface ApiPostList {
  posts: ApiPost[]
  limit: number
  offset: number
  total: number
}

export type ApiRelatedResponse = ApiPost[] | { posts: ApiPost[] }
