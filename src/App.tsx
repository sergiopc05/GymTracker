import { useState } from "react";
import { StoreProvider } from "./store";
import { TabBar, type TabKey } from "./components/TabBar";
import { TodayScreen } from "./screens/TodayScreen";
import { WeekScreen } from "./screens/WeekScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";
import { SettingsScreen } from "./screens/SettingsScreen";

export default function App() {
  const [tab, setTab] = useState<TabKey>("hoy");
  const [openTemplateId, setOpenTemplateId] = useState<string | null>(null);

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
          {tab === "hoy" && <TodayScreen goTo={setTab} />}
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

        <TabBar active={tab} onChange={setTab} />
      </div>
    </StoreProvider>
  );
}
