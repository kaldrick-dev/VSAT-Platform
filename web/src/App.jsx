import { Suspense, lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { PublicLayout } from "./components/PublicLayout.jsx";
import { RequireRole } from "./components/RequireRole.jsx";
import { ROLES } from "./lib/access.js";
import { ApplyPage } from "./pages/ApplyPage.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { RecordsPage } from "./pages/RecordsPage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { WorkspacePage } from "./pages/WorkspacePage.jsx";
import { VendorPage } from "./pages/VendorPage.jsx";
import { AdminFlagsPage } from "./pages/AdminFlagsPage.jsx";
import { AdminLogPage } from "./pages/AdminLogPage.jsx";
import { AdminSitesPage } from "./pages/AdminSitesPage.jsx";
import { HelpPage } from "./pages/HelpPage.jsx";
import { MyFlagsPage } from "./pages/MyFlagsPage.jsx";
import { NotificationsPage } from "./pages/NotificationsPage.jsx";
import { ProfilePage } from "./pages/ProfilePage.jsx";

// Loads MapLibre only when the workspace map is opened.
const SitesPage = lazy(() => import("./pages/SitesPage.jsx").then((m) => ({ default: m.SitesPage })));

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public site: open to everyone */}
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="records" element={<RecordsPage />} />
          <Route path="dashboard" element={<Navigate to="/records" replace />} />
        </Route>

        {/* App shell: role-restricted workspaces only (the API enforces the same rules) */}
        <Route element={<Layout />}>
          <Route element={<RequireRole roles={[ROLES.VENDOR, ROLES.ADMIN]} />}>
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="help" element={<HelpPage />} />
            <Route path="sites" element={<Suspense fallback={<p className="p-8 text-sm text-mute">Loading map…</p>}><SitesPage /></Suspense>} />
          </Route>
          <Route element={<RequireRole roles={[ROLES.VENDOR]} />}>
            <Route path="sites/:id/apply" element={<ApplyPage />} />
            <Route path="vendor" element={<VendorPage />} />
            <Route path="flags" element={<MyFlagsPage />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
          <Route element={<RequireRole roles={[ROLES.ADMIN]} />}>
            <Route path="admin" element={<AdminPage />} />
            <Route path="admin/sites" element={<AdminSitesPage />} />
            <Route path="admin/flags" element={<AdminFlagsPage />} />
            <Route path="admin/log" element={<AdminLogPage />} />
          </Route>
        </Route>
        <Route path="login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
