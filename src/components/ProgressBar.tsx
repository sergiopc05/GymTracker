interface Props {
  done: number;
  total: number;
  label?: string;
}

export function ProgressBar({ done, total, label }: Props) {
  const pct = total === 0 ? 0 : Math.round((done / total) * 100);
  const complete = total > 0 && done === total;

  return (
    <div className="progress">
      <div className="progress__head">
        <span>{label ?? "Progreso"}</span>
        <span className={complete ? "progress__count is-complete" : "progress__count"}>
          {done}/{total}
        </span>
      </div>
      <div className="progress__track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
        <div
          className={complete ? "progress__fill is-complete" : "progress__fill"}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
