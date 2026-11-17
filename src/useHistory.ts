import { useReducer } from "react"

interface HistoryState<T> {
  past: T[]
  present: T
  future: T[]
}

type HistoryAction<T> =
  | { type: "commit"; next: T }
  | { type: "replace"; next: T }
  | { type: "end"; next: T; snap: T | null }
  | { type: "undo" }
  | { type: "redo" }

function reducer<T>(state: HistoryState<T>, action: HistoryAction<T>): HistoryState<T> {
  switch (action.type) {
    case "replace":
      return { ...state, present: action.next }
    case "commit":
      return {
        past: [...state.past.slice(-79), state.present],
        present: action.next,
        future: [],
      }
    case "end":
      if (!action.snap) return { ...state, present: action.next }
      return {
        past: [...state.past.slice(-79), action.snap],
        present: action.next,
        future: [],
      }
    case "undo": {
      if (state.past.length === 0) return state
      const prev = state.past[state.past.length - 1]
      return {
        past: state.past.slice(0, -1),
        present: prev,
        future: [...state.future, state.present],
      }
    }
    case "redo": {
      if (state.future.length === 0) return state
      const next = state.future[state.future.length - 1]
      return {
        past: [...state.past, state.present],
        present: next,
        future: state.future.slice(0, -1),
      }
    }
  }
}

export function useHistory<T>(initial: T) {
  const [state, dispatch] = useReducer(reducer<T>, {
    past: [],
    present: initial,
    future: [],
  })

  return {
    present: state.present,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    commit: (next: T) => dispatch({ type: "commit", next }),
    replace: (next: T) => dispatch({ type: "replace", next }),
    end: (next: T, snap: T | null) => dispatch({ type: "end", next, snap }),
    undo: () => dispatch({ type: "undo" }),
    redo: () => dispatch({ type: "redo" }),
  }
}
