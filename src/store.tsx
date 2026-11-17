import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
import { uid } from "./id.ts"
import { isAbsent, todayISO, toggleOn } from "./model.ts"
import { loadData, saveData } from "./storage.ts"
import type { AppData, Behavior, ClassRoom, LayoutState, Student } from "./types.ts"

interface Store {
  data: AppData
  active: ClassRoom | null
  setActive: (id: string) => void
  createClass: (room: Omit<ClassRoom, "id" | "events">) => string
  renameClass: (id: string, name: string) => void
  renameStudent: (classId: string, studentId: string, name: string) => void
  addStudents: (classId: string, names: string[]) => void
  removeStudent: (classId: string, studentId: string) => void
  restoreStudent: (classId: string, studentId: string) => void
  setBehaviors: (classId: string, behaviors: Behavior[]) => void
  setLayout: (classId: string, layout: LayoutState) => void
  bumpCount: (classId: string, studentId: string, behaviorId: string, delta: 1 | -1) => void
  flipToggle: (classId: string, studentId: string, behaviorId: string) => void
  toggleAbsent: (classId: string, studentId: string) => void
}

const StoreContext = createContext<Store | null>(null)

function patchClass(data: AppData, id: string, updater: (room: ClassRoom) => ClassRoom): AppData {
  return {
    ...data,
    classes: data.classes.map((room) => (room.id === id ? updater(room) : room)),
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => loadData())

  useEffect(() => {
    saveData(data)
  }, [data])

  const active = useMemo(
    () => data.classes.find((room) => room.id === data.activeClassId) ?? data.classes[0] ?? null,
    [data],
  )

  const setActive = useCallback((id: string) => {
    setData((current) => ({ ...current, activeClassId: id }))
  }, [])

  const createClass = useCallback((room: Omit<ClassRoom, "id" | "events">) => {
    const id = uid()
    const next: ClassRoom = { ...room, id, events: [] }
    setData((current) => ({
      ...current,
      activeClassId: id,
      classes: [...current.classes, next],
    }))
    return id
  }, [])

  const renameClass = useCallback((id: string, name: string) => {
    setData((current) => patchClass(current, id, (room) => ({ ...room, name })))
  }, [])

  const renameStudent = useCallback((classId: string, studentId: string, name: string) => {
    setData((current) =>
      patchClass(current, classId, (room) => ({
        ...room,
        students: room.students.map((student) => (student.id === studentId ? { ...student, name } : student)),
      })),
    )
  }, [])

  const addStudents = useCallback((classId: string, names: string[]) => {
    const students: Student[] = names.map((name) => ({ id: uid(), name }))
    setData((current) =>
      patchClass(current, classId, (room) => ({ ...room, students: [...room.students, ...students] })),
    )
  }, [])

  const removeStudent = useCallback((classId: string, studentId: string) => {
    setData((current) =>
      patchClass(current, classId, (room) => ({
        ...room,
        students: room.students.map((student) => (student.id === studentId ? { ...student, removed: true } : student)),
        seats: Object.fromEntries(Object.entries(room.seats).filter(([, seated]) => seated !== studentId)),
      })),
    )
  }, [])

  const restoreStudent = useCallback((classId: string, studentId: string) => {
    setData((current) =>
      patchClass(current, classId, (room) => ({
        ...room,
        students: room.students.map((student) => (student.id === studentId ? { ...student, removed: false } : student)),
      })),
    )
  }, [])

  const setBehaviors = useCallback((classId: string, behaviors: Behavior[]) => {
    setData((current) => patchClass(current, classId, (room) => ({ ...room, behaviors })))
  }, [])

  const setLayout = useCallback((classId: string, layout: LayoutState) => {
    setData((current) => patchClass(current, classId, (room) => ({ ...room, desks: layout.desks, seats: layout.seats })))
  }, [])

  const bumpCount = useCallback((classId: string, studentId: string, behaviorId: string, delta: 1 | -1) => {
    const date = todayISO()
    setData((current) =>
      patchClass(current, classId, (room) => {
        const total = room.events.reduce((sum, event) => {
          if (event.type !== "count" || event.studentId !== studentId || event.behaviorId !== behaviorId || event.date !== date) {
            return sum
          }
          return sum + event.value
        }, 0)
        if (delta < 0 && total <= 0) return room
        return {
          ...room,
          events: [
            ...room.events,
            { id: uid(), studentId, behaviorId, date, type: "count", value: delta },
          ],
        }
      }),
    )
  }, [])

  const flipToggle = useCallback((classId: string, studentId: string, behaviorId: string) => {
    const date = todayISO()
    setData((current) =>
      patchClass(current, classId, (room) => {
        const on = toggleOn(room.events, studentId, behaviorId, date)
        return {
          ...room,
          events: [
            ...room.events,
            { id: uid(), studentId, behaviorId, date, type: "toggle", value: on ? 0 : 1 },
          ],
        }
      }),
    )
  }, [])

  const toggleAbsent = useCallback((classId: string, studentId: string) => {
    const date = todayISO()
    setData((current) =>
      patchClass(current, classId, (room) => {
        const absent = isAbsent(room.events, studentId, date)
        return {
          ...room,
          events: [...room.events, { id: uid(), studentId, date, type: "absent", value: absent ? 0 : 1 }],
        }
      }),
    )
  }, [])

  const value = useMemo<Store>(
    () => ({
      data,
      active,
      setActive,
      createClass,
      renameClass,
      renameStudent,
      addStudents,
      removeStudent,
      restoreStudent,
      setBehaviors,
      setLayout,
      bumpCount,
      flipToggle,
      toggleAbsent,
    }),
    [
      data,
      active,
      setActive,
      createClass,
      renameClass,
      renameStudent,
      addStudents,
      removeStudent,
      restoreStudent,
      setBehaviors,
      setLayout,
      bumpCount,
      flipToggle,
      toggleAbsent,
    ],
  )

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
  const store = useContext(StoreContext)
  if (!store) throw new Error("useStore must be used within StoreProvider")
  return store
}
