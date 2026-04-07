<script setup lang="ts">
import { onMounted } from 'vue'
import { use2048 } from '~/composables/use2048'

const {
  board,
  score,
  best,
  won,
  over,
  wonAcked,
  startGame,
  onTouchStart,
  onTouchEnd,
  tileStyle,
  tileFontSize,
  handleKey,
} = use2048()

onMounted(() => startGame())

defineExpose({ handleKey })
</script>

<template>
  <div class="game-card">
    <div class="game-header">
      <h2 class="game-title">2048</h2>
      <div class="game-meta">
        <div class="score-group">
          <div class="score-box">
            <div class="score-label">Счёт</div>
            <div class="score-val">{{ score }}</div>
          </div>
          <div class="score-box">
            <div class="score-label">Рекорд</div>
            <div class="score-val">{{ best }}</div>
          </div>
        </div>
        <button class="action-btn" @click="startGame()">
          <span class="action-icon">↺</span> Новая игра
        </button>
      </div>
    </div>

    <div class="grid-wrap" @touchstart.passive="onTouchStart" @touchend.passive="onTouchEnd">
      <!-- Win overlay -->
      <div v-if="won && !wonAcked" class="win-overlay">
        <div class="win-box">
          <div class="win-icon">🏆</div>
          <div class="win-text">2048!</div>
          <div class="win-subtext">Вы выиграли!</div>
          <div class="win-row">
            <button class="win-btn" @click="wonAcked = true">Продолжить</button>
            <button class="win-btn win-btn--outline" @click="startGame()">Заново</button>
          </div>
        </div>
      </div>

      <!-- Game over overlay -->
      <div v-if="over" class="win-overlay">
        <div class="win-box">
          <div class="win-icon">💔</div>
          <div class="win-text">Игра окончена</div>
          <div class="win-time">{{ score }}</div>
          <button class="win-btn" @click="startGame()">Ещё раз</button>
        </div>
      </div>

      <div class="grid">
        <template v-for="(row, r) in board" :key="r">
          <div
            v-for="(val, c) in row"
            :key="c"
            :class="['tile', val !== 0 ? 'tile--filled' : '']"
            :style="val !== 0 ? { ...tileStyle(val), fontSize: tileFontSize(val) } : {}"
          >
            {{ val !== 0 ? val : '' }}
          </div>
        </template>
      </div>
    </div>

    <p class="hint">Управление: стрелки на клавиатуре или свайп</p>
  </div>
</template>

<style scoped>
/* Header */
.game-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 1.25rem;
}
.game-title {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.5px;
}
.game-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

/* Score */
.score-group {
  display: flex;
  gap: 0.5rem;
}
.score-box {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.3rem 0.75rem;
  text-align: center;
  min-width: 4.5rem;
}
.score-label {
  font-size: 0.65rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.5;
  font-weight: 600;
}
.score-val {
  font-size: 1.05rem;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}

/* Grid */
.grid-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  touch-action: none;
}
.grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  grid-template-rows: repeat(4, 1fr);
  gap: 8px;
  background: color-mix(in srgb, var(--color-text) 12%, transparent);
  border-radius: 8px;
  padding: 8px;
  width: min(100%, 360px);
  aspect-ratio: 1;
  user-select: none;
}
.tile {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  font-weight: 700;
  transition:
    background 0.1s,
    color 0.1s;
}
.tile--filled {
  animation: pop 0.12s ease-out;
}

@keyframes pop {
  0% {
    transform: scale(0.85);
  }
  60% {
    transform: scale(1.06);
  }
  100% {
    transform: scale(1);
  }
}

/* Win / game-over overlay */
.win-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 8px;
}
.win-box {
  text-align: center;
  padding: 2rem;
}
.win-icon {
  font-size: 3rem;
  line-height: 1;
  margin-bottom: 0.5rem;
}
.win-text {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
}
.win-subtext {
  font-size: 0.9rem;
  opacity: 0.6;
  margin-bottom: 1rem;
}
.win-time {
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 1rem;
}
.win-row {
  display: flex;
  gap: 0.6rem;
  justify-content: center;
}
.win-btn {
  background: var(--color-text);
  color: var(--color-bg);
  border: none;
  padding: 0.6rem 1.5rem;
  border-radius: 8px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 600;
  transition: opacity 0.15s;
}
.win-btn:hover {
  opacity: 0.8;
}
.win-btn--outline {
  background: none;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* Action button */
.action-btn {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  background: none;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0.4rem 0.9rem;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.7;
  transition: opacity 0.15s;
}
.action-btn:hover {
  opacity: 1;
}
.action-icon {
  font-size: 1rem;
}

.hint {
  text-align: center;
  font-size: 0.78rem;
  opacity: 0.4;
  margin: 0;
}
</style>
