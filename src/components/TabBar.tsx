export type TabKey =
  | "hoy"
  | "mes"
  | "semana"
  | "plantillas"
  | "biblioteca"
  | "ajustes";

interface Props {
  active: TabKey;
  onChange: (tab: TabKey) => void;
}

const ORDER: TabKey[] = [
  "hoy",
  "mes",
  "semana",
  "plantillas",
  "biblioteca",
  "ajustes",
];

const LABEL: Record<TabKey, string> = {
  hoy: "hoy",
  mes: "mes",
  semana: "semana",
  plantillas: "plantillas",
  biblioteca: "biblio",
  ajustes: "ajustes",
};

export function TabBar({ active, onChange }: Props) {
  return (
    <nav className="tabbar">
      {ORDER.map((tab) => (
        <button
          key={tab}
          type="button"
          className={active === tab ? "tab is-active" : "tab"}
          onClick={() => onChange(tab)}
          aria-current={active === tab ? "page" : undefined}
        >
          <span className="tab__mark" aria-hidden="true">
            {active === tab ? "▸" : " "}
          </span>
          {LABEL[tab]}
        </button>
      ))}
    </nav>
  );
}
