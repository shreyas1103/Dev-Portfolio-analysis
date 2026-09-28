import { Routes, Route } from "react-router-dom";

import { LoginPage } from "./features/auth/LoginPage";
import { RegisterPage } from "./features/auth/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { PageLayout } from "./components/layout/PageLayout";
import { SyncStatusBanner } from "./features/dashboard/SyncStatusBanner";
import { ConsistencyScoreCard } from "./features/dashboard/ConsistencyScoreCard";
import { ActivityHeatmap } from "./features/dashboard/ActivityHeatmap";
import {ReposPage} from "./features/repos/ReposPage";
import {WeakAreasPage} from "./features/weak-areas/WeakAreasPage";
import {ResumeSuggestionsPage} from "./features/resume/ResumeSuggestionsPage"
// function DashboardPage() {
//   return <h1>Dashboard</h1>;
// }
import { SettingsPage } from "./features/settings/SettingsPage";

function DashboardPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-slate-900">
        Dashboard
      </h1>

      <SyncStatusBanner />
      <ConsistencyScoreCard />
      <ActivityHeatmap />
    </div>
  );
}
function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<PageLayout />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/repos" element={<ReposPage />} />
      <Route path="/weak-areas" element={<WeakAreasPage />} />
      <Route path="/resume" element={<ResumeSuggestionsPage />} />
      <Route
  path="/settings"
  element={<SettingsPage />}
/>
        </Route>
      </Route>
    </Routes>
  );
}

export default App;