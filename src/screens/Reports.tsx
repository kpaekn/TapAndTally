import { useMemo, useState } from "react"
import {
  absentDays,
  behaviorValueInRange,
  behaviorValueOnDay,
  byDayCsv,
  downloadCsv,
  eachDate,
  formatDayHeading,
  hasMarkOnDate,
  isAbsent,
  rangeBounds,
  reportStudents,
  sortClasses,
  summaryCsv,
} from "../model.ts"
import type { RangeKey } from "../model.ts"
import { useStore } from "../store.tsx"

const RANGES: { id: RangeKey; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "week", label: "This week" },
  { id: "month", label: "This month" },
  { id: "all", label: "All time" },
]

export function Reports() {
  const { data, active, setActive } = useStore()
  const [range, setRange] = useState<RangeKey>("week")
  const [mode, setMode] = useState<"summary" | "day">("summary")
  const room = active
  const bounds = useMemo(() => (room ? rangeBounds(range, room.events) : null), [room, range])

  if (!room || !bounds) return null
  const current = room
  const windowRange = bounds
  const students = reportStudents(current, windowRange.start, windowRange.end)
  const dayGroups = eachDate(windowRange.start, windowRange.end)
    .map((date) => ({
      date,
      students: students.filter((student) => hasMarkOnDate(current, student.id, date)),
    }))
    .filter((group) => group.students.length > 0)

  function download() {
    const rows = mode === "summary" ? summaryCsv(current, windowRange.start, windowRange.end) : byDayCsv(current, windowRange.start, windowRange.end)
    const slug = current.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "class"
    downloadCsv(`${slug}-${range}${mode === "day" ? "-by-day" : ""}.csv`, rows)
  }

  return (
    <div className="home">
      <header className="home-head">
        <h1>Reports</h1>
      </header>
      <div className="report-tools">
        <label>
          Class
          <select value={current.id} onChange={(event) => setActive(event.target.value)}>
            {sortClasses(data.classes).map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </label>
        <div className="range-switch" role="group" aria-label="Date range">
          {RANGES.map((item) => (
            <button key={item.id} type="button" className={range === item.id ? "is-on" : ""} onClick={() => setRange(item.id)}>
              {item.label}
            </button>
          ))}
        </div>
        <div className="range-switch" role="group" aria-label="Report layout">
          <button type="button" className={mode === "summary" ? "is-on" : ""} onClick={() => setMode("summary")}>
            Summary
          </button>
          <button type="button" className={mode === "day" ? "is-on" : ""} onClick={() => setMode("day")}>
            By day
          </button>
        </div>
      </div>

      {mode === "summary" ? (
        <section className="panel">
          <div className="table-scroll">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Student</th>
                  {current.behaviors.map((behavior) => (
                    <th key={behavior.id}>
                      <span aria-hidden="true">{behavior.emoji}</span> {behavior.name}
                    </th>
                  ))}
                  <th>Days absent</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => (
                  <tr key={student.id}>
                    <th scope="row">
                      {student.name}
                      {student.removed ? <small> removed</small> : null}
                    </th>
                    {current.behaviors.map((behavior) => (
                      <td key={behavior.id}>{behaviorValueInRange(current.events, student.id, behavior, windowRange.start, windowRange.end)}</td>
                    ))}
                    <td>{absentDays(current.events, student.id, windowRange.start, windowRange.end)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      ) : dayGroups.length === 0 ? (
        <section className="panel">
          <p className="quiet">No marks in this range.</p>
        </section>
      ) : (
        dayGroups.map((group) => (
          <section className="panel" key={group.date}>
            <h2>{formatDayHeading(group.date)}</h2>
            <div className="table-scroll">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    {current.behaviors.map((behavior) => (
                      <th key={behavior.id}>
                        <span aria-hidden="true">{behavior.emoji}</span> {behavior.name}
                      </th>
                    ))}
                    <th>Absent</th>
                  </tr>
                </thead>
                <tbody>
                  {group.students.map((student) => (
                    <tr key={student.id}>
                      <th scope="row">{student.name}</th>
                      {current.behaviors.map((behavior) => (
                        <td key={behavior.id}>{behaviorValueOnDay(current.events, student.id, behavior, group.date) || "–"}</td>
                      ))}
                      <td>{isAbsent(current.events, student.id, group.date) ? "Yes" : "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))
      )}

      <div className="report-download">
        <button type="button" className="btn btn-primary" onClick={download}>
          Download spreadsheet
        </button>
      </div>
    </div>
  )
}
