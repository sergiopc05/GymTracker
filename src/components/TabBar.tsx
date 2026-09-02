export type TabKey = "hoy" | "semana" | "editar" | "ajustes";

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const ICONS: Record<TabKey, JSX.Element> = {
  hoy: (
    <path
      d="M6.5 12h3l1.5-4 2 8 1.5-4h3"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  semana: (
    <>
      <rect x="4" y="5" width="16" height="15" rx="2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path d="M4 9h16M9 3v4M15 3v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  editar: (
    <path
      d="M4 20h4L19 9a2 2 0 0 0-3-3L5 17v3z"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  ),
  ajustes: (
    <>
      <circle cx="12" cy="12" r="3.2" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M12 3v2.2M12 18.8V21M4.2 7l1.9 1.1M17.9 15.9l1.9 1.1M4.2 17l1.9-1.1M17.9 8.1L19.8 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </>
  ),
};

const LABELS: Record<TabKey, string> = {
  hoy: "Hoy",
  semana: "Semana",
  editar: "Editar",
  ajustes: "Ajustes",
};

const ORDER: TabKey[] = ["hoy", "semana", "editar", "ajustes"];

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      {ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          className={active === tab ? "tabbar__btn is-active" : "tabbar__btn"}
          onClick={() => onChange(tab)}
          aria-current={active === tab ? "page" : undefined}
        >
          <svg viewBox="0 0 24 24" width="24" height="24">
            {ICONS[tab]}
          </svg>
          <span>{LABELS[tab]}</span>
        </button>
      ))}
    </nav>
  );
}
