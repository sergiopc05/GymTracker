interface Props {
  value?: string;
  onChange: (emoji: string) => void;
}

const EMOJIS = [
  "🏋️", "💪", "🦵", "🏆", "🔥", "⚡",
  "🏃", "🚶", "🥾", "🚴", "⛰️", "🧗",
  "🏊", "🤽", "🌊", "🤸", "🧘", "🥊",
  "🧱", "🎯", "⏱️", "📈", "🚧", "🛌", "☕",
];

/** Rejilla de emojis para identificar la plantilla. Toca para elegir/quitar. */
export function EmojiPicker({ value, onChange }: Props) {
  return (
    <div className="emojigrid">
      <button
        type="button"
        className={!value ? "emojigrid__opt is-sel" : "emojigrid__opt"}
        onClick={() => onChange("")}
        aria-label="Sin emoji"
        title="Sin emoji"
      >
        ∅
      </button>
      {EMOJIS.map((e) => (
        <button
          key={e}
          type="button"
          className={e === value ? "emojigrid__opt is-sel" : "emojigrid__opt"}
          onClick={() => onChange(e === value ? "" : e)}
          aria-pressed={e === value}
        >
          {e}
        </button>
      ))}
    </div>
  );
}
