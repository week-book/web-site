export const YOU_LOVE_IT_TAG = 'YouLoveIt'

export const YOU_LOVE_IT_LANDING_PATH = '/posts/you-love-it'

export const CLUSTER_LABELS: Record<string, string> = {
  site_growth: 'Сайт как дневник роста',
  books: 'Книги',
  write: 'Ремесло письма',
  life: 'Жизнь вокруг',
  art: 'Искусство',
  people: 'Люди / письма',
}

export function clusterLabel(cluster: string): string {
  return CLUSTER_LABELS[cluster] ?? cluster
}
