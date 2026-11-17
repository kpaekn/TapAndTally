import type { AppData } from "./types.ts"

const KEY = "tap-tally-v1"

export function emptyData(): AppData {
  return { version: 1, classes: [], activeClassId: null }
}

export function parseData(raw: string): AppData | null {
  try {
    const data = JSON.parse(raw) as AppData
    if (!data || data.version !== 1 || !Array.isArray(data.classes)) return null
    return {
      version: 1,
      classes: data.classes,
      activeClassId: typeof data.activeClassId === "string" ? data.activeClassId : null,
    }
  } catch {
    return null
  }
}

export function loadData(): AppData {
  const raw = localStorage.getItem(KEY)
  if (!raw) return emptyData()
  return parseData(raw) ?? emptyData()
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}

export function downloadData(data: AppData) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = url
  link.download = "tap-tally.json"
  link.click()
  URL.revokeObjectURL(url)
}
