import { ref } from 'vue'

export type Board2048 = number[][]
export type Direction = 'left' | 'right' | 'up' | 'down'

const TILE_COLORS: Record<number, { bg: string; color: string }> = {
  2: { bg: '#eee4da', color: '#776e65' },
  4: { bg: '#ede0c8', color: '#776e65' },
  8: { bg: '#f2b179', color: '#f9f6f2' },
  16: { bg: '#f59563', color: '#f9f6f2' },
  32: { bg: '#f67c5f', color: '#f9f6f2' },
  64: { bg: '#f65e3b', color: '#f9f6f2' },
  128: { bg: '#edcf72', color: '#f9f6f2' },
  256: { bg: '#edcc61', color: '#f9f6f2' },
  512: { bg: '#edc850', color: '#f9f6f2' },
  1024: { bg: '#edc53f', color: '#f9f6f2' },
  2048: { bg: '#edc22e', color: '#f9f6f2' },
}

export function use2048() {
  const board = ref<Board2048>(Array.from({ length: 4 }, () => Array(4).fill(0)))
  const score = ref(0)
  const best = ref(0)
  const won = ref(false)
  const over = ref(false)
  const wonAcked = ref(false)

  function emptyCells(b: Board2048): [number, number][] {
    const cells: [number, number][] = []
    for (let r = 0; r < 4; r++)
      for (let c = 0; c < 4; c++)
        if (b[r][c] === 0) cells.push([r, c])
    return cells
  }

  function addTile(b: Board2048) {
    const empty = emptyCells(b)
    if (!empty.length) return
    const [r, c] = empty[Math.floor(Math.random() * empty.length)]
    b[r][c] = Math.random() < 0.9 ? 2 : 4
  }

  function startGame() {
    const b: Board2048 = Array.from({ length: 4 }, () => Array(4).fill(0))
    addTile(b)
    addTile(b)
    board.value = b
    score.value = 0
    won.value = false
    over.value = false
    wonAcked.value = false
  }

  function slideRow(row: number[]): [number[], number] {
    const nums = row.filter(v => v !== 0)
    let rowScore = 0
    const merged: number[] = []
    let i = 0
    while (i < nums.length) {
      if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
        merged.push(nums[i] * 2)
        rowScore += nums[i] * 2
        i += 2
      } else {
        merged.push(nums[i])
        i++
      }
    }
    while (merged.length < 4) merged.push(0)
    return [merged, rowScore]
  }

  function move(dir: Direction) {
    if (over.value) return
    if (won.value && !wonAcked.value) return

    let b = board.value.map(r => [...r])
    let totalScore = 0
    let moved = false

    const transpose = (m: number[][]) => m[0].map((_, i) => m.map(r => r[i]))
    const reverseRows = (m: number[][]) => m.map(r => [...r].reverse())

    function processLeft(m: number[][]): [number[][], boolean] {
      let changed = false
      const result = m.map(row => {
        const [newRow, s] = slideRow(row)
        totalScore += s
        if (newRow.some((v, i) => v !== row[i])) changed = true
        return newRow
      })
      return [result, changed]
    }

    if (dir === 'left') {
      [b, moved] = processLeft(b)
    } else if (dir === 'right') {
      [b, moved] = processLeft(reverseRows(b))
      b = reverseRows(b)
    } else if (dir === 'up') {
      [b, moved] = processLeft(transpose(b))
      b = transpose(b)
    } else {
      [b, moved] = processLeft(reverseRows(transpose(b)))
      b = transpose(reverseRows(b))
    }

    if (!moved) return

    score.value += totalScore
    if (score.value > best.value) best.value = score.value

    addTile(b)
    board.value = b

    if (!won.value && b.some(r => r.some(v => v === 2048))) won.value = true

    if (emptyCells(b).length === 0) {
      let canMove = false
      outer:
      for (let r = 0; r < 4; r++) {
        for (let c = 0; c < 4; c++) {
          if (c < 3 && b[r][c] === b[r][c + 1]) { canMove = true; break outer }
          if (r < 3 && b[r][c] === b[r + 1][c]) { canMove = true; break outer }
        }
      }
      if (!canMove) over.value = true
    }
  }

  let touchStartX = 0
  let touchStartY = 0

  function onTouchStart(e: TouchEvent) {
    touchStartX = e.touches[0].clientX
    touchStartY = e.touches[0].clientY
  }

  function onTouchEnd(e: TouchEvent) {
    const dx = e.changedTouches[0].clientX - touchStartX
    const dy = e.changedTouches[0].clientY - touchStartY
    if (Math.abs(dx) < 20 && Math.abs(dy) < 20) return
    move(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up'))
  }

  function tileStyle(val: number): Record<string, string> {
    const t = TILE_COLORS[val]
    return t ? { background: t.bg, color: t.color } : { background: '#3d3a32', color: '#f9f6f2' }
  }

  function tileFontSize(val: number): string {
    if (val >= 1000) return '1.1rem'
    if (val >= 100) return '1.4rem'
    return '1.8rem'
  }

  function handleKey(e: KeyboardEvent) {
    const map: Record<string, Direction> = {
      ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
    }
    if (map[e.key]) { e.preventDefault(); move(map[e.key]) }
  }

  return {
    board, score, best, won, over, wonAcked,
    startGame, move, onTouchStart, onTouchEnd, tileStyle, tileFontSize, handleKey,
  }
}
