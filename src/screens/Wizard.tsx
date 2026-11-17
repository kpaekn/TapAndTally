import { useCallback, useState } from "react"
import type { ReactNode } from "react"
import { BehaviorEditor } from "../components/BehaviorEditor.tsx"
import { LayoutBoard } from "../components/LayoutBoard.tsx"
import { starterBehaviors } from "../defaults.ts"
import { uid } from "../id.ts"
import { desksForShape } from "../layout.ts"
import { useStore } from "../store.tsx"
import type { Behavior, LayoutState, RoomShape, Student } from "../types.ts"

const STEPS = ["Name & roster", "Room shape", "Move desks", "Seats", "What you track"]

interface Draft {
  name: string
  rosterText: string
  students: Student[]
  shape: RoomShape | null
  desks: LayoutState["desks"]
  seats: LayoutState["seats"]
  behaviors: Behavior[]
}

export function Wizard({ onDone, onCancel }: { onDone: () => void; onCancel: (() => void) | null }) {
  const { createClass } = useStore()
  const [step, setStep] = useState(0)
  const [draft, setDraft] = useState<Draft>({
    name: "",
    rosterText: "",
    students: [],
    shape: null,
    desks: [],
    seats: {},
    behaviors: starterBehaviors(),
  })

  const onLayout = useCallback((layout: LayoutState) => {
    setDraft((current) => {
      if (current.desks === layout.desks && current.seats === layout.seats) return current
      return { ...current, desks: layout.desks, seats: layout.seats }
    })
  }, [])

  const names = draft.rosterText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)

  function saveRoster() {
    const students = reconcile(names, draft.students)
    const changed = students.length !== draft.students.length || students.some((student, index) => student.id !== draft.students[index]?.id)
    setDraft((current) => ({
      ...current,
      students,
      desks: changed && current.shape ? desksForShape(current.shape, students.length) : current.desks,
      seats: changed ? {} : current.seats,
    }))
    setStep(1)
  }

  function chooseShape(shape: RoomShape) {
    setDraft((current) => ({
      ...current,
      shape,
      desks: desksForShape(shape, current.students.length),
      seats: {},
    }))
  }

  function finish() {
    const behaviors = draft.behaviors
      .map((behavior) => ({ ...behavior, name: behavior.name.trim() }))
      .filter((behavior) => behavior.name)
    createClass({
      name: draft.name.trim(),
      students: draft.students,
      behaviors,
      desks: draft.desks,
      seats: draft.seats,
    })
    onDone()
  }

  if (step === 2) {
    return (
      <section className="bleed">
        <header className="bleed-bar">
          <button type="button" className="icon-btn" onClick={() => setStep(1)} aria-label="Back">
            ←
          </button>
          <div>
            <p className="kicker">Step 3 · Move desks</p>
            <h1>Move the desks</h1>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setStep(3)}>
            Next
          </button>
        </header>
        <p className="bleed-note">Drag a desk into place. Add or remove desks until the room looks right.</p>
        <LayoutBoard initial={{ desks: draft.desks, seats: draft.seats }} students={draft.students} mode="move" onChange={onLayout} />
      </section>
    )
  }

  if (step === 3) {
    return (
      <section className="bleed">
        <header className="bleed-bar">
          <button type="button" className="icon-btn" onClick={() => setStep(2)} aria-label="Back">
            ←
          </button>
          <div>
            <p className="kicker">Step 4 · Seats</p>
            <h1>Who sits where?</h1>
          </div>
          <button type="button" className="btn btn-primary" onClick={() => setStep(4)}>
            Next
          </button>
        </header>
        <LayoutBoard initial={{ desks: draft.desks, seats: draft.seats }} students={draft.students} mode="seats" onChange={onLayout} />
      </section>
    )
  }

  return (
    <section className="wizard">
      <p className="kicker">Step {step + 1} · {STEPS[step]}</p>
      {step === 0 ? (
        <RosterStep
          firstClass={onCancel === null}
          name={draft.name}
          rosterText={draft.rosterText}
          names={names}
          onName={(name) => setDraft((current) => ({ ...current, name }))}
          onRoster={(rosterText) => setDraft((current) => ({ ...current, rosterText }))}
        />
      ) : null}
      {step === 1 ? <ShapeStep shape={draft.shape} onChoose={chooseShape} /> : null}
      {step === 4 ? (
        <TrackStep
          className={draft.name}
          behaviors={draft.behaviors}
          onChange={(behaviors) => setDraft((current) => ({ ...current, behaviors }))}
        />
      ) : null}
      <footer className="wizard-footer">
        <div>
          {step > 0 || onCancel ? (
            <button type="button" className="text-btn back-btn" onClick={() => (step === 0 ? onCancel?.() : setStep((value) => value - 1))}>
              ← Back
            </button>
          ) : (
            <span />
          )}
          <div className="progress" aria-hidden="true">
            {STEPS.map((label, index) => (
              <span key={label} className={index <= step ? "is-on" : ""} />
            ))}
          </div>
        </div>
        {step === 0 ? (
          <button type="button" className="btn btn-primary" disabled={!draft.name.trim() || names.length === 0} onClick={saveRoster}>
            Next
          </button>
        ) : null}
        {step === 1 ? (
          <button type="button" className="btn btn-primary" disabled={!draft.shape} onClick={() => setStep(2)}>
            Next
          </button>
        ) : null}
        {step === 4 ? (
          <button type="button" className="btn btn-primary" disabled={!draft.behaviors.some((behavior) => behavior.name.trim())} onClick={finish}>
            Next
          </button>
        ) : null}
      </footer>
    </section>
  )
}

function RosterStep({
  firstClass,
  name,
  rosterText,
  names,
  onName,
  onRoster,
}: {
  firstClass: boolean
  name: string
  rosterText: string
  names: string[]
  onName: (name: string) => void
  onRoster: (text: string) => void
}) {
  return (
    <>
      <h1>{firstClass ? "Let's set up your first class" : "Let's set up a class"}</h1>
      <p className="lede">Give it a name, then paste in your roster.</p>
      <div className="roster-layout">
        <div>
          <div className="callout">
            <strong>This stays in this browser.</strong> Nothing is uploaded. You can download it as a spreadsheet from Reports any time.
          </div>
          <label className="field">
            Class name
            <input value={name} onChange={(event) => onName(event.target.value)} placeholder="Period 2 · Algebra" />
          </label>
          <label className="field">
            <span className="field-label">
              Students
              <span className="count-badge">{names.length} students</span>
            </span>
            <textarea rows={10} value={rosterText} onChange={(event) => onRoster(event.target.value)} placeholder={"Kevin\nJohn\nJake\nJane\nJoe"} />
          </label>
        </div>
        <aside className="preview-card">
          <p className="nav-label">New class</p>
          <h2>{name.trim() || "Untitled class"}</h2>
          <ol>
            {names.length === 0 ? <li className="quiet">Students show up here.</li> : names.map((student, index) => <li key={`${student}-${index}`}>{student}</li>)}
          </ol>
        </aside>
      </div>
    </>
  )
}

function ShapeStep({ shape, onChoose }: { shape: RoomShape | null; onChoose: (shape: RoomShape) => void }) {
  return (
    <>
      <h1>Which looks most like your room?</h1>
      <p className="lede">Pick the closest. Next you'll move the desks to match.</p>
      <div className="shape-grid">
        <ShapeCard id="groups" title="Groups of four" copy="Desks pushed together in fours" selected={shape === "groups"} onChoose={onChoose}>
          <span className="mini cluster" />
          <span className="mini single" />
        </ShapeCard>
        <ShapeCard id="rows" title="Rows" copy="Single desks in rows facing the front" selected={shape === "rows"} onChoose={onChoose}>
          <span className="mini row" />
        </ShapeCard>
        <ShapeCard id="pairs" title="Pairs" copy="Desks in twos, side by side" selected={shape === "pairs"} onChoose={onChoose}>
          <span className="mini pair" />
          <span className="mini pair" />
          <span className="mini pair short" />
        </ShapeCard>
        <ShapeCard id="u" title="U-shape" copy="Desks round three sides, open at the front" selected={shape === "u"} onChoose={onChoose}>
          <span className="mini u-left" />
          <span className="mini u-right" />
          <span className="mini u-bottom" />
        </ShapeCard>
      </div>
    </>
  )
}

function ShapeCard({
  id,
  title,
  copy,
  selected,
  onChoose,
  children,
}: {
  id: RoomShape
  title: string
  copy: string
  selected: boolean
  onChoose: (shape: RoomShape) => void
  children: ReactNode
}) {
  return (
    <button type="button" className={`shape-card ${selected ? "is-selected" : ""}`} onClick={() => onChoose(id)}>
      <span className={`shape-art art-${id}`}>{children}</span>
      <strong>{title}</strong>
      <span>{copy}</span>
    </button>
  )
}

function TrackStep({
  className,
  behaviors,
  onChange,
}: {
  className: string
  behaviors: Behavior[]
  onChange: (behaviors: Behavior[]) => void
}) {
  return (
    <>
      <h1>What do you want to track?</h1>
      <p className="lede">When you tap a student, these buttons pop up. Start with ours, or make them your own.</p>
      <div className="track-layout">
        <div>
          <label className="field inline-field">
            Menu name
            <input value={className} readOnly />
          </label>
          <BehaviorEditor behaviors={behaviors} onChange={onChange} />
        </div>
        <aside className="menu-preview">
          <p className="nav-label">{className || "Class"}</p>
          {behaviors
            .filter((behavior) => behavior.name.trim())
            .map((behavior) => (
              <div key={behavior.id} className="preview-behavior" style={{ background: behavior.color }}>
                <span>{behavior.emoji}</span>
                <strong>{behavior.name}</strong>
                <em>{behavior.kind === "count" ? "#" : "On/off"}</em>
              </div>
            ))}
        </aside>
      </div>
    </>
  )
}

function reconcile(names: string[], prev: Student[]): Student[] {
  const pool = [...prev]
  return names.map((name) => {
    const index = pool.findIndex((student) => student.name === name)
    if (index >= 0) {
      const [found] = pool.splice(index, 1)
      return found
    }
    return { id: uid(), name }
  })
}
