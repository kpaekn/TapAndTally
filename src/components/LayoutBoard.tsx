import { useEffect, useRef, useState } from "react"
import { addDesk, autoAssign, clampDesk, desksForShape, shuffleAssign } from "../layout.ts"
import type { RoomShape, Student } from "../types.ts"
import type { LayoutState } from "../types.ts"
import { useHistory } from "../useHistory.ts"
import { RoomCanvas } from "./RoomCanvas.tsx"

interface LayoutBoardProps {
  initial: LayoutState
  students: Student[]
  mode: "move" | "seats"
  onModeChange?: (mode: "move" | "seats") => void
  onChange: (layout: LayoutState) => void
  showShapes?: boolean
}

const SHAPES: { id: RoomShape; label: string }[] = [
  { id: "groups", label: "Groups" },
  { id: "rows", label: "Rows" },
  { id: "pairs", label: "Pairs" },
  { id: "u", label: "U-shape" },
]

export function LayoutBoard({ initial, students, mode, onModeChange, onChange, showShapes = false }: LayoutBoardProps) {
  const history = useHistory(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [pickedId, setPickedId] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const checkpoint = useRef<LayoutState | null>(null)
  const presentRef = useRef(history.present)
  const historyRef = useRef(history)
  const selectedRef = useRef(selectedId)
  presentRef.current = history.present
  historyRef.current = history
  selectedRef.current = selectedId

  useEffect(() => {
    onChange(history.present)
  }, [history.present, onChange])

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault()
        if (event.shiftKey) historyRef.current.redo()
        else historyRef.current.undo()
        return
      }
      if (mode !== "move" || (event.key !== "Delete" && event.key !== "Backspace") || !selectedRef.current) return
      const target = event.target
      if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) return
      event.preventDefault()
      const id = selectedRef.current
      const current = presentRef.current
      const seats = { ...current.seats }
      delete seats[id]
      historyRef.current.commit({ desks: current.desks.filter((desk) => desk.id !== id), seats })
      setSelectedId(null)
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [mode])

  function removeSelected(id: string) {
    const current = presentRef.current
    const seats = { ...current.seats }
    delete seats[id]
    history.commit({ desks: current.desks.filter((desk) => desk.id !== id), seats })
    setSelectedId(null)
  }

  function applyShape(shape: RoomShape) {
    const desks = desksForShape(shape, Math.max(students.filter((student) => !student.removed).length, 1))
    history.commit({ desks, seats: autoAssign(desks, students) })
    setSelectedId(null)
    setPickedId(null)
  }

  const seated = new Set(Object.values(history.present.seats))
  const waiting = students.filter((student) => !student.removed && !seated.has(student.id))

  function assign(deskId: string) {
    if (!pickedId) {
      const seatedId = history.present.seats[deskId]
      if (seatedId) setPickedId(seatedId)
      return
    }
    if (history.present.seats[deskId] === pickedId) {
      setPickedId(null)
      return
    }
    const seats = { ...history.present.seats }
    for (const key of Object.keys(seats)) {
      if (seats[key] === pickedId) delete seats[key]
    }
    const displaced = seats[deskId]
    seats[deskId] = pickedId
    history.commit({ ...history.present, seats })
    setPickedId(displaced ?? null)
  }

  return (
    <div className="layout-board">
      <RoomCanvas
        desks={history.present.desks}
        seats={history.present.seats}
        students={students}
        variant={mode === "move" ? "editor" : "seats"}
        zoom={zoom}
        selectedDeskId={selectedId}
        pickedStudentId={pickedId}
        onDeskClick={(deskId) => {
          if (mode === "move") setSelectedId(deskId)
          else assign(deskId)
        }}
        onDragStart={() => {
          checkpoint.current = structuredClone(presentRef.current)
        }}
        onDrag={(id, x, y) => {
          const spot = clampDesk(x, y)
          history.replace({
            ...presentRef.current,
            desks: presentRef.current.desks.map((desk) => (desk.id === id ? { ...desk, ...spot } : desk)),
          })
        }}
        onDragEnd={(id, x, y) => {
          const spot = clampDesk(x, y)
          const next: LayoutState = {
            ...presentRef.current,
            desks: presentRef.current.desks.map((desk) => (desk.id === id ? { ...desk, ...spot } : desk)),
          }
          const snap = checkpoint.current
          checkpoint.current = null
          if (snap && (snap.desks.find((desk) => desk.id === id)?.x !== spot.x || snap.desks.find((desk) => desk.id === id)?.y !== spot.y)) {
            history.end(next, snap)
          } else {
            history.replace(next)
          }
        }}
      />

      {mode === "seats" ? (
        <aside className="wait-card">
          <div className="wait-head">
            <strong>Waiting for a desk</strong>
            <span className="count-badge">{waiting.length}</span>
          </div>
          <div className="wait-actions">
            <button type="button" className="btn btn-line" onClick={() => history.commit({ ...history.present, seats: autoAssign(history.present.desks, students) })}>
              Auto-assign
            </button>
            <button type="button" className="btn btn-line" onClick={() => history.commit({ ...history.present, seats: shuffleAssign(history.present.desks, students) })}>
              Shuffle
            </button>
          </div>
          <button type="button" className="text-btn" onClick={() => history.commit({ ...history.present, seats: {} })}>
            Clear
          </button>
          {waiting.length === 0 ? <p className="quiet">Everyone has a desk.</p> : null}
          <ul className="wait-list">
            {waiting.map((student) => (
              <li key={student.id}>
                <button
                  type="button"
                  className={pickedId === student.id ? "is-picked" : ""}
                  onClick={() => setPickedId((current) => (current === student.id ? null : student.id))}
                >
                  {student.name}
                </button>
              </li>
            ))}
          </ul>
          <p className="quiet">Select a student, then a desk. Choose someone who is seated to swap.</p>
        </aside>
      ) : null}

      <div className="layout-toolbar">
        <button type="button" className="icon-btn" onClick={history.undo} disabled={!history.canUndo} aria-label="Undo">
          ↺
        </button>
        <button type="button" className="icon-btn" onClick={history.redo} disabled={!history.canRedo} aria-label="Redo">
          ↻
        </button>
        {mode === "move" ? (
          <>
            <span className="toolbar-gap" />
            <button
              type="button"
              className="btn btn-line desk-add"
              onClick={() => {
                const desks = addDesk(history.present.desks)
                history.commit({ ...history.present, desks })
                setSelectedId(desks[desks.length - 1]?.id ?? null)
              }}
            >
              <span className="desk-swatch" /> Desk
            </button>
            <button type="button" className="btn btn-line" disabled={!selectedId} onClick={() => selectedId && removeSelected(selectedId)}>
              Remove
            </button>
          </>
        ) : null}
        {onModeChange ? (
          <div className="mode-switch">
            <button type="button" className={mode === "move" ? "is-on" : ""} onClick={() => onModeChange("move")}>
              Move
            </button>
            <button type="button" className={mode === "seats" ? "is-on" : ""} onClick={() => onModeChange("seats")}>
              Seats
            </button>
          </div>
        ) : null}
        <span className="desk-count">{history.present.desks.length} desks</span>
        <div className="zoom-box">
          <button type="button" onClick={() => setZoom((value) => Math.max(0.75, Math.round((value - 0.25) * 100) / 100))} aria-label="Zoom out">
            −
          </button>
          <span>{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={() => setZoom((value) => Math.min(1.75, Math.round((value + 0.25) * 100) / 100))} aria-label="Zoom in">
            +
          </button>
        </div>
      </div>

      {showShapes ? (
        <div className="shape-reset">
          {SHAPES.map((shape) => (
            <button key={shape.id} type="button" onClick={() => applyShape(shape.id)}>
              {shape.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  )
}
