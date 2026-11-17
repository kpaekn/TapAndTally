import type { AppData } from "./types.ts"

const KEY = "tap-tally-v1"

export function emptyData(): AppData {
  return { version: 1, classes: [], activeClassId: null }
}

export function loadData(): AppData {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return emptyData()
    const data = JSON.parse(raw) as AppData
    if (data.version !== 1 || !Array.isArray(data.classes)) return emptyData()
    return data
  } catch {
    return emptyData()
  }
}

export function saveData(data: AppData) {
  localStorage.setItem(KEY, JSON.stringify(data))
}
