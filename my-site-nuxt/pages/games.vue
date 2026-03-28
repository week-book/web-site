<script setup lang="ts">
definePageMeta({ ssr: false });
import { ref, computed, onUnmounted } from 'vue';

// ===================== SHARED =====================
type GameType = 'sudoku' | '2048';
const activeGame = ref<GameType>('sudoku');

// ===================== SUDOKU HELPERS =====================
function isValidPlacement(b: number[][], row: number, col: number, num: number): boolean {
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

function generateSolvedBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0));
  function solve(b: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
          for (const num of nums) {
            if (isValidPlacement(b, row, col, num)) {
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

function countSolutions(b: number[][], limit = 2): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (b[row][col] === 0) {
        let count = 0;
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(b, row, col, num)) {
            b[row][col] = num;
            count += countSolutions(b, limit - count);
            b[row][col] = 0;
            if (count >= limit) return count;
          }
        }
        return count;
      }
    }
  }
  return 1;
}

const CLUES: Record<string, number> = { easy: 46, medium: 33, hard: 26 };

function generatePuzzle(difficulty: string): { puzzle: number[][], solution: number[][] } {
  const solution = generateSolvedBoard();
  const puzzle = solution.map(r => [...r]);
  const clues = CLUES[difficulty] ?? 33;
  const toRemove = 81 - clues;
  const allCells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5);
  const tried = new Set<number>();
  let removed = 0;

  for (const idx of allCells) {
    if (removed >= toRemove) break;
    if (tried.has(idx)) continue;
    const r1 = Math.floor(idx / 9), c1 = idx % 9;
    const r2 = 8 - r1, c2 = 8 - c1;
    const idx2 = r2 * 9 + c2;
    if (puzzle[r1][c1] === 0) { tried.add(idx); continue; }
    const v1 = puzzle[r1][c1];
    puzzle[r1][c1] = 0;
    tried.add(idx);
    let v2: number | null = null;
    if (idx !== idx2 && !tried.has(idx2) && puzzle[r2][c2] !== 0 && removed + 2 <= toRemove) {
      v2 = puzzle[r2][c2];
      puzzle[r2][c2] = 0;
      tried.add(idx2);
    }
    if (countSolutions(puzzle) === 1) {
      removed += v2 !== null ? 2 : 1;
    } else {
      puzzle[r1][c1] = v1;
      if (v2 !== null) puzzle[r2][c2] = v2;
    }
  }

  if (removed < toRemove) {
    const remaining = Array.from({ length: 81 }, (_, i) => i)
      .filter(i => puzzle[Math.floor(i / 9)][i % 9] !== 0)
      .sort(() => Math.random() - 0.5);
    for (const idx of remaining) {
      if (removed >= toRemove) break;
      const r = Math.floor(idx / 9), c = idx % 9;
      const v = puzzle[r][c];
      puzzle[r][c] = 0;
      if (countSolutions(puzzle) === 1) {
        removed++;
      } else {
        puzzle[r][c] = v;
      }
    }
  }

  return { puzzle, solution };
}

// ===================== SUDOKU STATE =====================
type Difficulty = 'easy' | 'medium' | 'hard';
const difficulty = ref<Difficulty>('medium');
const board = ref<number[][]>([]);
const given = ref<boolean[][]>([]);
const solution = ref<number[][]>([]);
const selected = ref<[number, number] | null>(null);
const errors = ref<Set<string>>(new Set());
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

const completedDigits = computed(() => {
  const counts = new Map<number, number>();
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const v = board.value[r]?.[c];
      if (v && v === solution.value[r]?.[c]) {
        counts.set(v, (counts.get(v) ?? 0) + 1);
      }
    }
  }
  const done = new Set<number>();
  for (const [num, count] of counts) {
    if (count === 9) done.add(num);
  }
  return done;
});

function clearRelatedNotes(r: number, c: number, num: number) {
  for (let i = 0; i < 9; i++) {
    cellNotes.value[r][i].delete(num);
    cellNotes.value[i][c].delete(num);
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let rr = br; rr < br + 3; rr++)
    for (let cc = bc; cc < bc + 3; cc++)
      cellNotes.value[rr][cc].delete(num);
}

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
    if (num === 0) { notes.clear(); return; }
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
    if (num !== 0) clearRelatedNotes(r, c, num);
  }
  checkWin();
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
    else if (board.value[r][c] !== 0 && board.value[r][c] === board.value[sr][sc])
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

// ===================== 2048 =====================
type Board2048 = number[][];

const g2048Board = ref<Board2048>(Array.from({ length: 4 }, () => Array(4).fill(0)));
const g2048Score = ref(0);
const g2048Best = ref(0);
const g2048Won = ref(false);
const g2048Over = ref(false);
const g2048WonAcked = ref(false);

function g2048EmptyCells(b: Board2048): [number, number][] {
  const cells: [number, number][] = [];
  for (let r = 0; r < 4; r++)
    for (let c = 0; c < 4; c++)
      if (b[r][c] === 0) cells.push([r, c]);
  return cells;
}

function g2048AddTile(b: Board2048) {
  const empty = g2048EmptyCells(b);
  if (!empty.length) return;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
}

function g2048Start() {
  const b: Board2048 = Array.from({ length: 4 }, () => Array(4).fill(0));
  g2048AddTile(b);
  g2048AddTile(b);
  g2048Board.value = b;
  g2048Score.value = 0;
  g2048Won.value = false;
  g2048Over.value = false;
  g2048WonAcked.value = false;
}

g2048Start();

function slideRow(row: number[]): [number[], number] {
  const nums = row.filter(v => v !== 0);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < nums.length) {
    if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
      merged.push(nums[i] * 2);
      score += nums[i] * 2;
      i += 2;
    } else {
      merged.push(nums[i]);
      i++;
    }
  }
  while (merged.length < 4) merged.push(0);
  return [merged, score];
}

type Direction = 'left' | 'right' | 'up' | 'down';

function g2048Move(dir: Direction) {
  if (g2048Over.value) return;
  if (g2048Won.value && !g2048WonAcked.value) return;

  let b = g2048Board.value.map(r => [...r]);
  let totalScore = 0;
  let moved = false;

  const transpose = (m: number[][]) => m[0].map((_, i) => m.map(r => r[i]));
  const reverseRows = (m: number[][]) => m.map(r => [...r].reverse());

  function processLeft(m: number[][]): [number[][], boolean] {
    let changed = false;
    const result = m.map(row => {
      const [newRow, s] = slideRow(row);
      totalScore += s;
      if (newRow.some((v, i) => v !== row[i])) changed = true;
      return newRow;
    });
    return [result, changed];
  }

  if (dir === 'left') {
    [b, moved] = processLeft(b);
  } else if (dir === 'right') {
    [b, moved] = processLeft(reverseRows(b));
    b = reverseRows(b);
  } else if (dir === 'up') {
    [b, moved] = processLeft(transpose(b));
    b = transpose(b);
  } else {
    [b, moved] = processLeft(reverseRows(transpose(b)));
    b = transpose(reverseRows(b));
  }

  if (!moved) return;

  g2048Score.value += totalScore;
  if (g2048Score.value > g2048Best.value) g2048Best.value = g2048Score.value;

  g2048AddTile(b);
  g2048Board.value = b;

  if (!g2048Won.value && b.some(r => r.some(v => v === 2048))) {
    g2048Won.value = true;
  }

  if (g2048EmptyCells(b).length === 0) {
    let canMove = false;
    outer:
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        if (c < 3 && b[r][c] === b[r][c + 1]) { canMove = true; break outer; }
        if (r < 3 && b[r][c] === b[r + 1][c]) { canMove = true; break outer; }
      }
    }
    if (!canMove) g2048Over.value = true;
  }
}

// Touch swipe
let touchStartX = 0;
let touchStartY = 0;

function onTouchStart(e: TouchEvent) {
  touchStartX = e.touches[0].clientX;
  touchStartY = e.touches[0].clientY;
}

function onTouchEnd(e: TouchEvent) {
  const dx = e.changedTouches[0].clientX - touchStartX;
  const dy = e.changedTouches[0].clientY - touchStartY;
  if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return;
  if (Math.abs(dx) > Math.abs(dy)) g2048Move(dx > 0 ? 'right' : 'left');
  else g2048Move(dy > 0 ? 'down' : 'up');
}

const TILE_COLORS: Record<number, { bg: string; color: string }> = {
  2:    { bg: '#eee4da', color: '#776e65' },
  4:    { bg: '#ede0c8', color: '#776e65' },
  8:    { bg: '#f2b179', color: '#f9f6f2' },
  16:   { bg: '#f59563', color: '#f9f6f2' },
  32:   { bg: '#f67c5f', color: '#f9f6f2' },
  64:   { bg: '#f65e3b', color: '#f9f6f2' },
  128:  { bg: '#edcf72', color: '#f9f6f2' },
  256:  { bg: '#edcc61', color: '#f9f6f2' },
  512:  { bg: '#edc850', color: '#f9f6f2' },
  1024: { bg: '#edc53f', color: '#f9f6f2' },
  2048: { bg: '#edc22e', color: '#f9f6f2' },
};

function tileStyle(val: number): Record<string, string> {
  const t = TILE_COLORS[val];
  return t
    ? { background: t.bg, color: t.color }
    : { background: '#3d3a32', color: '#f9f6f2' };
}

function tileFontSize(val: number): string {
  if (val >= 1000) return '1.1rem';
  if (val >= 100) return '1.4rem';
  return '1.8rem';
}

// ===================== KEYBOARD =====================
function handleKey(e: KeyboardEvent) {
  if (activeGame.value === '2048') {
    const map: Record<string, Direction> = {
      ArrowLeft: 'left', ArrowRight: 'right',
      ArrowUp: 'up', ArrowDown: 'down',
    };
    if (map[e.key]) {
      e.preventDefault();
      g2048Move(map[e.key]);
    }
    return;
  }

  // Sudoku keys
  if (gameWon.value) return;
  if (e.key === 'n' || e.key === 'N' || e.key === 'Tab') {
    e.preventDefault();
    noteMode.value = !noteMode.value;
    return;
  }
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
</script>

<template>
  <div class="games-page" tabindex="0" @keydown="handleKey">
    <div class="page-header">
      <h1 class="page-title">Игры</h1>
      <p class="page-sub">Небольшой уголок для отдыха</p>
    </div>

    <!-- Game selector -->
    <div class="game-selector">
      <button
        :class="['game-tab', activeGame === 'sudoku' ? 'game-tab--active' : '']"
        @click="activeGame = 'sudoku'"
      >数独 Судоку</button>
      <button
        :class="['game-tab', activeGame === '2048' ? 'game-tab--active' : '']"
        @click="activeGame = '2048'"
      >2048</button>
    </div>

    <!-- ======= SUDOKU ======= -->
    <div v-if="activeGame === 'sudoku'" class="game-card">
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
          <button :class="['action-btn', noteMode ? 'action-btn--active' : '']" @click="noteMode = !noteMode" title="Переключить режим заметок (N / Tab)">
            <span class="action-icon">✏</span> Заметки <kbd class="action-kbd">N</kbd>
          </button>
          <button class="action-btn" @click="startGame()">
            <span class="action-icon">↺</span> Новая игра
          </button>
        </div>
      </div>
    </div>

    <!-- ======= 2048 ======= -->
    <div v-else class="game-card">
      <div class="game-header">
        <h2 class="game-title">2048</h2>
        <div class="game-meta">
          <div class="score-group">
            <div class="score-box">
              <div class="score-label">Счёт</div>
              <div class="score-val">{{ g2048Score }}</div>
            </div>
            <div class="score-box">
              <div class="score-label">Рекорд</div>
              <div class="score-val">{{ g2048Best }}</div>
            </div>
          </div>
          <button class="action-btn" @click="g2048Start()">
            <span class="action-icon">↺</span> Новая игра
          </button>
        </div>
      </div>

      <div
        class="g2048-wrap"
        @touchstart.passive="onTouchStart"
        @touchend.passive="onTouchEnd"
      >
        <!-- Win overlay -->
        <div v-if="g2048Won && !g2048WonAcked" class="win-overlay">
          <div class="win-box">
            <div class="win-icon">🏆</div>
            <div class="win-text">2048!</div>
            <div class="win-subtext">Вы выиграли!</div>
            <div class="win-row">
              <button class="win-btn" @click="g2048WonAcked = true">Продолжить</button>
              <button class="win-btn win-btn--outline" @click="g2048Start()">Заново</button>
            </div>
          </div>
        </div>

        <!-- Game over overlay -->
        <div v-if="g2048Over" class="win-overlay">
          <div class="win-box">
            <div class="win-icon">💔</div>
            <div class="win-text">Игра окончена</div>
            <div class="win-time">{{ g2048Score }}</div>
            <button class="win-btn" @click="g2048Start()">Ещё раз</button>
          </div>
        </div>

        <div class="g2048-grid">
          <template v-for="(row, r) in g2048Board" :key="r">
            <div
              v-for="(val, c) in row"
              :key="c"
              :class="['g2048-cell', val !== 0 ? 'g2048-cell--filled' : '']"
              :style="val !== 0 ? { ...tileStyle(val), fontSize: tileFontSize(val) } : {}"
            >
              {{ val !== 0 ? val : '' }}
            </div>
          </template>
        </div>
      </div>

      <p class="g2048-hint">Управление: стрелки на клавиатуре или свайп</p>
    </div>
  </div>
</template>

<style scoped>
.games-page {
  outline: none;
}

.page-header {
  margin-bottom: 1.5rem;
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

/* Game selector tabs */
.game-selector {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.25rem;
}

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

.game-tab--active {
  background: var(--color-text);
  color: var(--color-bg);
  opacity: 1;
  border-color: var(--color-text);
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

/* Sudoku Board */
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

/* Sudoku Win overlay */
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
.win-subtext { font-size: 0.9rem; opacity: 0.6; margin-bottom: 1rem; }
.win-time {
  font-size: 2rem;
  font-variant-numeric: tabular-nums;
  font-weight: 600;
  opacity: 0.6;
  margin-bottom: 1rem;
}
.win-row { display: flex; gap: 0.6rem; justify-content: center; }
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
.win-btn--outline {
  background: none;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

/* Sudoku Controls */
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
  letter-spacing: 0;
}

/* ===== 2048 ===== */
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

.g2048-wrap {
  position: relative;
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  touch-action: none;
}

.g2048-grid {
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

.g2048-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: color-mix(in srgb, var(--color-text) 6%, transparent);
  font-weight: 700;
  transition: background 0.1s, color 0.1s;
}

.g2048-cell--filled {
  animation: pop 0.12s ease-out;
}

@keyframes pop {
  0%   { transform: scale(0.85); }
  60%  { transform: scale(1.06); }
  100% { transform: scale(1); }
}

.g2048-hint {
  text-align: center;
  font-size: 0.78rem;
  opacity: 0.4;
  margin: 0;
}
</style>
