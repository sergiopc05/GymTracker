import { useMemo, useState } from "react";
import { useStore } from "../store";
import {
  addMonths,
  daysInMonth,
  formatMonth,
  isoDate,
  mondayIndex,
  sameMonth,
  startOfMonth,
  startOfToday,
} from "../lib/dates";
import { dayProgress, resolveDay } from "../lib/progress";
import type { DayType } from "../types";

interface Props {
  onPickDate: (date: Date) => void;
}

type Status = "rest" | "done" | "partial" | "planned" | "missed";

interface Cell {
  date: Date;
  day: number;
  inMonth: boolean;
  isToday: boolean;
  type: DayType | null;
  emoji: string | null;
  status: Status;
}

const WD = ["L", "M", "X", "J", "V", "S", "D"];

export function CalendarScreen({ onPickDate }: Props) {
  const { store } = useStore();
  const today = startOfToday();
  const [month, setMonth] = useState(() => startOfMonth(today));

  const cells = useMemo<Cell[]>(() => {
    const first = startOfMonth(month);
    const lead = mondayIndex(first); // huecos antes del día 1
    const total = daysInMonth(month);
    const out: Cell[] = [];

    for (let i = 0; i < lead; i++) {
      const d = new Date(first);
      d.setDate(d.getDate() - (lead - i));
      out.push(blank(d));
    }
    for (let day = 1; day <= total; day++) {
      const date = new Date(month.getFullYear(), month.getMonth(), day);
      const resolved = resolveDay(store, date);
      const p = dayProgress(resolved);
      const past = isoDate(date) < isoDate(today);
      let status: Status;
      if (!p.hasPlan) status = "rest";
      else if (p.complete) status = "done";
      else if (p.doneSets > 0) status = "partial";
      else status = past ? "missed" : "planned";
      out.push({
        date,
        day,
        inMonth: true,
        isToday: isoDate(date) === isoDate(today),
        type: resolved.template?.type ?? null,
        emoji: resolved.template?.emoji ?? null,
        status,
      });
    }
    while (out.length % 7 !== 0) {
      const last = out[out.length - 1].date;
      const d = new Date(last);
      d.setDate(d.getDate() + 1);
      out.push(blank(d));
    }
    return out;

    function blank(d: Date): Cell {
      return {
        date: d,
        day: d.getDate(),
        inMonth: false,
        isToday: false,
        type: null,
        emoji: null,
        status: "rest",
      };
    }
  }, [store, month, today]);

  const stats = useMemo(() => {
    let done = 0;
    let pending = 0;
    let upcoming = 0;
    for (const c of cells) {
      if (!c.inMonth) continue;
      if (c.status === "done") done++;
      else if (c.status === "missed" || c.status === "partial") pending++;
      else if (c.status === "planned") upcoming++;
    }
    return { done, pending, upcoming };
  }, [cells]);

  const viewingNow = sameMonth(month, today);

  return (
    <div className="screen">
      <div className="calnav">
        <button
          type="button"
          className="btn datenav__arrow"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          aria-label="Mes anterior"
        >
          {"<"}
        </button>
        <div className="calnav__title">{formatMonth(month)}</div>
        <button
          type="button"
          className="btn datenav__arrow"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          aria-label="Mes siguiente"
        >
          {">"}
        </button>
      </div>

      {!viewingNow && (
        <button
          type="button"
          className="linkbtn"
          onClick={() => setMonth(startOfMonth(today))}
        >
          ir al mes actual
        </button>
      )}

      <div className="cal">
        {WD.map((w) => (
          <div key={w} className="cal__head">
            {w}
          </div>
        ))}
        {cells.map((c, i) =>
          c.inMonth ? (
            <button
              key={i}
              type="button"
              data-type={c.type ?? undefined}
              className={
                "cal__cell" + (c.isToday ? " is-today" : "") + ` is-${c.status}`
              }
              onClick={() => onPickDate(c.date)}
            >
              <span className="cal__num">{c.day}</span>
              <span className="cal__mark">
                {c.status === "missed"
                  ? "×"
                  : c.status === "done" && !c.emoji
                    ? "✓"
                    : (c.emoji ?? "")}
              </span>
            </button>
          ) : (
            <span key={i} className="cal__cell is-outside" />
          ),
        )}
      </div>

      <p className="dim cal__legend">
        fondo lleno = hecho · fondo tenue = a medias · × = sin hacer
      </p>
      <p className="prompt">
        {formatMonth(month).toLowerCase()} — hecho {stats.done} · pendiente{" "}
        {stats.pending} · próximo {stats.upcoming}
      </p>
    </div>
  );
}
