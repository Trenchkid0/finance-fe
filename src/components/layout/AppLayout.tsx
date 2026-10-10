import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { cache, CacheKeys, CacheTTL } from "@/lib/cache";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { QuickAddDialog } from "@/components/transactions/QuickAddDialog";
import { QuickAddFab } from "@/components/transactions/QuickAddFab";
import { QuickAddProvider } from "@/components/transactions/QuickAddProvider";
import { CardTypeProvider } from "@/components/ui/card";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { loadPreferences, setPreferencesAuthenticated } from "@/lib/preferences";
import { OnboardingCurrencyModal } from "@/components/onboarding/OnboardingCurrencyModal";
import { GhostChatModal } from "@/components/chat/GhostChatModal";
import type { User, Account, Category } from "@/types";

interface AppContextType {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  counts: {
    accounts: number;
    transactions: number;
  };
  setCounts: React.Dispatch<React.SetStateAction<{ accounts: number; transactions: number }>>;
  refresh: () => Promise<void>;
  loading: boolean;
  openOnboarding: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { t } = useLanguage();
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState({ accounts: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      // 1. Fetch user info
      const me = await api.get<User>("/api/auth/me");
      setUser(me);
      setPreferencesAuthenticated(true);

      // 2. Fetch preferences from backend (applies theme/language and syncs account order)
      const prefs = await loadPreferences(true);

      // 3. Fetch layout data (with cache for accounts/categories)
      let accList = cache.get<Account[]>(CacheKeys.accounts());
      if (!accList) {
        accList = await api.get<Account[]>("/api/accounts?status=all");
        cache.set(CacheKeys.accounts(), accList, CacheTTL.LONG);
      }

      // Show onboarding modal ONLY if user has NOT completed onboarding AND has 0 accounts
      if (prefs && prefs.onboardingCompleted === false && accList.length === 0) {
        setShowOnboarding(true);
      }

      let catList = cache.get<Category[]>(CacheKeys.categories());
      if (!catList) {
        catList = await api.get<Category[]>("/api/categories");
        cache.set(CacheKeys.categories(), catList, CacheTTL.LONG);
      }

      setAccounts(accList);
      setCategories(catList);
      setCounts((prev) => ({
        ...prev,
        accounts: accList.length,
      }));
    } catch (err) {
      console.error("App initialization failed", err);
      // Redirect to login if unauthorized
      navigate("/login");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const handleRefresh = () => {
      refresh();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => window.removeEventListener("refresh-app-data", handleRefresh);
  }, [refresh]);

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background text-foreground font-mono">
        <div className="text-sm animate-pulse">
          {t("connectingToApp")}
        </div>
      </div>
    );
  }

  const canCreate = accounts.length > 0;

  return (
    <AppContext.Provider
      value={{
        user,
        accounts,
        categories,
        counts,
        setCounts,
        refresh,
        loading,
        openOnboarding: () => setShowOnboarding(true),
      }}
    >
      <CardTypeProvider>
      <SidebarProvider
        style={
          {
            "--sidebar-width": "16rem",
            "--sidebar-width-icon": "4rem",
            "--header-height": "3rem",
          } as React.CSSProperties
        }
      >
        <QuickAddProvider canCreate={canCreate}>
          <AppSidebar
            variant="sidebar"
            user={user ?? { name: "", email: "" }}
            counts={{
              accounts: counts.accounts,
              transactions: counts.transactions,
            }}
          />
          <SidebarInset>
            {/* Skip-to-content: muncul saat pertama kali Tab ditekan, untuk aksesibilitas keyboard/screen reader */}
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[200] focus:rounded-xl focus:bg-accent focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white focus:shadow-xl focus:outline-none"
            >
              {"Skip to main content"}
            </a>
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div id="main-content" className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 pb-24 md:pb-6 overflow-x-hidden" tabIndex={-1}>
                {children}
              </div>
            </div>
          </SidebarInset>

          {/* Global overlays */}
          <CommandPalette accounts={accounts} />
          <QuickAddDialog
            accounts={accounts}
            categories={categories}
            aiScanEnabled={true}
          />
          <QuickAddFab />
          <MobileBottomNav />
          <OnboardingCurrencyModal
            open={showOnboarding}
            onComplete={() => setShowOnboarding(false)}
          />
          <GhostChatModal />
        </QuickAddProvider>
      </SidebarProvider>
      </CardTypeProvider>
    </AppContext.Provider>
  );
}
