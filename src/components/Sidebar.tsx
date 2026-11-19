import { sortClasses } from "../model.ts"
import type { ClassRoom } from "../types.ts"
import { DataTransfer } from "./DataTransfer.tsx"

interface SidebarProps {
  classes: ClassRoom[]
  activeId: string | null
  screen: "home" | "reports" | "menu" | "wizard" | "live"
  onPickClass: (id: string) => void
  onNewClass: () => void
  onStart: () => void
  onMenu: () => void
  onReports: () => void
  onHome: () => void
}

export function Sidebar({
  classes,
  activeId,
  screen,
  onPickClass,
  onNewClass,
  onStart,
  onMenu,
  onReports,
  onHome,
}: SidebarProps) {
  const disabled = !activeId
  return (
    <aside className="sidebar">
      <button type="button" className="brand" onClick={onHome}>
        <KeyIcon />
        <span>Tap & Tally</span>
      </button>
      <button type="button" className="btn btn-primary start-btn" disabled={disabled} onClick={onStart}>
        <PlayIcon /> Start class
      </button>
      <p className="nav-label">Classes</p>
      <div className="class-list">
        {sortClasses(classes).map((room) => (
          <button
            key={room.id}
            type="button"
            className={room.id === activeId && screen === "home" ? "is-active" : ""}
            onClick={() => onPickClass(room.id)}
          >
            {room.name}
          </button>
        ))}
      </div>
      <button type="button" className="text-btn new-class" onClick={onNewClass}>
        + New class
      </button>
      <nav className="side-nav">
        <button type="button" className={screen === "menu" ? "is-active" : ""} disabled={disabled} onClick={onMenu}>
          <MenuIcon /> Menu
        </button>
        <button type="button" className={screen === "reports" ? "is-active" : ""} disabled={disabled} onClick={onReports}>
          <ChartIcon /> Reports
        </button>
      </nav>
      <DataTransfer />
    </aside>
  )
}

function KeyIcon() {
  return (
    <svg className="brand-mark" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="8" cy="12" r="4.2" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 12h9M17 12v3.2M20 12v2" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 16 16" aria-hidden="true" className="play-icon">
      <path d="M4.5 2.8v10.4L13 8 4.5 2.8z" fill="currentColor" />
    </svg>
  )
}

function MenuIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 7h14M5 12h14M5 17h10" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  )
}

function ChartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M5 19V9M10 19V5M15 19v-7M20 19V8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

export { PlayIcon }
