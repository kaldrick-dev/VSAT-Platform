import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout.jsx";
import { AdminPage } from "./pages/AdminPage.jsx";
import { DashboardPage } from "./pages/DashboardPage.jsx";
import { HomePage } from "./pages/HomePage.jsx";
import { LoginPage } from "./pages/LoginPage.jsx";
import { SitesPage } from "./pages/SitesPage.jsx";
import { VendorPage } from "./pages/VendorPage.jsx";

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="sites" element={<SitesPage />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="vendor" element={<VendorPage />} />
          <Route path="admin" element={<AdminPage />} />
          <Route path="login" element={<LoginPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

