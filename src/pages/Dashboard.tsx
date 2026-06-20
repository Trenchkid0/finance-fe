import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { OnboardingHero } from "@/components/dashboard/OnboardingHero";
import { BalanceSheet } from "@/components/dashboard/BalanceSheet";
import { AssetSummaryWidget } from "@/components/dashboard/AssetSummaryWidget";
import { MiniStatWidget } from "@/components/dashboard/MiniStatWidget";
import { InsightWidget } from "@/components/dashboard/InsightWidget";
import { CashflowSankey } from "@/components/charts/CashflowSankey";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { InlineErrorBoundary } from "@/components/ui/error-boundary";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useCachedApi } from "@/hooks/use-cached-api";
import { CacheKeys, CacheTTL } from "@/lib/cache";
import { api } from "@/lib/api";

import { getCurrentPreferences } from "@/lib/preferences";

import type { SummaryApiResponse, AssetGroup, Period } from "@/types";
import type { CashflowData } from "@/components/charts/CashflowSankey";

const ASSET_GROUP_COLOR: Record<string, string> = {
  cash: "var(--progress)",
  wallet: "color-mix(in srgb, var(--accent) 60%, var(--foreground))",
  bank: "var(--accent)",
  investment: "color-mix(in srgb, var(--accent) 75%, #000000)",
};

function buildAssetGroups(
  rows: {
    id: string;
    name: string;
    type: string;
    balance: number;
    color?: string;
  }[],
  totalNet: number,
  language: string,
) {
  const buckets = new Map<
    string,
    {
      id: string;
      name: string;
      value: number;
      percent: number;
      initial: string;
      color?: string;
    }[]
  >();
  const totals = new Map<string, number>();

  const assetGroupLabels: Record<string, string> = {
    cash: language === "id" ? "Tunai" : "Cash",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    bank: language === "id" ? "Bank" : "Bank",
    investment: language === "id" ? "Investasi" : "Investments",
  };

  for (const r of rows) {
    if (r.balance === 0) continue;
    const groupKey = r.type;
    const acc = {
      id: r.id,
      name: r.name,
      value: r.balance,
      percent: totalNet > 0 ? (r.balance / totalNet) * 100 : 0,
      initial: r.name.charAt(0).toUpperCase() || "?",
      color: r.color || undefined,
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
      color: ASSET_GROUP_COLOR[key] ?? "var(--muted-foreground)",
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

// Stagger delays (kept as named consts so no inline double-brace objects).
const DELAY_1: CSSProperties = { animationDelay: "60ms" };
const DELAY_2: CSSProperties = { animationDelay: "120ms" };
const DELAY_3: CSSProperties = { animationDelay: "180ms" };
const DELAY_4: CSSProperties = { animationDelay: "240ms" };

export default function Dashboard() {
  const { language } = useLanguage();
  const { user, accounts, refresh, loading: appLoading, setCounts } = useApp();
  const [searchParams] = useSearchParams();

  const period = searchParams.get("period") || "30d";
  const cashflowPeriod = searchParams.get("cashflow_period") || "30d";

  // Re-read layout preference when it changes in Settings
  const [, setPrefsRev] = useState(0);
  useEffect(() => {
    const onPrefsChanged = () => setPrefsRev((r) => r + 1);
    window.addEventListener("preferences-changed", onPrefsChanged);
    return () => window.removeEventListener("preferences-changed", onPrefsChanged);
  }, []);

  // CACHED API CALL - Dashboard Summary
  const {
    data: summaryData,
    isLoading: loading,
    refetch,
  } = useCachedApi({
    cacheKey: CacheKeys.summary() + `:${period}:${cashflowPeriod}`,
    fetcher: () =>
      api.get<SummaryApiResponse>(
        `/api/summary?period=${period}&cashflow_period=${cashflowPeriod}`,
      ),
    ttl: CacheTTL.SHORT, // 2 minutes for financial data
  });

  // Memoize active accounts + net worth
  const activeAccounts = useMemo(() => accounts.filter((a) => a.isActive), [accounts]);
  const netWorthCurrent = useMemo(
    () => activeAccounts.reduce((sum, a) => sum + Number(a.balance), 0),
    [activeAccounts],
  );
  const name = useMemo(() => {
    const n =
      user?.name?.trim().split(" ")[0] || user?.email?.split("@")?.[0] || "kamu";
    return capitalize(n);
  }, [user]);

  // Memoize asset groups
  const assetGroups = useMemo(() => {
    if (activeAccounts.length === 0) return [];
    return buildAssetGroups(
      activeAccounts.map((a) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        balance: Number(a.balance),
        color: a.color || undefined,
      })),
      netWorthCurrent,
      language,
    );
  }, [activeAccounts, netWorthCurrent, language]);

  // Memoize recent transactions
  const mappedRecent = useMemo(
    () =>
      (summaryData?.recent || []).map((tx) => ({
        id: String(tx.id),
        description:
          tx.description ||
          tx.category?.name ||
          (language === "id" ? "Transaksi" : "Transaction"),
        categoryName: tx.category?.name ?? null,
        categoryIcon: tx.category?.icon ?? null,
        accountName:
          tx.account?.name || (language === "id" ? "Akun Utama" : "Main Account"),
        transferToName: tx.transferTo?.name ?? null,
        date: tx.date,
        amount: Number(tx.amount),
        adminFee: Number(tx.adminFee || 0),
        type: tx.type as "income" | "expense" | "transfer",
      })),
    [summaryData?.recent, language],
  );

  // Cashflow-derived stats (memoized)
  const { totalInflow, totalOutflow, surplus, savingsRate, counts, isId, deltaRatio, assetsSide, liabilitiesSide, cashflowData } = useMemo(() => {
    const cf = summaryData?.cashflow || { inflow: [], outflow: [], total: 0, surplus: 0 };
    const inflow = (cf.inflow || []).reduce((s, i) => s + Number(i.value || 0), 0);
    const outflow = (cf.outflow || []).reduce((s, i) => s + Number(i.value || 0), 0);
    const surp = typeof cf.surplus === "number" ? cf.surplus : inflow - outflow;
    const rate = inflow > 0 ? (surp / inflow) * 100 : 0;
    const cnts = summaryData?.counts || { income: 0, expense: 0, transfer: 0, total: 0 };
    const langIsId = language === "id";
    const d = (summaryData?.netWorthCurrent || 0) - (summaryData?.netWorthPrevious || 0);
    const dRatio = summaryData?.netWorthPrevious ? (d / summaryData.netWorthPrevious) * 100 : 0;
    return {
      totalInflow: inflow,
      totalOutflow: outflow,
      surplus: surp,
      savingsRate: rate,
      counts: cnts,
      isId: langIsId,
      delta: d,
      deltaRatio: dRatio,
      assetsSide: { title: "Assets" as const, total: netWorthCurrent, groups: assetGroups },
      liabilitiesSide: { title: "Liabilities" as const, total: 0, groups: [] as AssetGroup[] },
      cashflowData: {
        total: cf.total,
        surplus: cf.surplus,
        inflow: (cf.inflow || []).map((item) => ({
          name: item.name, value: item.value, side: "source" as const, color: item.color || "#388BFD",
        })),
        outflow: (cf.outflow || []).map((item) => ({
          name: item.name, value: item.value, side: "target" as const, color: item.color || "#F85149",
        })),
      } as CashflowData,
    };
  }, [summaryData, language, netWorthCurrent, assetGroups]);

  // Listen to refresh events
  useEffect(() => {
    const handleRefresh = () => {
      refetch();
      refresh();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [refetch, refresh]);

  // Sync transaction counts from summary to global app context
  useEffect(() => {
    if (summaryData?.counts) {
      setCounts((prev) => ({
        ...prev,
        transactions: summaryData.counts.total,
      }));
    }
  }, [summaryData?.counts, setCounts]);

  if ((loading || appLoading) && !summaryData) {
    return <SkeletonDashboard />;
  }

  if (activeAccounts.length === 0) {
    return <OnboardingHero userName={name} />;
  }

  const dashboardLayout = getCurrentPreferences().dashboardLayout || "default";

  // Shared JSX sections (reused across layouts)
  const statsRow = (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up" style={DELAY_2}>
      <MiniStatWidget label={isId ? "Pemasukan" : "Income"} value={totalInflow} tone="income" hint="" count={counts.income} />
      <MiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value={totalOutflow} tone="expense" hint="" count={counts.expense} />
      <MiniStatWidget label={isId ? "Transaksi" : "Transactions"} value={counts.total} tone="neutral" isCurrency={false} hint={isId ? "total" : "total"} count={counts.total} />
      <InsightWidget ratio={savingsRate} surplus={surplus} isId={isId} />
    </section>
  );

  const tabbedCharts = (
    <Tabs defaultValue="cashflow" className="w-full">
      <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2">
        <TabsList>
          <TabsTrigger value="cashflow">{isId ? "Analisis Arus Kas" : "Cash Flow Analysis"}</TabsTrigger>
          <TabsTrigger value="assets">{isId ? "Distribusi Aset" : "Asset Distribution"}</TabsTrigger>
        </TabsList>
      </div>
      <TabsContent value="cashflow" className="animate-fade-in-up" style={DELAY_3}>
        <InlineErrorBoundary label="Cash Flow Chart">
          <CashflowSankey data={cashflowData} period={cashflowPeriod as Period} />
        </InlineErrorBoundary>
      </TabsContent>
      <TabsContent value="assets" className="animate-fade-in-up" style={DELAY_3}>
        <InlineErrorBoundary label="Asset Distribution">
          <BalanceSheet assets={assetsSide} liabilities={liabilitiesSide} hideEmptyLiabilities />
        </InlineErrorBoundary>
      </TabsContent>
    </Tabs>
  );

  const recentTxSection = (
    <section className="space-y-3 animate-fade-in-up" style={DELAY_4}>
      <div className="flex items-center gap-2">
        <div className="h-1 w-1 rounded-full bg-pink" />
        <h2 className="text-heading-sm text-foreground font-semibold">
          {isId ? "Transaksi Terbaru" : "Recent Transactions"}
        </h2>
      </div>
      <InlineErrorBoundary label="Recent Transactions">
        <RecentTransactions transactions={mappedRecent} />
      </InlineErrorBoundary>
    </section>
  );

  return (
    <div className="space-y-4 pb-8">
      {/* HEADER */}
      <section className="flex items-center gap-2.5 animate-fade-in-up">
        <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
          <Clock size={15} className="text-accent/70" />
          <span>{getGreeting(language)}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-border" />
        <h1 className="text-heading-lg text-foreground font-semibold">{capitalize(name)}</h1>
      </section>

      {summaryData && (
        <>
          {dashboardLayout === "default" && (
            <>
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={DELAY_1}>
                <div className="lg:col-span-2">
                  <InlineErrorBoundary label="Net Worth Chart"><NetWorthHero current={summaryData.netWorthCurrent || 0} previous={summaryData.netWorthPrevious || 0} series={summaryData.netWorthSeries || []} period={period as Period} /></InlineErrorBoundary>
                </div>
                <div className="lg:col-span-1"><AssetSummaryWidget total={netWorthCurrent} deltaRatio={deltaRatio} groups={assetGroups} isId={isId} /></div>
              </section>
              {statsRow}
              <div className="space-y-4">
                {tabbedCharts}
                {recentTxSection}
              </div>
            </>
          )}

          {dashboardLayout === "analytics" && (
            <>
              <section className="animate-fade-in-up" style={DELAY_1}>
                <InlineErrorBoundary label="Cash Flow Chart">
                  <CashflowSankey data={cashflowData} period={cashflowPeriod as Period} />
                </InlineErrorBoundary>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={DELAY_2}>
                <div className="lg:col-span-2">
                  <InlineErrorBoundary label="Net Worth Chart"><NetWorthHero current={summaryData.netWorthCurrent || 0} previous={summaryData.netWorthPrevious || 0} series={summaryData.netWorthSeries || []} period={period as Period} /></InlineErrorBoundary>
                </div>
                <div className="lg:col-span-1"><AssetSummaryWidget total={netWorthCurrent} deltaRatio={deltaRatio} groups={assetGroups} isId={isId} /></div>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up" style={DELAY_3}>
                <MiniStatWidget label={isId ? "Pemasukan" : "Income"} value={totalInflow} tone="income" hint="" count={counts.income} />
                <MiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value={totalOutflow} tone="expense" hint="" count={counts.expense} />
                <InsightWidget ratio={savingsRate} surplus={surplus} isId={isId} />
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={DELAY_4}>
                {recentTxSection}
                <InlineErrorBoundary label="Asset Distribution">
                  <BalanceSheet assets={assetsSide} liabilities={liabilitiesSide} hideEmptyLiabilities />
                </InlineErrorBoundary>
              </section>
            </>
          )}

          {dashboardLayout === "compact" && (
            <>
              <section className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in-up" style={DELAY_1}>
                <InlineErrorBoundary label="Net Worth Chart"><NetWorthHero current={summaryData.netWorthCurrent || 0} previous={summaryData.netWorthPrevious || 0} series={summaryData.netWorthSeries || []} period={period as Period} /></InlineErrorBoundary>
                <AssetSummaryWidget total={netWorthCurrent} deltaRatio={deltaRatio} groups={assetGroups} isId={isId} />
              </section>
              {statsRow}
              <section className="animate-fade-in-up" style={DELAY_3}>
                {tabbedCharts}
              </section>
              {recentTxSection}
            </>
          )}

          {dashboardLayout === "hero" && (
            <>
              <section className="animate-fade-in-up [&_.h-52]:!h-72" style={DELAY_1}>
                <InlineErrorBoundary label="Net Worth Chart"><NetWorthHero current={summaryData.netWorthCurrent || 0} previous={summaryData.netWorthPrevious || 0} series={summaryData.netWorthSeries || []} period={period as Period} /></InlineErrorBoundary>
              </section>
              <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-up" style={DELAY_2}>
                <AssetSummaryWidget total={netWorthCurrent} deltaRatio={deltaRatio} groups={assetGroups} isId={isId} />
                <div className="grid grid-cols-2 gap-3">
                  <MiniStatWidget label={isId ? "Pemasukan" : "Income"} value={totalInflow} tone="income" hint="" count={counts.income} />
                  <MiniStatWidget label={isId ? "Pengeluaran" : "Expenses"} value={totalOutflow} tone="expense" hint="" count={counts.expense} />
                  <MiniStatWidget label={isId ? "Transaksi" : "Transactions"} value={counts.total} tone="neutral" isCurrency={false} hint="total" count={counts.total} />
                  <InsightWidget ratio={savingsRate} surplus={surplus} isId={isId} />
                </div>
              </section>
              <div className="space-y-4">
                {tabbedCharts}
                {recentTxSection}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

