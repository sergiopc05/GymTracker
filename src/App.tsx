import { useState } from "react";
import { StoreProvider } from "./store";
import { TabBar, type TabKey } from "./components/TabBar";
import { TodayScreen } from "./screens/TodayScreen";
import { WeekScreen } from "./screens/WeekScreen";
import { EditScreen } from "./screens/EditScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { mondayIndex, startOfToday } from "./lib/dates";

export default function App() {
  const [tab, setTab] = useState<TabKey>("hoy");
  const [editWeekday, setEditWeekday] = useState(() => mondayIndex(startOfToday()));

  return (
    <StoreProvider>
      <div className="app">
        <header className="appbar">
          <span className="appbar__logo" aria-hidden="true">
            <svg viewBox="0 0 24 24" width="20" height="20">
              <path
                d="M4 9v6M7 7v10M17 7v10M20 9v6M7 12h10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
            </svg>
          </span>
          <span className="appbar__title">GymTracker</span>
        </header>

        <main className="content">
          {tab === "hoy" && <TodayScreen goTo={setTab} />}
          {tab === "semana" && (
            <WeekScreen
              onEditDay={(w) => {
                setEditWeekday(w);
                setTab("editar");
              }}
            />
          )}
          {tab === "editar" && (
            <EditScreen weekday={editWeekday} setWeekday={setEditWeekday} />
          )}
          {tab === "ajustes" && <SettingsScreen />}
        </main>

        <TabBar active={tab} onChange={setTab} />
      </div>
    </StoreProvider>
  );
}
