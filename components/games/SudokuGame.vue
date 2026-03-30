<script setup lang="ts">
import { onMounted } from 'vue'
import { useSudoku, type Difficulty } from '~/composables/useSudoku'

const {
  difficulty, board, noteMode, cellNotes, gameWon,
  difficultyLabels, startGame, formattedTime, completedDigits,
  selectCell, inputNumber, getCellClass, handleKey,
} = useSudoku()

onMounted(() => startGame())

defineExpose({ handleKey })
</script>

<template>
  <div class="game-card">
    <div class="game-header">
      <h2 class="game-title">数独 <span class="game-title-sub">Судоку</span></h2>
      <div class="game-meta">
        <div class="timer">{{ formattedTime }}</div>
        <div class="difficulty-tabs">
          <button
            v-for="(label, key) in difficultyLabels"
            :key="key"
            :class="['diff-btn', difficulty === key ? 'diff-btn--active' : '']"
            @click="startGame(key as Difficulty)"
          >{{ label }}</button>
        </div>
      </div>
    </div>

    <div class="board-wrap">
      <div v-if="gameWon" class="win-overlay">
        <div class="win-box">
          <div class="win-icon">✓</div>
          <div class="win-text">Решено!</div>
          <div class="win-time">{{ formattedTime }}</div>
          <button class="win-btn" @click="startGame()">Ещё раз</button>
        </div>
      </div>

      <div class="board">
        <template v-for="(row, r) in board" :key="r">
          <div
            v-for="(val, c) in row"
            :key="c"
            :class="getCellClass(r, c)"
            @click="selectCell(r, c)"
          >
            <template v-if="val !== 0">{{ val }}</template>
            <div v-else-if="cellNotes[r][c].size > 0" class="notes-grid">
              <span v-for="n in 9" :key="n" class="note">{{ cellNotes[r][c].has(n) ? n : '' }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div class="controls">
      <div class="numpad">
        <button
          v-for="n in 9"
          :key="n"
          :class="['num-btn', completedDigits.has(n) ? 'num-btn--completed' : '']"
          :disabled="completedDigits.has(n)"
          @click="inputNumber(n)"
        >{{ n }}</button>
        <button class="num-btn num-btn--erase" @click="inputNumber(0)" title="Стереть">✕</button>
      </div>
      <div class="action-row">
        <button
          :class="['action-btn', noteMode ? 'action-btn--active' : '']"
          title="Переключить режим заметок (N / Tab)"
          @click="noteMode = !noteMode"
        >
          <span class="action-icon">✏</span> Заметки <kbd class="action-kbd">N</kbd>
        </button>
        <button class="action-btn" @click="startGame()">
          <span class="action-icon">↺</span> Новая игра
        </button>
      </div>
    </div>
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
.game-title-sub {
  font-size: 0.9rem;
  font-weight: 400;
  opacity: 0.5;
  margin-left: 0.3rem;
}
.game-meta {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.timer {
  font-size: 1.1rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  letter-spacing: 1px;
  opacity: 0.8;
  min-width: 3.5rem;
}
.difficulty-tabs {
  display: flex;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  overflow: hidden;
}
.diff-btn {
  background: none;
  border: none;
  border-right: 1px solid var(--color-border);
  padding: 0.3rem 0.75rem;
  font-size: 0.82rem;
  cursor: pointer;
  color: var(--color-text);
  opacity: 0.6;
  transition: all 0.15s;
}
.diff-btn:last-child { border-right: none; }
.diff-btn:hover { opacity: 1; }
.diff-btn--active { background: var(--color-text); color: var(--color-bg); opacity: 1; }

/* Board */
.board-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 1.25rem;
}
.board {
  display: grid;
  grid-template-columns: repeat(9, 1fr);
  grid-template-rows: repeat(9, 1fr);
  border: 2px solid var(--color-text);
  border-radius: 6px;
  overflow: hidden;
  width: min(100%, 420px);
  aspect-ratio: 1;
  user-select: none;
}
.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--color-border);
  font-size: clamp(0.9rem, 2.5vw, 1.2rem);
  cursor: pointer;
  transition: background 0.1s;
  position: relative;
}
.cell--given { font-weight: 700; opacity: 0.95; }
.cell--selected { background: var(--color-text) !important; color: var(--color-bg) !important; }
.cell--highlight { background: color-mix(in srgb, var(--color-text) 8%, transparent); }
.cell--same { background: color-mix(in srgb, var(--color-text) 14%, transparent); }
.cell--error { color: #e53e3e !important; }
.cell--border-right { border-right: 2px solid var(--color-text); }
.cell--border-bottom { border-bottom: 2px solid var(--color-text); }

.notes-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  width: 100%;
  height: 100%;
  padding: 2px;
}
.note {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(0.45rem, 1.1vw, 0.6rem);
  opacity: 0.65;
  line-height: 1;
}

/* Win overlay */
.win-overlay {
  position: absolute;
  inset: 0;
  background: color-mix(in srgb, var(--color-bg) 88%, transparent);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  border-radius: 6px;
}
.win-box { text-align: center; padding: 2rem; }
.win-icon { font-size: 3rem; line-height: 1; margin-bottom: 0.5rem; }
.win-text { font-size: 1.5rem; font-weight: 700; margin-bottom: 0.25rem; }
.win-time {
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 1rem;
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
.win-btn:hover { opacity: 0.8; }

/* Controls */
.controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: center;
}
.numpad {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 0.35rem;
  width: min(100%, 420px);
}
.num-btn {
  aspect-ratio: 1;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: none;
  font-size: clamp(0.9rem, 2vw, 1.15rem);
  font-weight: 600;
  cursor: pointer;
  color: var(--color-text);
  transition: background 0.1s, transform 0.08s, opacity 0.2s;
}
.num-btn:hover:not(:disabled) { background: color-mix(in srgb, var(--color-text) 10%, transparent); }
.num-btn:active:not(:disabled) { transform: scale(0.93); }
.num-btn--erase { font-size: 0.85rem; opacity: 0.6; }
.num-btn--completed { opacity: 0.2; cursor: not-allowed; border-style: dashed; }

.action-row { display: flex; gap: 0.5rem; }
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
  transition: opacity 0.15s, background 0.15s;
}
.action-btn:hover { opacity: 1; }
.action-btn--active { background: var(--color-text); color: var(--color-bg); opacity: 1; }
.action-icon { font-size: 1rem; }
.action-kbd {
  font-family: inherit;
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.1rem 0.3rem;
  border-radius: 4px;
  border: 1px solid currentColor;
  opacity: 0.5;
  margin-left: 0.15rem;
}
</style>
