<script setup lang="ts">
import type { ApiClustersResponse, ApiPostList } from '../types/apiPost'
import { YOU_LOVE_IT_TAG, CLUSTER_LABELS, clusterLabel } from '../utils/constants'

const PAGE_SIZE = 20

const route = useRoute()
const router = useRouter()

const page = computed(() => {
  const raw = Number(route.query.page)
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 1
})

const offset = computed(() => (page.value - 1) * PAGE_SIZE)

// Единая модель выбора: либо "всё" (null), либо реальный db-кластер,
// либо YouLoveIt — концептуально это тоже кластер (свой раздел), просто
// физически в БД он хранится как тег, а не значение cluster. Выбор одного
// варианта всегда сбрасывает остальные — нельзя одновременно фильтровать
// по кластеру и по YouLoveIt.
const activeCluster = computed(() => {
  const raw = route.query.cluster
  return typeof raw === 'string' && raw.length ? raw : null
})

const youLoveItOnly = computed(() => route.query.tag === YOU_LOVE_IT_TAG)

const { data: clustersData } = await useFetch<ApiClustersResponse>('/api/posts/clusters')
const clusterOrder = Object.keys(CLUSTER_LABELS)
const clusters = computed(() => {
  const raw = clustersData.value?.clusters ?? []
  return [...raw].sort((a, b) => {
    const ai = clusterOrder.indexOf(a)
    const bi = clusterOrder.indexOf(b)
    // Неизвестные (не описанные в CLUSTER_LABELS) кластеры уходят в конец,
    // сохраняя между собой алфавитный порядок из ответа API.
    if (ai === -1 && bi === -1) return a.localeCompare(b)
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
})

// Счётчики постов на каждый чип. Отдельного агрегирующего эндпоинта в
// posts-api нет, поэтому считаем через total из GET /posts?...&limit=1 —
// сам список постов при limit=1 нам не нужен, только total.
const { data: countsData } = await useAsyncData(
  'cluster-counts',
  async () => {
    const clusterList = clusters.value
    const [allRes, youLoveItRes, ...clusterRes] = await Promise.all([
      $fetch<ApiPostList>('/api/posts', { query: { limit: 1 } }),
      $fetch<ApiPostList>('/api/posts', { query: { limit: 1, tag: YOU_LOVE_IT_TAG } }),
      ...clusterList.map((cluster) =>
        $fetch<ApiPostList>('/api/posts', { query: { limit: 1, cluster } }),
      ),
    ])

    const perCluster: Record<string, number> = {}
    clusterList.forEach((cluster, i) => {
      perCluster[cluster] = clusterRes[i]?.total ?? 0
    })

    return {
      all: allRes.total ?? 0,
      youLoveIt: youLoveItRes.total ?? 0,
      perCluster,
    }
  },
  { watch: [clusters] },
)

function countFor(cluster: string): number {
  return countsData.value?.perCluster[cluster] ?? 0
}

const activeTagQuery = computed(() => (youLoveItOnly.value ? YOU_LOVE_IT_TAG : undefined))

const {
  data,
  error: fetchError,
  pending,
} = await useFetch<ApiPostList>('/api/posts', {
  query: { limit: PAGE_SIZE, offset, cluster: activeCluster, tag: activeTagQuery },
  watch: [offset, activeCluster, activeTagQuery],
})

const posts = computed(() => data.value?.posts ?? [])
const total = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.max(1, Math.ceil(total.value / PAGE_SIZE)))

const loading = computed(() => pending.value)
const initialLoading = computed(() => pending.value && !data.value)
const error = computed(() => (fetchError.value ? 'Не удалось загрузить посты.' : null))

function goToPage(next: number) {
  const clamped = Math.min(Math.max(1, next), totalPages.value)
  router.push({ query: { ...route.query, page: clamped === 1 ? undefined : clamped } })
}

function selectAll() {
  router.push({ query: { ...route.query, cluster: undefined, tag: undefined, page: undefined } })
}

function setCluster(cluster: string) {
  router.push({
    query: { ...route.query, cluster, tag: undefined, page: undefined },
  })
}

function selectYouLoveIt() {
  router.push({
    query: { ...route.query, cluster: undefined, tag: YOU_LOVE_IT_TAG, page: undefined },
  })
}

useSeoMeta({
  title: 'Посты — Week-book',
  description: 'Все статьи блога Week-book',
  ogTitle: 'Посты — Week-book',
  ogDescription: 'Все статьи блога Week-book',
})
</script>

<template>
  <section>
    <h1>All posts</h1>

    <div class="filters" v-if="clusters.length" :class="{ 'filters--pending': loading }">
      <button
        type="button"
        class="filters__chip"
        :class="{ 'filters__chip--active': !activeCluster && !youLoveItOnly }"
        :disabled="loading"
        @click="selectAll"
      >
        Все рубрики
        <span class="filters__count" v-if="countsData">{{ countsData.all }}</span>
      </button>
      <button
        v-for="cluster in clusters"
        :key="cluster"
        type="button"
        class="filters__chip"
        :class="{ 'filters__chip--active': activeCluster === cluster }"
        :disabled="loading"
        @click="setCluster(cluster)"
      >
        {{ clusterLabel(cluster) }}
        <span class="filters__count" v-if="countsData">{{ countFor(cluster) }}</span>
      </button>
      <button
        type="button"
        class="filters__chip"
        :class="{ 'filters__chip--active': youLoveItOnly }"
        :disabled="loading"
        @click="selectYouLoveIt"
      >
        #YouLoveIt
        <span class="filters__count" v-if="countsData">{{ countsData.youLoveIt }}</span>
      </button>
    </div>

    <p v-if="initialLoading">Загрузка...</p>
    <p v-else-if="error">{{ error }}</p>
    <template v-else-if="posts.length">
      <div class="posts-list" :class="{ 'posts-list--pending': loading }">
        <PostCard
          v-for="post in posts"
          :key="post.slug"
          :slug="post.slug"
          :title="post.title"
          :date="post.date"
          :excerpt="post.excerpt"
          :tags="post.tags"
        />
      </div>
      <nav class="pagination" v-if="totalPages > 1">
        <button type="button" :disabled="page <= 1" @click="goToPage(page - 1)">← Назад</button>
        <span class="pagination__status">{{ page }} / {{ totalPages }}</span>
        <button type="button" :disabled="page >= totalPages" @click="goToPage(page + 1)">
          Вперёд →
        </button>
      </nav>
    </template>
    <p v-else>Постов пока нет.</p>
  </section>
</template>

<style scoped>
.filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filters__chip {
  padding: 0.35rem 0.8rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.85rem;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease;
}

.filters__chip:hover:not(:disabled):not(.filters__chip--active) {
  border-color: var(--color-accent);
}

.filters__chip--active {
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-color: var(--color-accent);
}

.filters__count {
  margin-left: 0.4em;
  opacity: 0.6;
  font-variant-numeric: tabular-nums;
}

.filters__chip--active .filters__count {
  opacity: 0.8;
}

.filters__chip:disabled {
  cursor: not-allowed;
}

.filters--pending .filters__chip:not(.filters__chip--active) {
  opacity: 0.5;
}

.posts-list {
  transition: opacity 0.15s ease;
}

.posts-list--pending {
  opacity: 0.5;
  pointer-events: none;
}

.pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.5rem;
}

.pagination button {
  padding: 0.4rem 0.9rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
}

.pagination button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.pagination__status {
  font-size: 0.9rem;
  opacity: 0.7;
}
</style>
