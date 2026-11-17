import { useCallback, useRef, useState } from "react"
import { LayoutBoard } from "../components/LayoutBoard.tsx"
import { useStore } from "../store.tsx"
import type { LayoutState } from "../types.ts"

export function LayoutEditor({ onClose }: { onClose: () => void }) {
  const { active, setLayout } = useStore()
  const [mode, setMode] = useState<"move" | "seats">("move")
  const latest = useRef<LayoutState | null>(null)
  const onChange = useCallback((layout: LayoutState) => {
    latest.current = layout
  }, [])

  if (!active) return null
  const room = active

  return (
    <section className="bleed editor-bleed">
      <header className="bleed-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
          ×
        </button>
        <h1>{room.name}</h1>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            if (latest.current) setLayout(room.id, latest.current)
            onClose()
          }}
        >
          Save layout
        </button>
      </header>
      <LayoutBoard
        initial={{ desks: room.desks, seats: room.seats }}
        students={room.students}
        mode={mode}
        onModeChange={setMode}
        onChange={onChange}
        showShapes
      />
    </section>
  )
}
