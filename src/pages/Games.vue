<script setup lang="ts">
import { ref, computed, onUnmounted } from 'vue';

// --- Sudoku Generator ---
function generateSolvedBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));

  function isValid(b: number[][], row: number, col: number, num: number): boolean {
    for (let i = 0; i < 9; i++) {
      if (b[row][i] === num || b[i][col] === num) return false;
    }
    const br = Math.floor(row / 3) * 3;
    const bc = Math.floor(col / 3) * 3;
    for (let r = br; r < br + 3; r++)
      for (let c = bc; c < bc + 3; c++)
        if (b[r][c] === num) return false;
    return true;
  }

  function solve(b: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValid(b, row, col, num)) {
              b[row][col] = num;
              if (solve(b)) return true;
              b[row][col] = 0;
            }
          }
          return false;
        }
      }
    }
    return true;
  }

  solve(board);
  return board;
}

const CLUES: Record<string, number> = { easy: 46, medium: 32, hard: 24 };

function generatePuzzle(difficulty: string): { puzzle: number[][], solution: number[][] } {
  const solution = generateSolvedBoard();
  const puzzle = solution.map(r => [...r]);
  const clues = CLUES[difficulty] ?? 32;
  const toRemove = 81 - clues;
  const cells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  for (let i = 0; i < toRemove; i++) {
    const idx = cells[i];
    puzzle[Math.floor(idx / 9)][idx % 9] = 0;
  }
  return { puzzle, solution };
}

// --- State ---
type Difficulty = 'easy' | 'medium' | 'hard';

const difficulty = ref<Difficulty>('medium');
const board = ref<number[][]>([]);
const given = ref<boolean[][]>([]);
const solution = ref<number[][]>([]);
const selected = ref<[number, number] | null>(null);
const errors = ref<Set<string>>(new Set());
const notes = ref<boolean>(() => false);
const noteMode = ref(false);
const cellNotes = ref<Set<number>[][]>([]);
const gameWon = ref(false);
const seconds = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

function startGame(diff?: Difficulty) {
  if (diff) difficulty.value = diff;
  const { puzzle, solution: sol } = generatePuzzle(difficulty.value);
  board.value = puzzle.map(r => [...r]);
  solution.value = sol;
  given.value = puzzle.map(r => r.map(v => v !== 0));
  errors.value = new Set();
  selected.value = null;
  gameWon.value = false;
  cellNotes.value = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => new Set<number>())
  );
  seconds.value = 0;
  if (timer) clearInterval(timer);
  timer = setInterval(() => { if (!gameWon.value) seconds.value++ }, 1000);
}

startGame();
onUnmounted(() => { if (timer) clearInterval(timer); });

const formattedTime = computed(() => {
  const m = Math.floor(seconds.value / 60).toString().padStart(2, '0');
  const s = (seconds.value % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
});

function selectCell(r: number, c: number) {
  if (gameWon.value) return;
  selected.value = [r, c];
}

function checkWin() {
  for (let r = 0; r < 9; r++)
    for (let c = 0; c < 9; c++)
      if (board.value[r][c] !== solution.value[r][c]) return;
  gameWon.value = true;
  if (timer) clearInterval(timer);
}

function inputNumber(num: number) {
  if (!selected.value || gameWon.value) return;
  const [r, c] = selected.value;
  if (given.value[r][c]) return;

  if (noteMode.value) {
    const notes = cellNotes.value[r][c];
    if (notes.has(num)) notes.delete(num);
    else notes.add(num);
    return;
  }

  board.value[r][c] = num;
  cellNotes.value[r][c].clear();
  const key = `${r}-${c}`;
  if (num !== 0 && num !== solution.value[r][c]) {
    errors.value.add(key);
  } else {
    errors.value.delete(key);
  }
  checkWin();
}

function handleKey(e: KeyboardEvent) {
  if (gameWon.value) return;
  const num = parseInt(e.key);
  if (!isNaN(num) && num >= 1 && num <= 9) inputNumber(num);
  if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0);
  if (!selected.value) return;
  const [r, c] = selected.value;
  if (e.key === 'ArrowUp' && r > 0) selected.value = [r - 1, c];
  if (e.key === 'ArrowDown' && r < 8) selected.value = [r + 1, c];
  if (e.key === 'ArrowLeft' && c > 0) selected.value = [r, c - 1];
  if (e.key === 'ArrowRight' && c < 8) selected.value = [r, c + 1];
}

function getCellClass(r: number, c: number) {
  const classes: string[] = ['cell'];
  if (given.value[r]?.[c]) classes.push('cell--given');
  if (errors.value.has(`${r}-${c}`)) classes.push('cell--error');
  if (selected.value) {
    const [sr, sc] = selected.value;
    if (r === sr && c === sc) classes.push('cell--selected');
    else if (r === sr || c === sc) classes.push('cell--highlight');
    else if (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3))
      classes.push('cell--highlight');
    else if (selected.value && board.value[r][c] !== 0 && board.value[r][c] === board.value[sr][sc])
      classes.push('cell--same');
  }
  if (c % 3 === 2 && c !== 8) classes.push('cell--border-right');
  if (r % 3 === 2 && r !== 8) classes.push('cell--border-bottom');
  return classes.join(' ');
}

const difficultyLabels: Record<Difficulty, string> = {
  easy: 'Легко',
  medium: 'Средне',
  hard: 'Сложно',
};
</script>

<template>
  <div class="games-page" tabindex="0" @keydown="handleKey">
    <div class="page-header">
      <h1 class="page-title">Игры</h1>
      <p class="page-sub">Небольшой уголок для отдыха</p>
    </div>

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
          <button v-for="n in 9" :key="n" class="num-btn" @click="inputNumber(n)">{{ n }}</button>
          <button class="num-btn num-btn--erase" @click="inputNumber(0)" title="Стереть">✕</button>
        </div>
        <div class="action-row">
          <button :class="['action-btn', noteMode ? 'action-btn--active' : '']" @click="noteMode = !noteMode">
            <span class="action-icon">✏</span> Заметки
          </button>
          <button class="action-btn" @click="startGame()">
            <span class="action-icon">↺</span> Новая игра
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  outline: none;
}

.page-header {
  margin-bottom: 2rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem;
}

.page-sub {
  margin: 0;
  opacity: 0.55;
  font-size: 0.9rem;
}

/* Card */
.game-card {
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.5rem;
  background: var(--color-bg);
}

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

.diff-btn--active {
  background: var(--color-text);
  color: var(--color-bg);
  opacity: 1;
}

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

.cell--given {
  font-weight: 700;
  opacity: 0.95;
}

.cell--selected {
  background: var(--color-text) !important;
  color: var(--color-bg) !important;
}

.cell--highlight {
  background: color-mix(in srgb, var(--color-text) 8%, transparent);
}

.cell--same {
  background: color-mix(in srgb, var(--color-text) 14%, transparent);
}

.cell--error {
  color: #e53e3e !important;
}

.cell--border-right {
  border-right: 2px solid var(--color-text);
}

.cell--border-bottom {
  border-bottom: 2px solid var(--color-text);
}

/* Notes grid inside cell */
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
  transition: background 0.1s, transform 0.08s;
}

.num-btn:hover {
  background: color-mix(in srgb, var(--color-text) 10%, transparent);
}

.num-btn:active { transform: scale(0.93); }

.num-btn--erase {
  font-size: 0.85rem;
  opacity: 0.6;
}

.action-row {
  display: flex;
  gap: 0.5rem;
}

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

.action-btn--active {
  background: var(--color-text);
  color: var(--color-bg);
  opacity: 1;
}

.action-icon { font-size: 1rem; }
</style>
