import { uid } from "./id.ts"
import type { Desk, RoomShape, Student } from "./types.ts"

export const CANVAS_W = 1280
export const CANVAS_H = 800
export const DESK = 80
export const SNAP = 16

export function clampDesk(x: number, y: number): { x: number; y: number } {
  const sx = Math.round(x / SNAP) * SNAP
  const sy = Math.round(y / SNAP) * SNAP
  return {
    x: Math.min(CANVAS_W - DESK, Math.max(0, sx)),
    y: Math.min(CANVAS_H - DESK, Math.max(0, sy)),
  }
}

export function desksInReadingOrder(desks: Desk[]): Desk[] {
  return [...desks].sort((a, b) => a.y - b.y || a.x - b.x)
}

function makeDesk(x: number, y: number): Desk {
  return { id: uid(), ...clampDesk(x, y) }
}

function grid(count: number, cols: number, gapX: number, gapY: number): Desk[] {
  const safeCols = Math.max(1, cols)
  const rows = Math.ceil(count / safeCols)
  const totalW = safeCols * DESK + (safeCols - 1) * gapX
  const totalH = rows * DESK + (rows - 1) * gapY
  const startX = (CANVAS_W - totalW) / 2
  const startY = (CANVAS_H - totalH) / 2
  const desks: Desk[] = []
  for (let i = 0; i < count; i++) {
    const c = i % safeCols
    const r = Math.floor(i / safeCols)
    desks.push(makeDesk(startX + c * (DESK + gapX), startY + r * (DESK + gapY)))
  }
  return desks
}

function groupsOfFour(students: number): Desk[] {
  const clusters = Math.max(1, Math.ceil(students / 4))
  const cols = Math.min(3, clusters)
  const clusterGap = 72
  const inner = 8
  const clusterW = DESK * 2 + inner
  const clusterH = DESK * 2 + inner
  const rows = Math.ceil(clusters / cols)
  const totalW = cols * clusterW + (cols - 1) * clusterGap
  const totalH = rows * clusterH + (rows - 1) * clusterGap
  const startX = (CANVAS_W - totalW) / 2
  const startY = (CANVAS_H - totalH) / 2
  const desks: Desk[] = []
  for (let i = 0; i < clusters; i++) {
    const c = i % cols
    const r = Math.floor(i / cols)
    const ox = startX + c * (clusterW + clusterGap)
    const oy = startY + r * (clusterH + clusterGap)
    desks.push(makeDesk(ox, oy))
    desks.push(makeDesk(ox + DESK + inner, oy))
    desks.push(makeDesk(ox, oy + DESK + inner))
    desks.push(makeDesk(ox + DESK + inner, oy + DESK + inner))
  }
  return desks
}

function rowsOfDesks(students: number): Desk[] {
  const n = Math.max(students, 1)
  const cols = n <= 6 ? n : n <= 16 ? Math.ceil(n / 2) : 6
  return grid(n, cols, 48, 64)
}

function pairs(students: number): Desk[] {
  const n = Math.max(students + (students % 2), 2)
  const pairCount = n / 2
  const pairsPerRow = Math.min(4, pairCount)
  const pairRows = Math.ceil(pairCount / pairsPerRow)
  const inner = 8
  const pairGap = 64
  const rowGap = 72
  const pairW = DESK * 2 + inner
  const totalW = pairsPerRow * pairW + (pairsPerRow - 1) * pairGap
  const totalH = pairRows * DESK + (pairRows - 1) * rowGap
  const startX = (CANVAS_W - totalW) / 2
  const startY = (CANVAS_H - totalH) / 2
  const desks: Desk[] = []
  for (let i = 0; i < pairCount; i++) {
    const c = i % pairsPerRow
    const r = Math.floor(i / pairsPerRow)
    const ox = startX + c * (pairW + pairGap)
    const oy = startY + r * (DESK + rowGap)
    desks.push(makeDesk(ox, oy))
    desks.push(makeDesk(ox + DESK + inner, oy))
  }
  return desks
}

function uShape(students: number): Desk[] {
  const n = Math.max(students, 4)
  const margin = 56
  const gap = 18
  const bottomY = CANVAS_H - margin - DESK
  const top = margin
  const leftX = margin
  const rightX = CANVAS_W - margin - DESK
  const maxSide = Math.max(1, Math.floor((bottomY - gap - top) / (DESK + gap)))
  const innerLeft = leftX + DESK + gap * 2
  const innerRight = rightX - gap * 2
  const maxBottom = Math.max(1, Math.floor((innerRight - innerLeft) / (DESK + gap)) + 1)

  let left = Math.min(maxSide, Math.max(1, Math.round(n * 0.28)))
  let right = Math.min(maxSide, Math.max(1, Math.round(n * 0.28)))
  let bottom = n - left - right
  if (bottom < 1) {
    bottom = 1
    if (left >= right && left > 1) left -= 1
    else if (right > 1) right -= 1
  }
  if (bottom > maxBottom) {
    const overflow = bottom - maxBottom
    bottom = maxBottom
    const addLeft = Math.min(overflow, maxSide - left)
    left += addLeft
    right = Math.min(maxSide, right + (overflow - addLeft))
    bottom += n - left - right - bottom
  }

  const desks: Desk[] = []
  const sideSpan = bottomY - gap - DESK - top
  for (let i = 0; i < left; i++) {
    const y = left === 1 ? top : top + (sideSpan * i) / (left - 1)
    desks.push(makeDesk(leftX, y))
  }
  for (let i = 0; i < right; i++) {
    const y = right === 1 ? top : top + (sideSpan * i) / (right - 1)
    desks.push(makeDesk(rightX, y))
  }
  const span = Math.max(0, innerRight - innerLeft - DESK)
  for (let i = 0; i < bottom; i++) {
    const x = bottom === 1 ? innerLeft + span / 2 : innerLeft + (span * i) / (bottom - 1)
    desks.push(makeDesk(x, bottomY))
  }
  return desks
}

export function desksForShape(shape: RoomShape, studentCount: number): Desk[] {
  if (shape === "groups") return groupsOfFour(studentCount)
  if (shape === "rows") return rowsOfDesks(studentCount)
  if (shape === "pairs") return pairs(studentCount)
  return uShape(studentCount)
}

export function autoAssign(desks: Desk[], students: Student[]): Record<string, string> {
  const ordered = desksInReadingOrder(desks)
  const seats: Record<string, string> = {}
  students
    .filter((student) => !student.removed)
    .forEach((student, index) => {
      const desk = ordered[index]
      if (desk) seats[desk.id] = student.id
    })
  return seats
}

function shuffle<T>(items: T[]): T[] {
  const list = [...items]
  for (let i = list.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    const swap = list[i]
    list[i] = list[j]
    list[j] = swap
  }
  return list
}

export function shuffleAssign(desks: Desk[], students: Student[]): Record<string, string> {
  const list = shuffle(students.filter((student) => !student.removed))
  const spots = shuffle(desks)
  const seats: Record<string, string> = {}
  list.forEach((student, index) => {
    const desk = spots[index]
    if (desk) seats[desk.id] = student.id
  })
  return seats
}

export function addDesk(desks: Desk[]): Desk[] {
  let x = (CANVAS_W - DESK) / 2
  let y = (CANVAS_H - DESK) / 2
  for (let i = 0; i < 30; i++) {
    const spot = clampDesk(x, y)
    const blocked = desks.some((desk) => Math.abs(desk.x - spot.x) < 8 && Math.abs(desk.y - spot.y) < 8)
    if (!blocked) return [...desks, { id: uid(), ...spot }]
    x += SNAP * 2
    y += SNAP
  }
  return [...desks, { id: uid(), ...clampDesk(x, y) }]
}
