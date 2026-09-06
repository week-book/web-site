<script setup lang="ts">
import type { ApiClustersResponse, ApiPost, ApiPostList } from '../types/apiPost'
import { YOU_LOVE_IT_TAG, CLUSTER_LABELS, clusterLabel } from '../utils/constants'

const PAGE_SIZE = 20

const route = useRoute()
const router = useRouter()

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
const activeTagQuery = computed(() => (youLoveItOnly.value ? YOU_LOVE_IT_TAG : undefined))

// Список постов и список кластеров не зависят друг от друга — запускаем
// оба useFetch без промежуточного await, дожидаемся общим Promise.all.
// См. предыдущий фикс навигационного джанка — цепочка последовательных
// await была источником ~2с задержки первого контента.
//
// ВАЖНО (лента вместо пагинации): этот useFetch отвечает только за ПЕРВУЮ
// страницу (offset всегда 0). Дальнейшие страницы грузятся вручную через
// loadMore() и копятся в loadedPosts — see ниже. offset больше не читается
// из ?page= в URL, лента всегда начинается с начала при заходе на сайт
// или смене фильтра.
const clustersFetch = useFetch<ApiClustersResponse>('/api/posts/clusters')
const firstPageFetch = useFetch<ApiPostList>('/api/posts', {
  query: { limit: PAGE_SIZE, offset: 0, cluster: activeCluster, tag: activeTagQuery },
  watch: [activeCluster, activeTagQuery],
})

const [{ data: clustersData }, { data: firstPageData, error: fetchError, pending }] =
  await Promise.all([clustersFetch, firstPageFetch])

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

// Счётчики постов на каждый чип — второстепенная деталь UI, грузится без
// блокировки первого рендера (см. предыдущий фикс).
const { data: countsData } = useAsyncData(
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
  { watch: [clusters], server: false, lazy: true },
)

function countFor(cluster: string): number {
  return countsData.value?.perCluster[cluster] ?? 0
}

// ---------------------------------------------------------------------
// Бесшовная лента: список постов, накопленный из первой SSR-страницы
// плюс всех дозагруженных клиентом. Аналог механизма из useNextPost.ts
// на странице поста, только тут листаем общую ленту `GET /api/posts` по
// offset, а не related-подбор следующего поста.
// ---------------------------------------------------------------------

const loadedPosts = ref<ApiPost[]>([])
const total = ref(0)
const nextOffset = ref(PAGE_SIZE)
const loadingMore = ref(false)
const loadMoreError = ref(false)

// Синхронизация с первой страницей — срабатывает и при первом заходе, и
// при каждой смене фильтра (activeCluster/activeTagQuery), потому что
// firstPageFetch сам перезапускается через watch. Сброс ленты на смену
// фильтра происходит автоматически, без отдельного кода.
watch(
  firstPageData,
  (val) => {
    loadedPosts.value = val?.posts ?? []
    total.value = val?.total ?? 0
    nextOffset.value = PAGE_SIZE
    loadMoreError.value = false
  },
  { immediate: true },
)

const hasMore = computed(() => loadedPosts.value.length < total.value)
const initialLoading = computed(() => pending.value && loadedPosts.value.length === 0)
const error = computed(() => (fetchError.value ? 'Не удалось загрузить посты.' : null))

async function loadMore() {
  if (loadingMore.value || pending.value || !hasMore.value) return
  loadingMore.value = true
  loadMoreError.value = false
  try {
    const nextPage = await $fetch<ApiPostList>('/api/posts', {
      query: {
        limit: PAGE_SIZE,
        offset: nextOffset.value,
        cluster: activeCluster.value,
        tag: activeTagQuery.value,
      },
    })
    loadedPosts.value = [...loadedPosts.value, ...nextPage.posts]
    total.value = nextPage.total
    nextOffset.value += PAGE_SIZE
  } catch {
    loadMoreError.value = true
  } finally {
    loadingMore.value = false
  }
}

// Сентинел в конце ленты + IntersectionObserver — тот же паттерн, что и
// в composables/useNextPost.ts/[slug].vue для бесшовной ленты постов.
// rootMargin с запасом вперёд, чтобы следующая страница подгружалась
// заранее, до того как пользователь реально долистает до низа.
const sentinel = ref<HTMLElement | null>(null)
const isSentinelVisible = ref(false)
let observer: IntersectionObserver | null = null

onMounted(() => {
  observer = new IntersectionObserver(
    ([entry]) => {
      isSentinelVisible.value = entry?.isIntersecting ?? false
    },
    { rootMargin: '600px 0px' },
  )
  if (sentinel.value) observer.observe(sentinel.value)
})

onUnmounted(() => {
  observer?.disconnect()
  observer = null
})

// Реагируем не только на появление сентинела в зоне видимости, но и на
// смену фильтра (hasMore/pending меняются) — если сентинел уже был виден
// на экране в момент сброса ленты, срабатывание IntersectionObserver не
// произойдёт само по себе (entry не меняется), поэтому проверяем условия
// явным watch, а не полагаемся только на колбэк обсёрвера.
watch([isSentinelVisible, hasMore, loadingMore, pending], () => {
  if (isSentinelVisible.value && hasMore.value && !loadingMore.value && !pending.value) {
    loadMore()
  }
})

// Показываем кнопку "Наверх", когда лента реально закончилась (кандидаты
// исчерпаны, не идёт дозагрузка) — то есть именно "самый конец", как
// просили, а не просто "проскроллил немного вниз".
const showBackToTop = computed(
  () => !hasMore.value && !loadingMore.value && loadedPosts.value.length > 0,
)

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function selectAll() {
  router.push({ query: { ...route.query, cluster: undefined, tag: undefined } })
}

function setCluster(cluster: string) {
  router.push({ query: { ...route.query, cluster, tag: undefined } })
}

function selectYouLoveIt() {
  router.push({ query: { ...route.query, cluster: undefined, tag: YOU_LOVE_IT_TAG } })
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

    <div class="filters" v-if="clusters.length" :class="{ 'filters--pending': pending }">
      <button
        type="button"
        class="filters__chip"
        :class="{ 'filters__chip--active': !activeCluster && !youLoveItOnly }"
        :disabled="pending"
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
        :disabled="pending"
        @click="setCluster(cluster)"
      >
        {{ clusterLabel(cluster) }}
        <span class="filters__count" v-if="countsData">{{ countFor(cluster) }}</span>
      </button>
      <button
        type="button"
        class="filters__chip"
        :class="{ 'filters__chip--active': youLoveItOnly }"
        :disabled="pending"
        @click="selectYouLoveIt"
      >
        #YouLoveIt
        <span class="filters__count" v-if="countsData">{{ countsData.youLoveIt }}</span>
      </button>
    </div>

    <p v-if="initialLoading">Загрузка...</p>
    <p v-else-if="error">{{ error }}</p>
    <template v-else-if="loadedPosts.length">
      <div class="posts-list" :class="{ 'posts-list--pending': pending && !initialLoading }">
        <PostCard
          v-for="post in loadedPosts"
          :key="post.slug"
          :slug="post.slug"
          :title="post.title"
          :date="post.date"
          :excerpt="post.excerpt"
          :tags="post.tags"
        />
      </div>

      <!-- Скелетоны на время дозагрузки следующей порции — тот же принцип
           пульсирующих плейсхолдеров, что в app.vue на странице поста. -->
      <div class="feed-skeletons" v-if="loadingMore" aria-hidden="true">
        <div class="feed-skeleton" v-for="n in 3" :key="n">
          <div class="skeleton skeleton--line skeleton--title"></div>
          <div class="skeleton skeleton--line"></div>
          <div class="skeleton skeleton--line skeleton--short"></div>
        </div>
      </div>

      <div class="feed-sentinel" ref="sentinel" aria-hidden="true"></div>

      <div class="feed-end" v-if="showBackToTop">
        <p class="feed-end__text">Вы посмотрели все посты.</p>
        <button type="button" class="feed-end__top-btn" @click="scrollToTop">
          ↑ Вернуться в начало
        </button>
      </div>

      <div class="feed-error" v-if="loadMoreError">
        <span>Не удалось загрузить ещё посты.</span>
        <button type="button" @click="loadMore">Повторить</button>
      </div>
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
  transform: scale(1);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    opacity 0.15s ease,
    transform 0.12s ease;
}

.filters__chip:active:not(:disabled) {
  transform: scale(0.93);
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

.feed-skeletons {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-top: 1.5rem;
}

.feed-skeleton {
  padding: 0.25rem 0;
}

.skeleton {
  background: var(--color-border);
  border-radius: 6px;
  animation: skeleton-pulse 1.4s ease-in-out infinite;
}

.skeleton--title {
  height: 1.3rem;
  width: 55%;
  margin-bottom: 0.6rem;
}

.skeleton--line {
  height: 0.85rem;
  margin-bottom: 0.5rem;
}

.skeleton--short {
  width: 40%;
}

@keyframes skeleton-pulse {
  0%,
  100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

.feed-sentinel {
  height: 1px;
}

.feed-end {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-top: 2rem;
}

.feed-end__text {
  opacity: 0.6;
  font-size: 0.9rem;
  margin: 0;
}

.feed-end__top-btn {
  padding: 0.5rem 1.1rem;
  border-radius: 999px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  font-size: 0.9rem;
  transform: scale(1);
  transition:
    background 0.15s ease,
    color 0.15s ease,
    border-color 0.15s ease,
    transform 0.12s ease;
}

.feed-end__top-btn:active {
  transform: scale(0.94);
}

.feed-end__top-btn:hover {
  background: var(--color-accent);
  color: var(--color-accent-text);
  border-color: var(--color-accent);
}

.feed-error {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  margin-top: 1.5rem;
  font-size: 0.9rem;
  opacity: 0.85;
}

.feed-error button {
  padding: 0.35rem 0.8rem;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: transparent;
  color: var(--color-text);
  cursor: pointer;
  transform: scale(1);
  transition: transform 0.12s ease;
}

.feed-error button:active {
  transform: scale(0.94);
}
</style>
