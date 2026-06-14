import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { ErrorBoundary } from "@/components/ui/error-boundary";
import { Toaster } from "sonner";

// Import all pages
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Dashboard from "@/pages/Dashboard";
import Accounts from "@/pages/Accounts";
import AccountDetail from "@/pages/AccountDetail";
import Transactions from "@/pages/Transactions";
import Income from "@/pages/Income";
import Expenses from "@/pages/Expenses";
import Budget from "@/pages/Budget";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import Goals from "@/pages/Goals";
import Recurring from "@/pages/Recurring";
import Investments from "@/pages/Investments";

import { useEffect, useState } from "react";
import { LanguageProvider } from "@/lib/contexts/LanguageContext";
import { loadSavedTheme } from "@/lib/utils/theme";

/** Layout wrapper — renders AppLayout + child routes via <Outlet /> */
function DashboardLayout() {
  return (
    <AppLayout>
      <ErrorBoundary>
        <Outlet />
      </ErrorBoundary>
    </AppLayout>
  );
}

export default function App() {
  const [toastSettings, setToastSettings] = useState(() => {
    if (typeof window === "undefined") {
      return {
        position: "top-right" as const,
        theme: "dark" as const,
        duration: 4000,
        expand: false,
      };
    }
    try {
      const saved = localStorage.getItem("racks-notification-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          position: parsed.position || "top-right",
          theme: parsed.theme || "dark",
          duration: parsed.duration || 4000,
          expand: parsed.expand !== undefined ? parsed.expand : false,
        };
      }
    } catch (e) {}
    return {
      position: "top-right" as const,
      theme: "dark" as const,
      duration: 4000,
      expand: false,
    };
  });

  useEffect(() => {
    loadSavedTheme();

    const handleUpdate = () => {
      try {
        const saved = localStorage.getItem("racks-notification-settings");
        if (saved) {
          const parsed = JSON.parse(saved);
          setToastSettings({
            position: parsed.position || "top-right",
            theme: parsed.theme || "dark",
            duration: parsed.duration || 4000,
            expand: parsed.expand !== undefined ? parsed.expand : false,
          });
        }
      } catch (e) {}
    };

    window.addEventListener("notification-settings-changed", handleUpdate);
    return () => window.removeEventListener("notification-settings-changed", handleUpdate);
  }, []);

  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          {/* Auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected dashboard routes — shared layout */}
          <Route element={<DashboardLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="accounts/:id" element={<AccountDetail />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="income" element={<Income />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="budget" element={<Budget />} />
            <Route path="goals" element={<Goals />} />
            <Route path="recurring" element={<Recurring />} />
            <Route path="investments" element={<Investments />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Profile />} />
          </Route>

          {/* Catch-all fallback redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster
          theme={toastSettings.theme === "custom" ? undefined : (toastSettings.theme as any)}
          position={toastSettings.position as any}
          duration={toastSettings.duration}
          expand={toastSettings.expand}
          className={toastSettings.theme === "custom" ? "custom-toaster" : ""}
        />
      </BrowserRouter>
    </LanguageProvider>
  );
}
