import { useState } from "react"
import { BEHAVIOR_COLORS, EMOJI_CHOICES } from "../defaults.ts"
import { uid } from "../id.ts"
import type { Behavior, BehaviorKind } from "../types.ts"

interface BehaviorEditorProps {
  behaviors: Behavior[]
  onChange: (behaviors: Behavior[]) => void
}

export function BehaviorEditor({ behaviors, onChange }: BehaviorEditorProps) {
  function patch(id: string, partial: Partial<Behavior>) {
    onChange(behaviors.map((behavior) => (behavior.id === id ? { ...behavior, ...partial } : behavior)))
  }

  return (
    <div className="behavior-editor">
      {behaviors.map((behavior) => (
        <BehaviorRow key={behavior.id} behavior={behavior} onPatch={(partial) => patch(behavior.id, partial)} onRemove={() => onChange(behaviors.filter((item) => item.id !== behavior.id))} />
      ))}
      <button
        type="button"
        className="btn btn-line add-behavior"
        onClick={() =>
          onChange([
            ...behaviors,
            {
              id: uid(),
              name: "",
              kind: "count",
              color: BEHAVIOR_COLORS[behaviors.length % BEHAVIOR_COLORS.length],
              emoji: "⭐",
            },
          ])
        }
      >
        + Add something to track
      </button>
    </div>
  )
}

function BehaviorRow({
  behavior,
  onPatch,
  onRemove,
}: {
  behavior: Behavior
  onPatch: (partial: Partial<Behavior>) => void
  onRemove: () => void
}) {
  const [emojiOpen, setEmojiOpen] = useState(false)

  return (
    <div className="behavior-edit-row" style={{ background: behavior.color }}>
      <button type="button" className="emoji-btn" onClick={() => setEmojiOpen((open) => !open)} aria-label="Choose icon">
        {behavior.emoji}
      </button>
      {emojiOpen ? (
        <div className="emoji-pop">
          {EMOJI_CHOICES.map((emoji) => (
            <button
              key={emoji}
              type="button"
              onClick={() => {
                onPatch({ emoji })
                setEmojiOpen(false)
              }}
            >
              {emoji}
            </button>
          ))}
        </div>
      ) : null}
      <input
        aria-label="Behavior name"
        value={behavior.name}
        placeholder="Behavior"
        onChange={(event) => onPatch({ name: event.target.value })}
      />
      <div className="kind-switch" role="group" aria-label="How this is tracked">
        <button type="button" className={behavior.kind === "count" ? "is-on" : ""} onClick={() => onPatch({ kind: "count" satisfies BehaviorKind })}>
          # Count
        </button>
        <button type="button" className={behavior.kind === "toggle" ? "is-on" : ""} onClick={() => onPatch({ kind: "toggle" satisfies BehaviorKind })}>
          On/off
        </button>
      </div>
      <div className="color-dots">
        {BEHAVIOR_COLORS.map((color) => (
          <button
            key={color}
            type="button"
            className={behavior.color === color ? "is-on" : ""}
            style={{ background: color }}
            aria-label={`Color ${color}`}
            onClick={() => onPatch({ color })}
          />
        ))}
      </div>
      <button type="button" className="icon-btn remove-behavior" onClick={onRemove} aria-label={`Remove ${behavior.name || "behavior"}`}>
        ×
      </button>
    </div>
  )
}
