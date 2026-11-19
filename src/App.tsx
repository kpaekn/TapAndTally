import { useState } from "react"
import { Sidebar } from "./components/Sidebar.tsx"
import { StoreProvider, useStore } from "./store.tsx"
import { ClassHome } from "./screens/ClassHome.tsx"
import { LiveRoom } from "./screens/LiveRoom.tsx"
import { MenuEditor } from "./screens/MenuEditor.tsx"
import { Reports } from "./screens/Reports.tsx"
import { Wizard } from "./screens/Wizard.tsx"

type Screen = "wizard" | "home" | "live" | "reports" | "menu"

function Shell() {
  const { data, active, setActive } = useStore()
  const [screen, setScreen] = useState<Screen>(data.classes.length > 0 ? "home" : "wizard")

  if (screen === "wizard") {
    return <Wizard onDone={() => setScreen("home")} onCancel={data.classes.length > 0 ? () => setScreen("home") : null} />
  }
  if (screen === "live") return <LiveRoom onClose={() => setScreen("home")} />

  return (
    <div className="shell">
      <Sidebar
        classes={data.classes}
        activeId={active?.id ?? null}
        screen={screen}
        onPickClass={(id) => {
          setActive(id)
          setScreen("home")
        }}
        onNewClass={() => setScreen("wizard")}
        onStart={() => setScreen("live")}
        onMenu={() => setScreen("menu")}
        onReports={() => setScreen("reports")}
        onHome={() => setScreen("home")}
      />
      <main className="main">
        {screen === "reports" ? <Reports /> : null}
        {screen === "menu" ? <MenuEditor /> : null}
        {screen === "home" ? <ClassHome onStart={() => setScreen("live")} onEditMenu={() => setScreen("menu")} /> : null}
      </main>
    </div>
  )
}

export default function App() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
