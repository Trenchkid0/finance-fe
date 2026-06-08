import { useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { TrendingUp, ArrowUpRight, Clock, Wallet, Plus, Sparkles } from "lucide-react";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { OnboardingHero } from "@/components/dashboard/OnboardingHero";
import { BalanceSheet } from "@/components/dashboard/BalanceSheet";
import { CashflowSankey } from "@/components/charts/CashflowSankey";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { useApp } from "@/components/layout/AppLayout";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useCachedApi } from "@/hooks/use-cached-api";
import { CacheKeys, CacheTTL } from "@/lib/cache";
import { api } from "@/lib/api";

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
  const buckets = new Map<string, any[]>();
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

  const groups: any[] = [];
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
    fetcher: () => api.get<any>(`/api/summary?period=${period}&cashflow_period=${cashflowPeriod}`),
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

  const mappedRecent = (summaryData?.recent || []).map((tx: any) => ({
    id: tx.id,
    description: tx.description || tx.category?.name || (language === "id" ? "Transaksi" : "Transaction"),
    categoryName: tx.category?.name ?? null,
    categoryIcon: tx.category?.icon ?? null,
    accountName: tx.account?.name || (language === "id" ? "Akun Utama" : "Main Account"),
    transferToName: tx.transferTo?.name ?? null,
    date: tx.date,
    amount: Number(tx.amount),
    type: tx.type as "income" | "expense" | "transfer",
  }));

  const name = user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";

  // Compute quick stats for the hero section
  const totalIncome = (summaryData?.cashflow?.inflow || []).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const totalExpense = (summaryData?.cashflow?.outflow || []).reduce((s: number, i: any) => s + (Number(i.amount) || 0), 0);
  const delta = (summaryData?.netWorthCurrent || 0) - (summaryData?.netWorthPrevious || 0);
  const deltaRatio = summaryData?.netWorthPrevious ? (delta / summaryData.netWorthPrevious) * 100 : 0;

  return (
    <div className="space-y-6 pb-8">
      {/* Cache indicator (dev only) */}
      {import.meta.env.DEV && isCached && (
        <div className="fixed top-20 right-4 z-50 px-3 py-1.5 rounded-full bg-income/10 border border-income/30 text-income text-xs font-bold flex items-center gap-1.5 animate-fade-in">
          <div className="h-2 w-2 rounded-full bg-income animate-pulse" />
          Cached
        </div>
      )}

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
            <NetWorthHero
              current={summaryData.netWorthCurrent || 0}
              previous={summaryData.netWorthPrevious || 0}
              series={summaryData.netWorthSeries || []}
              period={period as any}
            />
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════
          LEVEL 2: KEY METRICS - Quick Financial Overview
          ═══════════════════════════════════════════════════════════════════ */}
      <section className="animate-fade-in-up" style={{ animationDelay: '100ms' }}>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-1 rounded-full bg-accent" />
          <h2 className="text-heading-sm text-foreground font-semibold">
            {language === "id" ? "Ringkasan Bulan Ini" : "This Month's Summary"}
          </h2>
        </div>
        
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <QuickStatCard
            label={language === "id" ? "Total Pemasukan" : "Total Income"}
            value={formatIDR(totalIncome)}
            prefix="+"
            colorClass="text-income"
            trend={{ value: 12.5, isPositive: true }}
            quickAction={{
              label: language === "id" ? "Tambah Income" : "Add Income",
              icon: <Plus size={12} />,
              href: "/transactions?type=income"
            }}
          />
          <QuickStatCard
            label={language === "id" ? "Total Pengeluaran" : "Total Expenses"}
            value={formatIDR(totalExpense)}
            prefix="-"
            colorClass="text-expense"
            trend={{ value: 8.3, isPositive: false }}
            quickAction={{
              label: language === "id" ? "Tambah Expense" : "Add Expense",
              icon: <Plus size={12} />,
              href: "/transactions?type=expense"
            }}
          />
          <QuickStatCard
            label={language === "id" ? "Selisih Bersih" : "Net Surplus"}
            value={formatIDR(totalIncome - totalExpense)}
            colorClass={totalIncome - totalExpense >= 0 ? "text-income" : "text-expense"}
            trend={{
              value: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
              isPositive: totalIncome - totalExpense >= 0
            }}
            quickAction={{
              label: language === "id" ? "Lihat Detail" : "View Details",
              icon: <ArrowUpRight size={12} />,
              href: "/transactions"
            }}
          />
          <QuickStatCard
            label={language === "id" ? "Akun Aktif" : "Active Accounts"}
            value={String(activeAccounts.length)}
            suffix={language === "id" ? " akun" : " accounts"}
            quickAction={{
              label: language === "id" ? "Kelola Akun" : "Manage Accounts",
              icon: <Wallet size={12} />,
              href: "/accounts"
            }}
          />
        </div>
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
            <CashflowSankey
              data={summaryData.cashflow || { inflow: [], outflow: [], total: 0, surplus: 0 }}
              period={cashflowPeriod as any}
            />
          </section>

          {/* Asset Distribution */}
          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-purple" />
              <h2 className="text-heading-sm text-foreground font-semibold">
                {language === "id" ? "Distribusi Aset" : "Asset Distribution"}
              </h2>
            </div>
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
          </section>

          {/* Recent Transactions */}
          <section className="space-y-4 animate-fade-in-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-pink" />
              <h2 className="text-heading-sm text-foreground font-semibold">
                {language === "id" ? "Transaksi Terbaru" : "Recent Transactions"}
              </h2>
            </div>
            <RecentTransactions transactions={mappedRecent} />
          </section>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Quick Stat Card — Enhanced with Trend Indicators & Quick Actions
   ═══════════════════════════════════════════════════════════════════ */
function QuickStatCard({
  label,
  value,
  prefix,
  suffix,
  colorClass,
  accent,
  trend,
  quickAction,
}: {
  label: string;
  value: string;
  prefix?: string;
  suffix?: string;
  colorClass?: string;
  accent?: boolean;
  trend?: { value: number; isPositive: boolean };
  quickAction?: { label: string; icon: React.ReactNode; href: string };
}) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden p-5 transition-all duration-300",
        "hover:border-accent/40 hover:-translate-y-0.5",
        accent && "border-accent/40 bg-gradient-to-br from-accent/10 to-accent/5"
      )}
    >
      {/* Enhanced gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/0 via-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      
      {/* Sparkle effect on hover (top-right corner) */}
      <div className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-all duration-300">
        <Sparkles size={16} className="text-accent animate-pulse" />
      </div>
      
      <div className="relative z-10 space-y-3">
        {/* Header: Label + Trend */}
        <div className="flex items-center justify-between">
          <p className="text-body-xs font-semibold text-muted-foreground uppercase tracking-wider transition-colors duration-200 group-hover:text-foreground/80">
            {label}
          </p>
          
          {/* Mini Trend Indicator */}
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold transition-all duration-200",
              trend.isPositive
                ? "bg-income/10 text-income group-hover:bg-income/20"
                : "bg-expense/10 text-expense group-hover:bg-expense/20"
            )}>
              <TrendingUp size={10} className={!trend.isPositive ? "rotate-180" : ""} />
              {Math.abs(trend.value).toFixed(1)}%
            </div>
          )}
        </div>
        
        {/* Value with enhanced typography */}
        <p className={cn(
          "text-numeric-xl font-bold tabular-nums tracking-tight transition-all duration-200",
          "group-hover:scale-[1.02]",
          colorClass || "text-foreground"
        )}>
          {prefix && <span className="text-numeric-lg opacity-80">{prefix}</span>}
          {value}
          {suffix && <span className="text-body-sm font-medium opacity-70 ml-1.5">{suffix}</span>}
        </p>

        {/* Quick Action Button (appears on hover) */}
        {quickAction && (
          <Link
            to={quickAction.href}
            className={cn(
              "flex items-center gap-1.5 text-body-xs font-medium text-accent",
              "opacity-0 group-hover:opacity-100 transition-all duration-200",
              "hover:text-accent/80 hover:gap-2"
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {quickAction.icon}
            {quickAction.label}
          </Link>
        )}
      </div>
    </Card>
  );
}
