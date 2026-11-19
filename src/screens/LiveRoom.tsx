import { useEffect, useRef, useState } from "react"
import { RoomCanvas } from "../components/RoomCanvas.tsx"
import { StudentSheet } from "../components/StudentSheet.tsx"
import { isAbsent, behaviorValueOnDay, sortClasses, todayISO } from "../model.ts"
import { LayoutEditor } from "./LayoutEditor.tsx"
import { useStore } from "../store.tsx"

export function LiveRoom({ onClose }: { onClose: () => void }) {
  const { data, active, setActive, bumpCount, flipToggle, toggleAbsent } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [editing, setEditing] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const room = active

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return
      if (editing) {
        setEditing(false)
        return
      }
      if (menuOpen) {
        setMenuOpen(false)
        return
      }
      if (!openId) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, openId, menuOpen, editing])

  useEffect(() => {
    if (!menuOpen) return
    function onPointer(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenuOpen(false)
    }
    window.addEventListener("pointerdown", onPointer)
    return () => window.removeEventListener("pointerdown", onPointer)
  }, [menuOpen])

  if (!room) return null
  const today = todayISO()
  const absentStudentIds = room.students
    .filter((student) => !student.removed && isAbsent(room.events, student.id, today))
    .map((student) => student.id)
  const pointTotals: Record<string, number> = {}
  for (const student of room.students) {
    if (student.removed) continue
    const total = room.behaviors.reduce((sum, behavior) => {
      if (behavior.kind !== "count") return sum
      return sum + behaviorValueOnDay(room.events, student.id, behavior, today)
    }, 0)
    if (total > 0) pointTotals[student.id] = total
  }
  const seated = Object.values(room.seats).length

  function pickClass(id: string) {
    setActive(id)
    setOpenId(null)
    setMenuOpen(false)
  }

  function openLayout() {
    setOpenId(null)
    setMenuOpen(false)
    setEditing(true)
  }

  if (editing) return <LayoutEditor onClose={() => setEditing(false)} />

  return (
    <section className="live">
      <header className="live-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close class">
          ×
        </button>
        <div className="live-class" ref={menuRef}>
          <button
            type="button"
            className="live-class-btn"
            aria-expanded={menuOpen}
            aria-haspopup="listbox"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {room.name}
            <Chevron />
          </button>
          {menuOpen ? (
            <div className="live-class-menu" role="listbox" aria-label="Classes">
              {sortClasses(data.classes).map((item) => (
                <button
                  key={item.id}
                  type="button"
                  role="option"
                  aria-selected={item.id === room.id}
                  className={item.id === room.id ? "is-current" : ""}
                  onClick={() => pickClass(item.id)}
                >
                  {item.name}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        <div className="live-actions">
          <button type="button" className="btn btn-line" onClick={openLayout}>
            Room layout
          </button>
          <p>Tap to track · Hold to mark absent</p>
        </div>
      </header>
      {room.desks.length === 0 || seated === 0 ? (
        <div className="empty-live">
          <p>This room has no one in a seat yet.</p>
          <button type="button" className="btn btn-primary" onClick={openLayout}>
            Room layout
          </button>
        </div>
      ) : (
        <RoomCanvas
          desks={room.desks}
          seats={room.seats}
          students={room.students}
          variant="live"
          absentStudentIds={absentStudentIds}
          pointTotals={pointTotals}
          onActivate={setOpenId}
          onHoldStudent={(studentId) => toggleAbsent(room.id, studentId)}
        />
      )}
      {openId ? (
        <StudentSheet
          room={room}
          studentId={openId}
          onClose={() => setOpenId(null)}
          onCount={(behaviorId, delta) => bumpCount(room.id, openId, behaviorId, delta)}
          onToggle={(behaviorId) => flipToggle(room.id, openId, behaviorId)}
          onAbsent={() => toggleAbsent(room.id, openId)}
        />
      ) : null}
    </section>
  )
}

function Chevron() {
  return (
    <svg className="live-chevron" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3.5 6.2 8 10.4l4.5-4.2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}
