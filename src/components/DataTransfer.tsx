import { useRef, useState } from "react"
import { useStore } from "../store.tsx"
import { downloadData, parseData } from "../storage.ts"

export function DataTransfer({ onImported }: { onImported?: () => void }) {
  const { data, replaceData } = useStore()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)

  function onFile(file: File | undefined) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const parsed = parseData(String(reader.result ?? ""))
      if (!parsed) {
        setError("That file isn't a Tap & Tally save.")
        return
      }
      const confirmed = window.confirm("Replace everything in this browser with this save?")
      if (!confirmed) return
      replaceData(parsed)
      setError(null)
      onImported?.()
    }
    reader.readAsText(file)
  }

  return (
    <div className="data-transfer">
      <button type="button" className="text-btn" onClick={() => downloadData(data)}>
        Export data
      </button>
      <button type="button" className="text-btn" onClick={() => inputRef.current?.click()}>
        Import data
      </button>
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept="application/json,.json"
        aria-label="Import data file"
        onChange={(event) => {
          onFile(event.target.files?.[0])
          event.target.value = ""
        }}
      />
      {error ? <p className="data-error">{error}</p> : null}
    </div>
  )
}
