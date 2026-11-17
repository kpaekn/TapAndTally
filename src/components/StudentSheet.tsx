import { useEffect, useRef, useState } from "react"
import { behaviorValueOnDay, isAbsent, todayISO } from "../model.ts"
import type { ClassRoom } from "../types.ts"

interface StudentSheetProps {
  room: ClassRoom
  studentId: string
  onClose: () => void
  onCount: (behaviorId: string, delta: 1 | -1) => void
  onToggle: (behaviorId: string) => void
  onAbsent: () => void
}

export function StudentSheet({ room, studentId, onClose, onCount, onToggle, onAbsent }: StudentSheetProps) {
  const student = room.students.find((item) => item.id === studentId)
  const today = todayISO()
  const absent = student ? isAbsent(room.events, student.id, today) : false
  const [progress, setProgress] = useState(0)
  const frame = useRef<number | null>(null)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose])

  useEffect(() => {
    return () => {
      if (frame.current !== null) cancelAnimationFrame(frame.current)
    }
  }, [])

  if (!student) return null

  function startHold() {
    const started = performance.now()
    const tick = (now: number) => {
      const next = Math.min(1, (now - started) / 650)
      setProgress(next)
      if (next >= 1) {
        onAbsent()
        setProgress(0)
        return
      }
      frame.current = requestAnimationFrame(tick)
    }
    frame.current = requestAnimationFrame(tick)
  }

  function cancelHold() {
    if (frame.current !== null) cancelAnimationFrame(frame.current)
    frame.current = null
    setProgress(0)
  }

  return (
    <div className="sheet-backdrop" onMouseDown={onClose}>
      <section className="sheet" role="dialog" aria-labelledby="sheet-name" onMouseDown={(event) => event.stopPropagation()}>
        <header className="sheet-head">
          <h2 id="sheet-name">{student.name}</h2>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </header>
        <div className="sheet-rows">
          {room.behaviors.map((behavior) => {
            const value = behaviorValueOnDay(room.events, student.id, behavior, today)
            return (
              <div key={behavior.id} className="sheet-row" style={{ background: behavior.color }}>
                <button
                  type="button"
                  className="sheet-main"
                  onClick={() => (behavior.kind === "count" ? onCount(behavior.id, 1) : onToggle(behavior.id))}
                >
                  <span className="sheet-emoji">{behavior.emoji}</span>
                  <span>
                    <strong>{behavior.name}</strong>
                    <small>{behavior.kind === "count" ? "# Counts every tap" : "On or off today"}</small>
                  </span>
                  <span className="sheet-pill">{behavior.kind === "count" ? value : value ? "On" : "Off"}</span>
                </button>
                {behavior.kind === "count" && value > 0 ? (
                  <button type="button" className="minus-btn" onClick={() => onCount(behavior.id, -1)} aria-label={`Remove one ${behavior.name}`}>
                    −1
                  </button>
                ) : null}
              </div>
            )
          })}
        </div>
        <button
          type="button"
          className={`hold-absent ${absent ? "is-on" : ""}`}
          onPointerDown={startHold}
          onPointerUp={cancelHold}
          onPointerLeave={cancelHold}
          onPointerCancel={cancelHold}
        >
          <span className="hold-fill" style={{ width: `${progress * 100}%` }} />
          <span>{absent ? `Hold to clear ${student.name}'s absence` : `Hold to mark ${student.name} absent`}</span>
        </button>
      </section>
    </div>
  )
}
