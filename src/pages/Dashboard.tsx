import { useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { TrendingUp, Clock } from "lucide-react";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { OnboardingHero } from "@/components/dashboard/OnboardingHero";
import { BalanceSheet } from "@/components/dashboard/BalanceSheet";
import { CashflowSankey } from "@/components/charts/CashflowSankey";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { InlineErrorBoundary } from "@/components/ui/error-boundary";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useCachedApi } from "@/hooks/use-cached-api";
import { CacheKeys, CacheTTL } from "@/lib/cache";
import { api } from "@/lib/api";

import type { SummaryApiResponse, AssetGroup, Period } from "@/types";
import type { CashflowData } from "@/components/charts/CashflowSankey";

const ASSET_GROUP_COLOR: Record<string, string> = {
  cash: "var(--income)",
  wallet: "var(--warning)",
  bank: "var(--accent)",
  investment: "var(--progress)",
};

function buildAssetGroups(
  rows: { id: string; name: string; type: string; balance: number }[],
  totalNet: number,
  language: string
) {
  const buckets = new Map<string, { id: string; name: string; value: number; percent: number; initial: string }[]>();
  const totals = new Map<string, number>();

  const assetGroupLabels: Record<string, string> = {
    cash: language === "id" ? "Tunai" : "Cash",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    bank: language === "id" ? "Bank" : "Bank",
    investment: language === "id" ? "Investasi" : "Investments",
  };

  for (const r of rows) {
    if (r.balance === 0) continue;
    const groupKey =
      r.type === "investment" ? "investment" : r.type === "bank" ? "bank" : "cash";
    const acc = {
      id: r.id,
      name: r.name,
      value: r.balance,
      percent: totalNet > 0 ? (r.balance / totalNet) * 100 : 0,
      initial: r.name.charAt(0).toUpperCase() || "?",
    };
    const list = buckets.get(groupKey) ?? [];
    list.push(acc);
    buckets.set(groupKey, list);
    totals.set(groupKey, (totals.get(groupKey) ?? 0) + r.balance);
  }

  const groups: AssetGroup[] = [];
  for (const [key, accounts] of buckets) {
    const total = totals.get(key) ?? 0;
    accounts.sort((a, b) => b.value - a.value);
    groups.push({
      name: assetGroupLabels[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
      color: ASSET_GROUP_COLOR[key] ?? "#8B949E",
      total,
      percent: totalNet > 0 ? (total / totalNet) * 100 : 0,
      accounts,
    });
  }

  groups.sort((a, b) => b.total - a.total);
  return groups;
}

function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getGreeting(language: string): string {
  const h = new Date().getHours();
  if (language === "en") {
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    if (h < 20) return "Good evening";
    return "Good night";
  }
  if (h < 12) return "Selamat pagi";
  if (h < 17) return "Selamat siang";
  if (h < 20) return "Selamat sore";
  return "Selamat malam";
}

export default function Dashboard() {
  const { language } = useLanguage();
  const { user, accounts, refresh, loading: appLoading } = useApp();
  const [searchParams] = useSearchParams();

  const period = searchParams.get("period") || "30d";
  const cashflowPeriod = searchParams.get("cashflow_period") || "30d";

  // ✅ CACHED API CALL - Dashboard Summary
  const { 
    data: summaryData, 
    isLoading: loading, 
    refetch,
    isCached 
  } = useCachedApi({
    cacheKey: CacheKeys.summary() + `:${period}:${cashflowPeriod}`,
    fetcher: () => api.get<SummaryApiResponse>(`/api/summary?period=${period}&cashflow_period=${cashflowPeriod}`),
    ttl: CacheTTL.SHORT, // 2 minutes for financial data
  });

  // Listen to refresh events
  useEffect(() => {
    const handleRefresh = () => {
      refetch(); // ✅ Use cached refetch
      refresh();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [refetch, refresh]);

  // Debug cache status in development
  useEffect(() => {
    if (import.meta.env.DEV && isCached) {
      console.log('📦 Dashboard: Cache HIT - instant load!');
    }
  }, [isCached]);

  if ((loading || appLoading) && !summaryData) {
    return <SkeletonDashboard />;
  }

  const activeAccounts = accounts.filter((a) => a.isActive);

  if (activeAccounts.length === 0) {
    const name = user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";
    return <OnboardingHero userName={capitalize(name)} />;
  }

  const netWorthCurrent = activeAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0
  );

  const assetGroups = buildAssetGroups(
    activeAccounts.map((a) => ({
      id: a.id,
      name: a.name,
      type: a.type,
      balance: Number(a.balance),
    })),
    netWorthCurrent,
    language
  );

  const mappedRecent = (summaryData?.recent || []).map((tx) => ({
    id: String(tx.id),
    description: tx.description || tx.category?.name || (language === "id" ? "Transaksi" : "Transaction"),
    categoryName: tx.category?.name ?? null,
    categoryIcon: tx.category?.icon ?? null,
    accountName: tx.account?.name || (language === "id" ? "Akun Utama" : "Main Account"),
    transferToName: tx.transferTo?.name ?? null,
    date: tx.date,
    amount: Number(tx.amount),
    adminFee: Number(tx.adminFee || 0),
    type: tx.type as "income" | "expense" | "transfer",
  }));

  const name = user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";

  // Compute quick stats for the hero section
  const delta = (summaryData?.netWorthCurrent || 0) - (summaryData?.netWorthPrevious || 0);
  const deltaRatio = summaryData?.netWorthPrevious ? (delta / summaryData.netWorthPrevious) * 100 : 0;

  return (
    <div className="space-y-6 pb-8">

      {/* ═══════════════════════════════════════════════════════════════════
          LEVEL 1: HERO SECTION - Most Important (Net Worth at a Glance)
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="space-y-4 animate-fade-in-up">
        {/* Greeting with time-based context */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
            <Clock size={15} className="text-accent/70" />
            <span>{getGreeting(language)}</span>
          </div>
          <div className="h-1 w-1 rounded-full bg-border" />
          <h1 className="text-heading-lg text-foreground font-semibold">
            {capitalize(name)}
          </h1>
          
          {/* Delta badge - prominent position */}
          {delta !== 0 && (
            <div className={`ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border-2 transition-all duration-200 ${
              delta > 0
                ? "text-income bg-income/10 border-income/30 hover:bg-income/15"
                : "text-expense bg-expense/10 border-expense/30 hover:bg-expense/15"
            }`}>
              <TrendingUp size={14} className={delta < 0 ? "rotate-180" : ""} />
              {delta > 0 ? "+" : ""}{deltaRatio.toFixed(1)}%
            </div>
          )}
        </div>

        {/* Net Worth Hero - THE MOST IMPORTANT METRIC */}
        {summaryData && (
          <div className="animate-fade-in-up" style={{ animationDelay: '50ms' }}>
            <InlineErrorBoundary label="Net Worth Chart">
              <NetWorthHero
                current={summaryData.netWorthCurrent || 0}
                previous={summaryData.netWorthPrevious || 0}
                series={summaryData.netWorthSeries || []}
                period={period as Period}
              />
            </InlineErrorBoundary>
          </div>
        )}
      </section>

     

      {/* ═══════════════════════════════════════════════════════════════════
          LEVEL 3: DETAILED ANALYSIS - Stacked Layout (Top to Bottom)
          ═══════════════════════════════════════════════════════════════════ */}
      {summaryData && (
        <div className="space-y-6">
          {/* Cashflow Visualization - Full Width */}
          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-teal" />
              <h2 className="text-heading-sm text-foreground font-semibold">
                {language === "id" ? "Analisis Arus Kas" : "Cash Flow Analysis"}
              </h2>
            </div>
            <InlineErrorBoundary label="Cash Flow Chart">
              <CashflowSankey
                data={(() => {
                  const cf = summaryData.cashflow || { inflow: [], outflow: [], total: 0, surplus: 0 };
                  return {
                    total: cf.total,
                    surplus: cf.surplus,
                    inflow: (cf.inflow || []).map((item) => ({
                      name: item.name,
                      value: item.value,
                      side: "source" as const,
                      color: item.color || "#388BFD",
                    })),
                    outflow: (cf.outflow || []).map((item) => ({
                      name: item.name,
                      value: item.value,
                      side: "target" as const,
                      color: item.color || "#F85149",
                    })),
                  } satisfies CashflowData;
                })()}
                period={cashflowPeriod as Period}
              />
            </InlineErrorBoundary>
          </section>

          {/* Asset Distribution */}
          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-purple" />
              <h2 className="text-heading-sm text-foreground font-semibold">
                {language === "id" ? "Distribusi Aset" : "Asset Distribution"}
              </h2>
            </div>
            <InlineErrorBoundary label="Asset Distribution">
              <BalanceSheet
                assets={{
                  title: "Assets",
                  total: netWorthCurrent,
                  groups: assetGroups,
                }}
                liabilities={{
                  title: "Liabilities",
                  total: 0,
                  groups: [],
                }}
                hideEmptyLiabilities
              />
            </InlineErrorBoundary>
          </section>

          {/* Recent Transactions */}
          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-pink" />
              <h2 className="text-heading-sm text-foreground font-semibold">
                {language === "id" ? "Transaksi Terbaru" : "Recent Transactions"}
              </h2>
            </div>
            <InlineErrorBoundary label="Recent Transactions">
              <RecentTransactions transactions={mappedRecent} />
            </InlineErrorBoundary>
          </section>
        </div>
      )}
    </div>
  );
}
