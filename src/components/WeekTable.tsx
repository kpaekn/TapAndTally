import { useEffect, useRef, useState } from "react"
import {
  absentDays,
  behaviorValueInRange,
  behaviorValueOnDay,
  formatWeekday,
  isAbsent,
  isoDate,
  todayISO,
  weekdays,
} from "../model.ts"
import type { Behavior, ClassRoom, Student } from "../types.ts"

interface WeekTableProps {
  room: ClassRoom
  onRename: (studentId: string, name: string) => void
  onRemove: (studentId: string) => void
}

export function WeekTable({ room, onRename, onRemove }: WeekTableProps) {
  const days = weekdays()
  const today = todayISO()
  const start = isoDate(days[0])
  const end = isoDate(days[4])
  const students = room.students.filter((student) => !student.removed)
  const [menu, setMenu] = useState<{ id: string; top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setMenu(null)
    }
    window.addEventListener("mousedown", close)
    return () => window.removeEventListener("mousedown", close)
  }, [])

  return (
    <div className="table-scroll">
      <table className="week-table">
        <thead>
          <tr>
            <th>Student</th>
            {days.map((day) => {
              const meta = formatWeekday(day)
              const iso = isoDate(day)
              return (
                <th key={iso} className={iso === today ? "is-today" : ""}>
                  <span>{meta.label}</span> {meta.number}
                </th>
              )
            })}
            <th>This week</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {students.map((student) => (
            <tr key={student.id}>
              <th scope="row">
                <NameField name={student.name} onRename={(name) => onRename(student.id, name)} />
              </th>
              {days.map((day) => {
                const iso = isoDate(day)
                return (
                  <td key={iso} className={iso === today ? "is-today" : iso > today ? "is-future" : ""}>
                    <DayMarks room={room} student={student} date={iso} future={iso > today} />
                  </td>
                )
              })}
              <td>
                <WeekMarks room={room} student={student} start={start} end={end} />
              </td>
              <td className="menu-cell">
                <div className="row-menu" ref={menu?.id === student.id ? menuRef : undefined}>
                  <button
                    type="button"
                    className="icon-btn"
                    aria-label={`Actions for ${student.name}`}
                    onClick={(event) => {
                      const rect = event.currentTarget.getBoundingClientRect()
                      setMenu((current) =>
                        current?.id === student.id ? null : { id: student.id, top: rect.bottom + 6, left: rect.right },
                      )
                    }}
                  >
                    ···
                  </button>
                  {menu?.id === student.id ? (
                    <button
                      type="button"
                      className="menu-pop"
                      style={{ top: menu.top, left: menu.left }}
                      onClick={() => {
                        onRemove(student.id)
                        setMenu(null)
                      }}
                    >
                      Remove
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function NameField({ name, onRename }: { name: string; onRename: (name: string) => void }) {
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(name)

  if (!editing) {
    return (
      <button
        type="button"
        className="name-btn"
        onClick={() => {
          setValue(name)
          setEditing(true)
        }}
      >
        {name}
      </button>
    )
  }

  return (
    <input
      className="name-input"
      value={value}
      autoFocus
      aria-label="Student name"
      onChange={(event) => setValue(event.target.value)}
      onBlur={() => {
        onRename(value.trim() || name)
        setEditing(false)
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur()
        if (event.key === "Escape") {
          setValue(name)
          setEditing(false)
        }
      }}
    />
  )
}

function DayMarks({ room, student, date, future }: { room: ClassRoom; student: Student; date: string; future: boolean }) {
  if (future) return null
  const absent = isAbsent(room.events, student.id, date)
  const chips = room.behaviors.flatMap((behavior) => {
    const value = behaviorValueOnDay(room.events, student.id, behavior, date)
    if (value <= 0) return []
    return [<Mark key={behavior.id} behavior={behavior} value={behavior.kind === "count" ? value : undefined} />]
  })
  if (!absent && chips.length === 0) return <span className="dash">–</span>
  return (
    <div className="mark-row">
      {absent ? <span className="chip chip-absent">Absent</span> : null}
      {chips}
    </div>
  )
}

function WeekMarks({ room, student, start, end }: { room: ClassRoom; student: Student; start: string; end: string }) {
  const absent = absentDays(room.events, student.id, start, end)
  const chips = room.behaviors.flatMap((behavior) => {
    const value = behaviorValueInRange(room.events, student.id, behavior, start, end)
    if (value <= 0) return []
    return [<Mark key={behavior.id} behavior={behavior} value={value} />]
  })
  if (!absent && chips.length === 0) return <span className="dash">–</span>
  return (
    <div className="mark-row">
      {absent ? <span className="chip chip-absent">{absent} abs</span> : null}
      {chips}
    </div>
  )
}

function Mark({ behavior, value }: { behavior: Behavior; value?: number }) {
  return (
    <span className="chip" style={{ background: behavior.color }}>
      <span aria-hidden="true">{behavior.emoji}</span>
      {value !== undefined ? <strong>{value}</strong> : null}
      <span className="sr-only">
        {behavior.name}
        {value !== undefined ? ` ${value}` : " on"}
      </span>
    </span>
  )
}
