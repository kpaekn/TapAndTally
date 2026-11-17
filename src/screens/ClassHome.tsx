import { useState } from "react"
import { PlayIcon } from "../components/Sidebar.tsx"
import { WeekTable } from "../components/WeekTable.tsx"
import { useStore } from "../store.tsx"

export function ClassHome({ onStart, onEditMenu }: { onStart: () => void; onEditMenu: () => void }) {
  const { active, renameClass, renameStudent, addStudents, removeStudent, restoreStudent } = useStore()
  const [adding, setAdding] = useState(false)
  const [roster, setRoster] = useState("")
  if (!active) return null
  const room = active
  const removed = room.students.filter((student) => student.removed)

  function saveStudents() {
    const names = roster
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
    if (names.length) addStudents(room.id, names)
    setRoster("")
    setAdding(false)
  }

  return (
    <div className="home">
      <header className="home-head">
        <input
          className="title-input"
          aria-label="Class name"
          value={room.name}
          onChange={(event) => renameClass(room.id, event.target.value)}
        />
        <button type="button" className="btn btn-primary" onClick={onStart}>
          <PlayIcon /> Start class
        </button>
      </header>

      <section className="panel">
        <div className="panel-head">
          <div>
            <h2>Students</h2>
            <div className="legend">
              {room.behaviors.map((behavior) => (
                <span key={behavior.id}>
                  <span aria-hidden="true">{behavior.emoji}</span> {behavior.name}
                </span>
              ))}
            </div>
          </div>
          <button type="button" className="btn btn-line" onClick={() => setAdding(true)}>
            + Add students
          </button>
        </div>
        <WeekTable
          room={room}
          onRename={(studentId, name) => renameStudent(room.id, studentId, name)}
          onRemove={(studentId) => removeStudent(room.id, studentId)}
        />
        <p className="fine-print">Removed students keep their history in Reports, and you can bring them back.</p>
        {removed.length > 0 ? (
          <ul className="removed-list">
            {removed.map((student) => (
              <li key={student.id}>
                <span>{student.name}</span>
                <button type="button" className="text-btn" onClick={() => restoreStudent(room.id, student.id)}>
                  Bring back
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="panel">
        <h2>Menu</h2>
        <p className="quiet">What pops up when you tap a student in this class.</p>
        <div className="legend legend-pills">
          {room.behaviors.map((behavior) => (
            <span key={behavior.id} className="chip" style={{ background: behavior.color }}>
              <span aria-hidden="true">{behavior.emoji}</span> {behavior.name} {behavior.kind === "count" ? "#" : "On/off"}
            </span>
          ))}
        </div>
        <button type="button" className="btn btn-line" onClick={onEditMenu}>
          Edit this menu
        </button>
      </section>

      {adding ? (
        <div className="sheet-backdrop" onMouseDown={() => setAdding(false)}>
          <form
            className="sheet add-sheet"
            onMouseDown={(event) => event.stopPropagation()}
            onSubmit={(event) => {
              event.preventDefault()
              saveStudents()
            }}
          >
            <header className="sheet-head">
              <h2>Add students</h2>
              <button type="button" className="icon-btn" onClick={() => setAdding(false)} aria-label="Close">
                ×
              </button>
            </header>
            <label className="field">
              One name per line
              <textarea rows={8} value={roster} onChange={(event) => setRoster(event.target.value)} autoFocus />
            </label>
            <button type="submit" className="btn btn-primary">
              Add
            </button>
          </form>
        </div>
      ) : null}
    </div>
  )
}
