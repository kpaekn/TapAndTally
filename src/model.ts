import type { Behavior, ClassRoom, Student, TallyEvent } from "./types.ts"

export type RangeKey = "today" | "week" | "month" | "all"

export function isoDate(date: Date): string {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function parseISO(value: string): Date {
  const [year, month, day] = value.split("-").map(Number)
  return new Date(year, month - 1, day)
}

export function todayISO(): string {
  return isoDate(new Date())
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  next.setDate(next.getDate() + days)
  return next
}

export function startOfWeek(date: Date): Date {
  const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const day = copy.getDay()
  const diff = day === 0 ? -6 : 1 - day
  copy.setDate(copy.getDate() + diff)
  return copy
}

export function weekdays(anchor = new Date()): Date[] {
  const start = startOfWeek(anchor)
  return [0, 1, 2, 3, 4].map((offset) => addDays(start, offset))
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ""}${parts[parts.length - 1][0] ?? ""}`.toUpperCase()
}

export function activeStudents(students: Student[]): Student[] {
  return students.filter((student) => !student.removed)
}

export function countOn(events: TallyEvent[], studentId: string, behaviorId: string, date: string): number {
  return events.reduce((sum, event) => {
    if (event.type !== "count" || event.studentId !== studentId || event.behaviorId !== behaviorId || event.date !== date) {
      return sum
    }
    return sum + event.value
  }, 0)
}

export function countBetween(
  events: TallyEvent[],
  studentId: string,
  behaviorId: string,
  start: string,
  end: string,
): number {
  return events.reduce((sum, event) => {
    if (event.type !== "count" || event.studentId !== studentId || event.behaviorId !== behaviorId) return sum
    if (event.date < start || event.date > end) return sum
    return sum + event.value
  }, 0)
}

export function toggleOn(events: TallyEvent[], studentId: string, behaviorId: string, date: string): boolean {
  let value = 0
  let seen = false
  for (const event of events) {
    if (event.type !== "toggle" || event.studentId !== studentId || event.behaviorId !== behaviorId || event.date !== date) {
      continue
    }
    seen = true
    value = event.value
  }
  return seen && value === 1
}

export function daysToggled(
  events: TallyEvent[],
  studentId: string,
  behaviorId: string,
  start: string,
  end: string,
): number {
  const dates = new Set<string>()
  for (const event of events) {
    if (event.type === "toggle" && event.studentId === studentId && event.behaviorId === behaviorId) {
      if (event.date >= start && event.date <= end) dates.add(event.date)
    }
  }
  let days = 0
  for (const date of dates) {
    if (toggleOn(events, studentId, behaviorId, date)) days += 1
  }
  return days
}

export function isAbsent(events: TallyEvent[], studentId: string, date: string): boolean {
  let value = 0
  let seen = false
  for (const event of events) {
    if (event.type !== "absent" || event.studentId !== studentId || event.date !== date) continue
    seen = true
    value = event.value
  }
  return seen && value === 1
}

export function absentDays(events: TallyEvent[], studentId: string, start: string, end: string): number {
  const dates = new Set<string>()
  for (const event of events) {
    if (event.type === "absent" && event.studentId === studentId && event.date >= start && event.date <= end) {
      dates.add(event.date)
    }
  }
  let days = 0
  for (const date of dates) {
    if (isAbsent(events, studentId, date)) days += 1
  }
  return days
}

export function behaviorValueOnDay(events: TallyEvent[], studentId: string, behavior: Behavior, date: string): number {
  if (behavior.kind === "count") return Math.max(0, countOn(events, studentId, behavior.id, date))
  return toggleOn(events, studentId, behavior.id, date) ? 1 : 0
}

export function behaviorValueInRange(
  events: TallyEvent[],
  studentId: string,
  behavior: Behavior,
  start: string,
  end: string,
): number {
  if (behavior.kind === "count") return Math.max(0, countBetween(events, studentId, behavior.id, start, end))
  return daysToggled(events, studentId, behavior.id, start, end)
}

export function hasMarkOnDate(room: ClassRoom, studentId: string, date: string): boolean {
  if (isAbsent(room.events, studentId, date)) return true
  return room.behaviors.some((behavior) => behaviorValueOnDay(room.events, studentId, behavior, date) > 0)
}

export interface DateRange {
  start: string
  end: string
}

export function rangeBounds(key: RangeKey, events: TallyEvent[], today = todayISO()): DateRange {
  if (key === "today") return { start: today, end: today }
  if (key === "week") {
    const days = weekdays(parseISO(today))
    return { start: isoDate(days[0]), end: isoDate(days[4]) }
  }
  if (key === "month") {
    const now = parseISO(today)
    const start = new Date(now.getFullYear(), now.getMonth(), 1)
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    return { start: isoDate(start), end: isoDate(end) }
  }
  const dates = events.map((event) => event.date).sort()
  if (dates.length === 0) return { start: today, end: today }
  return { start: dates[0], end: dates[dates.length - 1] }
}

export function eachDate(start: string, end: string): string[] {
  const days: string[] = []
  let cursor = parseISO(start)
  const last = parseISO(end)
  while (cursor <= last) {
    days.push(isoDate(cursor))
    cursor = addDays(cursor, 1)
  }
  return days
}

export function formatWeekday(date: Date): { label: string; number: number } {
  return {
    label: date.toLocaleDateString("en-US", { weekday: "short" }).toUpperCase(),
    number: date.getDate(),
  }
}

export function formatDayHeading(iso: string): string {
  return parseISO(iso).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  })
}

export function reportStudents(room: ClassRoom, start: string, end: string): Student[] {
  const active = activeStudents(room.students)
  const removed = room.students.filter((student) => student.removed && hasMarkInRange(room, student.id, start, end))
  return [...active, ...removed]
}

function hasMarkInRange(room: ClassRoom, studentId: string, start: string, end: string): boolean {
  return eachDate(start, end).some((date) => hasMarkOnDate(room, studentId, date))
}

export function toCsv(rows: string[][]): string {
  return rows
    .map((row) =>
      row
        .map((cell) => `"${String(cell).replaceAll('"', '""')}"`)
        .join(","),
    )
    .join("\n")
}

export function downloadCsv(filename: string, rows: string[][]) {
  const blob = new Blob([toCsv(rows)], { type: "text/csv;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

export function summaryCsv(room: ClassRoom, start: string, end: string): string[][] {
  const students = reportStudents(room, start, end)
  const header = ["Student", ...room.behaviors.map((behavior) => behavior.name), "Days absent"]
  const body = students.map((student) => [
    student.removed ? `${student.name} (removed)` : student.name,
    ...room.behaviors.map((behavior) => String(behaviorValueInRange(room.events, student.id, behavior, start, end))),
    String(absentDays(room.events, student.id, start, end)),
  ])
  return [header, ...body]
}

export function byDayCsv(room: ClassRoom, start: string, end: string): string[][] {
  const header = ["Date", "Student", ...room.behaviors.map((behavior) => behavior.name), "Absent"]
  const rows: string[][] = [header]
  const students = reportStudents(room, start, end)
  for (const date of eachDate(start, end)) {
    for (const student of students) {
      if (!hasMarkOnDate(room, student.id, date)) continue
      rows.push([
        date,
        student.removed ? `${student.name} (removed)` : student.name,
        ...room.behaviors.map((behavior) => String(behaviorValueOnDay(room.events, student.id, behavior, date))),
        isAbsent(room.events, student.id, date) ? "yes" : "",
      ])
    }
  }
  return rows
}
