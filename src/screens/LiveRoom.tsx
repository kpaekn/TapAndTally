import { useEffect, useState } from "react"
import { RoomCanvas } from "../components/RoomCanvas.tsx"
import { StudentSheet } from "../components/StudentSheet.tsx"
import { isAbsent, behaviorValueOnDay, todayISO } from "../model.ts"
import { useStore } from "../store.tsx"

export function LiveRoom({ onClose }: { onClose: () => void }) {
  const { active, bumpCount, flipToggle, toggleAbsent } = useStore()
  const [openId, setOpenId] = useState<string | null>(null)
  const room = active

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape" && !openId) onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onClose, openId])

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

  return (
    <section className="live">
      <header className="live-bar">
        <button type="button" className="icon-btn" onClick={onClose} aria-label="Close class">
          ×
        </button>
        <h1>{room.name}</h1>
        <p>Tap to track · Hold to mark absent</p>
      </header>
      {room.desks.length === 0 || seated === 0 ? (
        <div className="empty-live">
          <p>This room has no one in a seat yet.</p>
          <button type="button" className="btn btn-primary" onClick={onClose}>
            Back to class
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
