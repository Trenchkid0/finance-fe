import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/api";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";
import { CommandPalette } from "@/components/command-palette/CommandPalette";
import { QuickAddDialog } from "@/components/transactions/QuickAddDialog";
import { QuickAddFab } from "@/components/transactions/QuickAddFab";
import { QuickAddProvider } from "@/components/transactions/QuickAddProvider";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
}

export interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
  isActive: boolean;
  transactionCount?: number;
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon: string;
  isDefault?: boolean;
}

interface AppContextType {
  user: User | null;
  accounts: Account[];
  categories: Category[];
  counts: {
    accounts: number;
    transactions: number;
  };
  refresh: () => Promise<void>;
  loading: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [counts, setCounts] = useState({ accounts: 0, transactions: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const refresh = useCallback(async () => {
    try {
      // 1. Fetch user info
      const me = await api.get<User>("/api/auth/me");
      setUser(me);

      // 2. Fetch layout data
      const accList = await api.get<Account[]>("/api/accounts?status=all");
      const catList = await api.get<Category[]>("/api/categories");
      
      // Fetch transactions count via transactions API with limit 1
      const txData = await api.get<any>("/api/transactions?limit=1");

      setAccounts(accList);
      setCategories(catList);
      setCounts({
        accounts: accList.length,
        transactions: txData?.total || 0,
      });
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
        <div className="text-sm animate-pulse">Menghubungkan ke Racks Finance...</div>
      </div>
    );
  }

  const canCreate = accounts.length > 0;

  return (
    <AppContext.Provider value={{ user, accounts, categories, counts, refresh, loading }}>
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
            <SiteHeader />
            <div className="flex flex-1 flex-col">
              <div className="flex flex-col gap-4 p-4 md:gap-6 md:p-6 pb-24 md:pb-6">
                {children}
              </div>
            </div>
          </SidebarInset>

          {/* Global overlays */}
          <CommandPalette accounts={accounts} />
          <QuickAddDialog
            accounts={accounts}
            categories={categories}
            aiScanEnabled={true} // Enabled since we support DeepSeek scan
          />
          <QuickAddFab />
          <MobileBottomNav />
        </QuickAddProvider>
      </SidebarProvider>
    </AppContext.Provider>
  );
}
