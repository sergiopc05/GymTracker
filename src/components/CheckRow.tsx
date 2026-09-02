interface Props {
  checked: boolean;
  label: string;
  sub?: string;
  onToggle: () => void;
}

/** Fila tactil grande con estado de completado. Toda la fila es el boton. */
export function CheckRow({ checked, label, sub, onToggle }: Props) {
  return (
    <button
      type="button"
      className={checked ? "checkrow is-done" : "checkrow"}
      onClick={onToggle}
      aria-pressed={checked}
    >
      <span className="checkrow__box" aria-hidden="true">
        {checked ? (
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path
              d="M5 12.5l4.5 4.5L19 7"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : null}
      </span>
      <span className="checkrow__text">
        <span className="checkrow__label">{label}</span>
        {sub ? <span className="checkrow__sub">{sub}</span> : null}
      </span>
    </button>
  );
}
