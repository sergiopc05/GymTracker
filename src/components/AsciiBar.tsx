interface Props {
  done: number;
  total: number;
  width?: number;
  label?: string;
}

/** Barra de progreso monospace: [######----] 6/10 */
export function AsciiBar({ done, total, width = 18, label }: Props) {
  const ratio = total === 0 ? 0 : done / total;
  const filled = Math.round(ratio * width);
  const bar = "#".repeat(filled) + "-".repeat(Math.max(0, width - filled));
  const complete = total > 0 && done >= total;
  return (
    <div className={complete ? "asciibar is-complete" : "asciibar"}>
      {label && <span className="asciibar__label">{label}</span>}
      <span className="asciibar__track">[{bar}]</span>
      <span className="asciibar__count">
        {done}/{total}
      </span>
    </div>
  );
}
