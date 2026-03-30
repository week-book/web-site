<script setup lang="ts">
definePageMeta({ ssr: false })
import { ref } from 'vue'
import SudokuGame from '../components/games/SudokuGame.vue'
import Game2048 from '../components/games/Game2048.vue'
import { useRoute, useRouter } from 'vue-router'
import { onMounted, watch } from 'vue'

type GameType = 'sudoku' | '2048'

const activeGame = ref<GameType>('sudoku')
const sudokuRef = ref<InstanceType<typeof import('~/components/games/SudokuGame.vue').default> | null>(null)
const game2048Ref = ref<InstanceType<typeof import('~/components/games/Game2048.vue').default> | null>(null)

function handleKey(e: KeyboardEvent) {
  if (activeGame.value === '2048') game2048Ref.value?.handleKey(e)
  else sudokuRef.value?.handleKey(e)
}

const route = useRoute()
const router = useRouter()

onMounted(() => {
  const game = route.query.game
  if (game === '2048' || game === 'sudoku') {
    activeGame.value = game
  }
})

function setGame(game: GameType) {
  activeGame.value = game
  router.replace({ query: { ...route.query, game } })
}

useSeoMeta({
  title: 'Игры',
  description: 'Судоку и 2048 — небольшой уголок для отдыха на Week-book',
  ogTitle: 'Игры — Week-book',
  ogDescription: 'Судоку и 2048 — небольшой уголок для отдыха на Week-book',
})
</script>

<template>
  <div class="games-page" tabindex="0" @keydown="handleKey">
    <div class="page-header">
      <h1 class="page-title">Игры</h1>
      <p class="page-sub">Небольшой уголок для отдыха</p>
    </div>

    <div class="game-selector">
      <button
        :class="['game-tab', activeGame === 'sudoku' ? 'game-tab--active' : '']"
        @click="setGame('sudoku')"
      >数独 Судоку</button>

      <button
        :class="['game-tab', activeGame === '2048' ? 'game-tab--active' : '']"
        @click="setGame('2048')"
      >2048</button>
    </div>

    <SudokuGame v-if="activeGame === 'sudoku'" ref="sudokuRef" />
    <Game2048 v-else ref="game2048Ref" />
  </div>
</template>

<style scoped>
.games-page { outline: none; }

.page-header { margin-bottom: 1.5rem; }
.page-title { font-size: 1.75rem; font-weight: 700; margin: 0 0 0.25rem; }
.page-sub { margin: 0; opacity: 0.55; font-size: 0.9rem; }

.game-selector { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; }
.game-tab {
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.45rem 1.1rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.55;
  transition: all 0.15s;
}
.game-tab:hover { opacity: 0.85; }
.game-tab--active { background: var(--color-text); color: var(--color-bg); opacity: 1; border-color: var(--color-text); }

.game-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-bg);
}
</style>
