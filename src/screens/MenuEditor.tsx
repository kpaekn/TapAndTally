import { BehaviorEditor } from "../components/BehaviorEditor.tsx"
import { useStore } from "../store.tsx"

export function MenuEditor() {
  const { active, setBehaviors } = useStore()
  if (!active) return null
  const room = active
  return (
    <div className="home">
      <header className="home-head">
        <div>
          <p className="kicker">{room.name}</p>
          <h1>Menu</h1>
        </div>
      </header>
      <p className="lede">What pops up when you tap a student in this class.</p>
      <section className="panel menu-panel">
        <BehaviorEditor behaviors={room.behaviors} onChange={(behaviors) => setBehaviors(room.id, behaviors)} />
      </section>
    </div>
  )
}
