import { uid } from "./id.ts"
import type { Behavior } from "./types.ts"

export const BEHAVIOR_COLORS = [
  "#D7E6F5",
  "#F6E7A8",
  "#F7D5C6",
  "#D7EBCF",
  "#E5D8F6",
  "#F6D6E4",
  "#F8E0C2",
  "#D4EDEA",
]

export const EMOJI_CHOICES = ["🙋", "⭐", "🔄", "🎒", "👍", "👀", "✋", "💬", "📝", "✅", "🎯", "🌟"]

export function starterBehaviors(): Behavior[] {
  return [
    { id: uid(), name: "Participation", kind: "count", color: BEHAVIOR_COLORS[0], emoji: "🙋" },
    { id: uid(), name: "Positive behavior", kind: "count", color: BEHAVIOR_COLORS[1], emoji: "⭐" },
    { id: uid(), name: "Redirect", kind: "count", color: BEHAVIOR_COLORS[2], emoji: "🔄" },
    { id: uid(), name: "Prepared", kind: "toggle", color: BEHAVIOR_COLORS[3], emoji: "🎒" },
  ]
}
