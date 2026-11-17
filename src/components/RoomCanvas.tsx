import { useEffect, useRef, useState } from "react"
import type { PointerEvent as ReactPointerEvent } from "react"
import { CANVAS_H, CANVAS_W, DESK, SNAP } from "../layout.ts"
import { initials } from "../model.ts"
import type { Desk, Student } from "../types.ts"

interface RoomCanvasProps {
  desks: Desk[]
  seats: Record<string, string>
  students: Student[]
  variant: "editor" | "seats" | "live"
  zoom?: number
  selectedDeskId?: string | null
  pickedStudentId?: string | null
  absentStudentIds?: string[]
  pointTotals?: Record<string, number>
  onDeskClick?: (deskId: string) => void
  onDragStart?: (deskId: string) => void
  onDrag?: (deskId: string, x: number, y: number) => void
  onDragEnd?: (deskId: string, x: number, y: number) => void
  onActivate?: (studentId: string) => void
  onHoldStudent?: (studentId: string) => void
}

export function RoomCanvas({
  desks,
  seats,
  students,
  variant,
  zoom = 1,
  selectedDeskId,
  pickedStudentId,
  absentStudentIds = [],
  pointTotals = {},
  onDeskClick,
  onDragStart,
  onDrag,
  onDragEnd,
  onActivate,
  onHoldStudent,
}: RoomCanvasProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const [hostSize, setHostSize] = useState({ width: 0, height: 0 })
  const liveFit = variant === "live" && desks.length > 0
  let minX = 0
  let minY = 0
  let boundsW = CANVAS_W
  let boundsH = CANVAS_H
  if (liveFit) {
    minX = Math.min(...desks.map((desk) => desk.x))
    minY = Math.min(...desks.map((desk) => desk.y))
    boundsW = Math.max(...desks.map((desk) => desk.x)) + DESK - minX
    boundsH = Math.max(...desks.map((desk) => desk.y)) + DESK - minY
  }
  const pad = liveFit ? 36 : 2
  const availW = Math.max(1, hostSize.width - pad * 2)
  const availH = Math.max(1, hostSize.height - pad * 2)
  const fitted = hostSize.width > 0 ? Math.min(availW / boundsW, availH / boundsH) : 1
  const scale = (fitted > 0.05 ? fitted : 1) * zoom
  const scaleRef = useRef(scale)
  scaleRef.current = scale
  const originX = liveFit ? pad : 0
  const originY = liveFit ? pad : 0
  const width = liveFit ? boundsW * scale + pad * 2 : CANVAS_W * scale
  const height = liveFit ? boundsH * scale + pad * 2 : CANVAS_H * scale
  const dragRef = useRef<{ id: string; px: number; py: number; x: number; y: number } | null>(null)
  const holdRef = useRef<number | null>(null)
  const holdFired = useRef(false)
  const [holdingId, setHoldingId] = useState<string | null>(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    const measure = () => setHostSize({ width: host.clientWidth, height: host.clientHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(host)
    return () => observer.disconnect()
  }, [])

  function studentFor(deskId: string): Student | undefined {
    const id = seats[deskId]
    return students.find((student) => student.id === id && !student.removed)
  }

  function clearHold() {
    if (holdRef.current !== null) window.clearTimeout(holdRef.current)
    holdRef.current = null
    setHoldingId(null)
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, desk: Desk) {
    event.preventDefault()
    if (variant === "editor") {
      const origin = { id: desk.id, px: event.clientX, py: event.clientY, x: desk.x, y: desk.y }
      dragRef.current = origin
      onDragStart?.(desk.id)
      onDeskClick?.(desk.id)
      const move = (ev: PointerEvent) => {
        onDrag?.(origin.id, origin.x + (ev.clientX - origin.px) / scaleRef.current, origin.y + (ev.clientY - origin.py) / scaleRef.current)
      }
      const up = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", move)
        window.removeEventListener("pointerup", up)
        dragRef.current = null
        onDragEnd?.(origin.id, origin.x + (ev.clientX - origin.px) / scaleRef.current, origin.y + (ev.clientY - origin.py) / scaleRef.current)
      }
      window.addEventListener("pointermove", move)
      window.addEventListener("pointerup", up)
      return
    }
    const student = studentFor(desk.id)
    if (!student) {
      if (variant === "seats") onDeskClick?.(desk.id)
      return
    }
    if (variant === "live") {
      holdFired.current = false
      setHoldingId(student.id)
      try {
        event.currentTarget.setPointerCapture(event.pointerId)
      } catch {
        // A real pointer can be captured. A synthetic one still completes on pointerup.
      }
      holdRef.current = window.setTimeout(() => {
        holdFired.current = true
        setHoldingId(null)
        onHoldStudent?.(student.id)
      }, 650)
      return
    }
    onDeskClick?.(desk.id)
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    if (variant === "live" && holdRef.current !== null) {
      const moved = Math.abs(event.movementX) + Math.abs(event.movementY) > 12
      if (moved) clearHold()
    }
  }

  function onPointerUp(desk: Desk) {
    if (variant !== "live") return
    const student = studentFor(desk.id)
    clearHold()
    if (student && !holdFired.current) onActivate?.(student.id)
  }

  const dot = SNAP * scale

  return (
    <div className={`canvas-host ${variant === "editor" ? "is-editor" : ""}`} ref={hostRef}>
      <div className="canvas-frame" style={{ minWidth: width, minHeight: height }}>
        <div
          className={`canvas ${variant === "editor" ? "dotted" : ""}`}
          style={{
            width,
            height,
            backgroundSize: variant === "editor" ? `${dot}px ${dot}px` : undefined,
          }}
        >
          {desks.map((desk) => {
            const student = studentFor(desk.id)
            const absent = student ? absentStudentIds.includes(student.id) : false
            const classes = [
              "desk",
              `mode-${variant}`,
              selectedDeskId === desk.id ? "is-selected" : "",
              student && pickedStudentId === student.id ? "is-picked" : "",
              absent ? "is-absent" : "",
              holdingId && student && holdingId === student.id ? "is-holding" : "",
              student ? "is-filled" : "",
            ]
              .filter(Boolean)
              .join(" ")
            const count = student ? (pointTotals[student.id] ?? 0) : 0
            return (
              <div
                key={desk.id}
                className="desk-slot"
                style={{
                  left: originX + (desk.x - minX) * scale,
                  top: originY + (desk.y - minY) * scale,
                  width: DESK * scale,
                  height: DESK * scale,
                }}
              >
                <button
                  type="button"
                  className={classes}
                  style={{ fontSize: Math.max(11, 15 * scale) }}
                  onPointerDown={(event) => onPointerDown(event, desk)}
                  onPointerMove={onPointerMove}
                  onPointerUp={() => onPointerUp(desk)}
                  onPointerCancel={() => {
                    dragRef.current = null
                    clearHold()
                  }}
                  onContextMenu={(event) => event.preventDefault()}
                >
                  {student ? initials(student.name) : ""}
                  {absent ? <span className="desk-absent">Absent</span> : null}
                </button>
                {variant === "live" && count > 0 ? <span className="desk-bubble">{count}</span> : null}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
