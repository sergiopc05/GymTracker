interface Props {
  count: number;
  done: boolean[];
  onToggle: (index: number) => void;
}

/** Fila de casillas [x] / [ ], una por serie. Cada una es táctil. */
export function SetBoxes({ count, done, onToggle }: Props) {
  return (
    <div className="setboxes">
      {Array.from({ length: count }, (_, i) => (
        <button
          key={i}
          type="button"
          className={done[i] ? "setbox is-done" : "setbox"}
          onClick={() => onToggle(i)}
          aria-label={`Serie ${i + 1}`}
          aria-pressed={!!done[i]}
        >
          {done[i] ? "[x]" : "[ ]"}
        </button>
      ))}
    </div>
  );
}
