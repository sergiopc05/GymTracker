import { useState } from "react";
import { StoreProvider } from "./store";
import { TabBar, type TabKey } from "./components/TabBar";
import { TodayScreen } from "./screens/TodayScreen";
import { CalendarScreen } from "./screens/CalendarScreen";
import { WeekScreen } from "./screens/WeekScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";
import { startOfToday } from "./lib/dates";

export default function App() {
  const [tab, setTab] = useState<TabKey>("hoy");
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(() => startOfToday());

  // Al tocar la pestaña "hoy" se vuelve al día de hoy; al llegar desde el
  // calendario se conserva la fecha elegida.
  function goToTab(next: TabKey) {
    if (next === "hoy") setSelectedDate(startOfToday());
    setTab(next);
  }

  return (
    <StoreProvider>
      <div className="app">
        <header className="appbar">
          <span className="appbar__logo" aria-hidden="true">
            {"[>_]"}
          </span>
          <span className="appbar__title">gymtracker</span>
        </header>

        <main className="content">
          {tab === "hoy" && (
            <TodayScreen
              date={selectedDate}
              setDate={setSelectedDate}
              goTo={goToTab}
            />
          )}
          {tab === "mes" && (
            <CalendarScreen
              onPickDate={(d) => {
                setSelectedDate(d);
                setTab("hoy");
              }}
            />
          )}
          {tab === "semana" && (
            <WeekScreen
              onEditTemplate={(id) => {
                setOpenTemplateId(id);
                setTab("plantillas");
              }}
            />
          )}
          {tab === "plantillas" && (
            <TemplatesScreen openId={openTemplateId} setOpenId={setOpenTemplateId} />
          )}
          {tab === "ajustes" && <SettingsScreen />}
        </main>

        <TabBar active={tab} onChange={goToTab} />
      </div>
    </StoreProvider>
  );
}
