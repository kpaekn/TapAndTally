export type BehaviorKind = "count" | "toggle"

export type RoomShape = "groups" | "rows" | "pairs" | "u"

export interface Student {
  id: string
  name: string
  removed?: boolean
}

export interface Behavior {
  id: string
  name: string
  kind: BehaviorKind
  color: string
  emoji: string
}

export interface Desk {
  id: string
  x: number
  y: number
}

export interface TallyEvent {
  id: string
  studentId: string
  behaviorId?: string
  date: string
  type: "count" | "toggle" | "absent"
  value: number
}

export interface ClassRoom {
  id: string
  name: string
  students: Student[]
  behaviors: Behavior[]
  desks: Desk[]
  seats: Record<string, string>
  events: TallyEvent[]
}

export interface AppData {
  version: 1
  classes: ClassRoom[]
  activeClassId: string | null
}

export interface LayoutState {
  desks: Desk[]
  seats: Record<string, string>
}
