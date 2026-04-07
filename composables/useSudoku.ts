import { ref, computed, onUnmounted } from 'vue'

export type Difficulty = 'easy' | 'medium' | 'hard'

// ─── Pure helpers (no reactivity) ────────────────────────────────────────────

function isValidPlacement(b: number[][], row: number, col: number, num: number): boolean {
  for (let i = 0; i < 9; i++) {
    if (b[row][i] === num || b[i][col] === num) return false
  }
  const br = Math.floor(row / 3) * 3
  const bc = Math.floor(col / 3) * 3
  for (let r = br; r < br + 3; r++)
    for (let c = bc; c < bc + 3; c++) if (b[r][c] === num) return false
  return true
}

function generateSolvedBoard(): number[][] {
  const board = Array.from({ length: 9 }, () => Array(9).fill(0))
  function solve(b: number[][]): boolean {
    for (let row = 0; row < 9; row++) {
      for (let col = 0; col < 9; col++) {
        if (b[row][col] === 0) {
          const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5)
          for (const num of nums) {
            if (isValidPlacement(b, row, col, num)) {
              b[row][col] = num
              if (solve(b)) return true
              b[row][col] = 0
            }
          }
          return false
        }
      }
    }
    return true
  }
  solve(board)
  return board
}

function countSolutions(b: number[][], limit = 2): number {
  for (let row = 0; row < 9; row++) {
    for (let col = 0; col < 9; col++) {
      if (b[row][col] === 0) {
        let count = 0
        for (let num = 1; num <= 9; num++) {
          if (isValidPlacement(b, row, col, num)) {
            b[row][col] = num
            count += countSolutions(b, limit - count)
            b[row][col] = 0
            if (count >= limit) return count
          }
        }
        return count
      }
    }
  }
  return 1
}

const CLUES: Record<string, number> = { easy: 46, medium: 33, hard: 26 }

function generatePuzzle(difficulty: string): { puzzle: number[][]; solution: number[][] } {
  const solution = generateSolvedBoard()
  const puzzle = solution.map((r) => [...r])
  const clues = CLUES[difficulty] ?? 33
  const toRemove = 81 - clues
  const allCells = Array.from({ length: 81 }, (_, i) => i).sort(() => Math.random() - 0.5)
  const tried = new Set<number>()
  let removed = 0

  for (const idx of allCells) {
    if (removed >= toRemove) break
    if (tried.has(idx)) continue
    const r1 = Math.floor(idx / 9),
      c1 = idx % 9
    const r2 = 8 - r1,
      c2 = 8 - c1
    const idx2 = r2 * 9 + c2
    if (puzzle[r1][c1] === 0) {
      tried.add(idx)
      continue
    }
    const v1 = puzzle[r1][c1]
    puzzle[r1][c1] = 0
    tried.add(idx)
    let v2: number | null = null
    if (idx !== idx2 && !tried.has(idx2) && puzzle[r2][c2] !== 0 && removed + 2 <= toRemove) {
      v2 = puzzle[r2][c2]
      puzzle[r2][c2] = 0
      tried.add(idx2)
    }
    if (countSolutions(puzzle) === 1) {
      removed += v2 !== null ? 2 : 1
    } else {
      puzzle[r1][c1] = v1
      if (v2 !== null) puzzle[r2][c2] = v2
    }
  }

  if (removed < toRemove) {
    const remaining = Array.from({ length: 81 }, (_, i) => i)
      .filter((i) => puzzle[Math.floor(i / 9)][i % 9] !== 0)
      .sort(() => Math.random() - 0.5)
    for (const idx of remaining) {
      if (removed >= toRemove) break
      const r = Math.floor(idx / 9),
        c = idx % 9
      const v = puzzle[r][c]
      puzzle[r][c] = 0
      if (countSolutions(puzzle) === 1) removed++
      else puzzle[r][c] = v
    }
  }

  return { puzzle, solution }
}

// ─── Composable ──────────────────────────────────────────────────────────────

export function useSudoku() {
  const difficulty = ref<Difficulty>('medium')
  const board = ref<number[][]>([])
  const given = ref<boolean[][]>([])
  const solution = ref<number[][]>([])
  const selected = ref<[number, number] | null>(null)
  const errors = ref<Set<string>>(new Set())
  const noteMode = ref(false)
  const cellNotes = ref<Set<number>[][]>([])
  const gameWon = ref(false)
  const seconds = ref(0)
  let timer: ReturnType<typeof setInterval> | null = null

  const difficultyLabels: Record<Difficulty, string> = {
    easy: 'Легко',
    medium: 'Средне',
    hard: 'Сложно',
  }

  function startGame(diff?: Difficulty) {
    if (diff) difficulty.value = diff
    const { puzzle, solution: sol } = generatePuzzle(difficulty.value)
    board.value = puzzle.map((r) => [...r])
    solution.value = sol
    given.value = puzzle.map((r) => r.map((v) => v !== 0))
    errors.value = new Set()
    selected.value = null
    gameWon.value = false
    cellNotes.value = Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => new Set<number>()),
    )
    seconds.value = 0
    if (timer) clearInterval(timer)
    if (import.meta.client) {
      timer = setInterval(() => {
        if (!gameWon.value) seconds.value++
      }, 1000)
    }
  }

  onUnmounted(() => {
    if (timer) clearInterval(timer)
  })

  const formattedTime = computed(() => {
    const m = Math.floor(seconds.value / 60)
      .toString()
      .padStart(2, '0')
    const s = (seconds.value % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  })

  const completedDigits = computed(() => {
    const counts = new Map<number, number>()
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const v = board.value[r]?.[c]
        if (v && v === solution.value[r]?.[c]) counts.set(v, (counts.get(v) ?? 0) + 1)
      }
    const done = new Set<number>()
    for (const [num, count] of counts) if (count === 9) done.add(num)
    return done
  })

  function clearRelatedNotes(r: number, c: number, num: number) {
    for (let i = 0; i < 9; i++) {
      cellNotes.value[r][i].delete(num)
      cellNotes.value[i][c].delete(num)
    }
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let rr = br; rr < br + 3; rr++)
      for (let cc = bc; cc < bc + 3; cc++) cellNotes.value[rr][cc].delete(num)
  }

  function selectCell(r: number, c: number) {
    if (gameWon.value) return
    selected.value = [r, c]
  }

  function checkWin() {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (board.value[r][c] !== solution.value[r][c]) return
    gameWon.value = true
    if (timer) clearInterval(timer)
  }

  function inputNumber(num: number) {
    if (!selected.value || gameWon.value) return
    const [r, c] = selected.value
    if (given.value[r][c]) return
    if (noteMode.value) {
      const notes = cellNotes.value[r][c]
      if (num === 0) {
        notes.clear()
        return
      }
      if (notes.has(num)) notes.delete(num)
      else notes.add(num)
      return
    }
    board.value[r][c] = num
    cellNotes.value[r][c].clear()
    const key = `${r}-${c}`
    if (num !== 0 && num !== solution.value[r][c]) {
      errors.value.add(key)
    } else {
      errors.value.delete(key)
      if (num !== 0) clearRelatedNotes(r, c, num)
    }
    checkWin()
  }

  function getCellClass(r: number, c: number) {
    const classes = ['cell']
    if (given.value[r]?.[c]) classes.push('cell--given')
    if (errors.value.has(`${r}-${c}`)) classes.push('cell--error')
    if (selected.value) {
      const [sr, sc] = selected.value
      if (r === sr && c === sc) classes.push('cell--selected')
      else if (r === sr || c === sc) classes.push('cell--highlight')
      else if (Math.floor(r / 3) === Math.floor(sr / 3) && Math.floor(c / 3) === Math.floor(sc / 3))
        classes.push('cell--highlight')
      else if (board.value[r][c] !== 0 && board.value[r][c] === board.value[sr][sc])
        classes.push('cell--same')
    }
    if (c % 3 === 2 && c !== 8) classes.push('cell--border-right')
    if (r % 3 === 2 && r !== 8) classes.push('cell--border-bottom')
    return classes.join(' ')
  }

  function handleKey(e: KeyboardEvent) {
    if (gameWon.value) return
    if (e.key === 'n' || e.key === 'N' || e.key === 'Tab') {
      e.preventDefault()
      noteMode.value = !noteMode.value
      return
    }
    const num = parseInt(e.key)
    if (!isNaN(num) && num >= 1 && num <= 9) inputNumber(num)
    if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') inputNumber(0)
    if (!selected.value) return
    const [r, c] = selected.value
    if (e.key === 'ArrowUp' && r > 0) selected.value = [r - 1, c]
    if (e.key === 'ArrowDown' && r < 8) selected.value = [r + 1, c]
    if (e.key === 'ArrowLeft' && c > 0) selected.value = [r, c - 1]
    if (e.key === 'ArrowRight' && c < 8) selected.value = [r, c + 1]
  }

  return {
    difficulty,
    board,
    given,
    solution,
    selected,
    errors,
    noteMode,
    cellNotes,
    gameWon,
    seconds,
    difficultyLabels,
    startGame,
    formattedTime,
    completedDigits,
    selectCell,
    inputNumber,
    getCellClass,
    handleKey,
  }
}
