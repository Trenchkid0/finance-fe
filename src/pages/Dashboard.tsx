import { useEffect } from "react";
import type { CSSProperties } from "react";
import { useSearchParams } from "react-router-dom";
import { TrendingUp, TrendingDown, Clock, Sparkles } from "lucide-react";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { OnboardingHero } from "@/components/dashboard/OnboardingHero";
import { BalanceSheet } from "@/components/dashboard/BalanceSheet";
import { CashflowSankey } from "@/components/charts/CashflowSankey";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { InlineErrorBoundary } from "@/components/ui/error-boundary";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/components/layout/AppLayout";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useCachedApi } from "@/hooks/use-cached-api";
import { CacheKeys, CacheTTL } from "@/lib/cache";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
​
import type { SummaryApiResponse, AssetGroup, Period } from "@/types";
import type { CashflowData } from "@/components/charts/CashflowSankey";
​
const ASSET_GROUP_COLOR: Record<string, string> = {
  cash: "var(--progress)",
  wallet: "color-mix(in srgb, var(--accent) 60%, var(--foreground))",
  bank: "var(--accent)",
  investment: "color-mix(in srgb, var(--accent) 75%, #000000)",
};
​
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
​
  const assetGroupLabels: Record<string, string> = {
    cash: language === "id" ? "Tunai" : "Cash",
    wallet: language === "id" ? "E-wallet" : "E-wallet",
    bank: language === "id" ? "Bank" : "Bank",
    investment: language === "id" ? "Investasi" : "Investments",
  };
​
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
​
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
​
  groups.sort((a, b) => b.total - a.total);
  return groups;
}
​
function capitalize(s: string): string {
  if (!s) return "";
  return s.charAt(0).toUpperCase() + s.slice(1);
}
​
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
​
// Stagger delays (kept as named consts so no inline double-brace objects).
const DELAY_1: CSSProperties = { animationDelay: "60ms" };
const DELAY_2: CSSProperties = { animationDelay: "120ms" };
const DELAY_3: CSSProperties = { animationDelay: "180ms" };
const DELAY_4: CSSProperties = { animationDelay: "240ms" };
​
export default function Dashboard() {
  const { language } = useLanguage();
  const { user, accounts, refresh, loading: appLoading } = useApp();
  const [searchParams] = useSearchParams();
​
  const period = searchParams.get("period") || "30d";
  const cashflowPeriod = searchParams.get("cashflow_period") || "30d";
​
  // CACHED API CALL - Dashboard Summary
  const {
    data: summaryData,
    isLoading: loading,
    refetch,
    isCached,
  } = useCachedApi({
    cacheKey: CacheKeys.summary() + `:${period}:${cashflowPeriod}`,
    fetcher: () =>
      api.get<SummaryApiResponse>(
        `/api/summary?period=${period}&cashflow_period=${cashflowPeriod}`,
      ),
    ttl: CacheTTL.SHORT, // 2 minutes for financial data
  });
​
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
​
  // Debug cache status in development
  useEffect(() => {
    if (import.meta.env.DEV && isCached) {
      console.log("Dashboard: Cache HIT - instant load!");
    }
  }, [isCached]);
​
  if ((loading || appLoading) && !summaryData) {
    return <SkeletonDashboard />;
  }
​
  const activeAccounts = accounts.filter((a) => a.isActive);
​
  if (activeAccounts.length === 0) {
    const name =
      user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";
    return <OnboardingHero userName={capitalize(name)} />;
  }
​
  const netWorthCurrent = activeAccounts.reduce(
    (sum, a) => sum + Number(a.balance),
    0,
  );
​
  const assetGroups = buildAssetGroups(
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
​
  const mappedRecent = (summaryData?.recent || []).map((tx) => ({
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
  }));
​
  const name =
    user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";
​
  // Net worth delta
  const delta =
    (summaryData?.netWorthCurrent || 0) - (summaryData?.netWorthPrevious || 0);
  const deltaRatio = summaryData?.netWorthPrevious
    ? (delta / summaryData.netWorthPrevious) * 100
    : 0;
​
  // Cashflow-derived stats for the zentra-style widget row
  const cf = summaryData?.cashflow || {
    inflow: [],
    outflow: [],
    total: 0,
    surplus: 0,
  };
  const totalInflow = (cf.inflow || []).reduce(
    (s, i) => s + Number(i.value || 0),
    0,
  );
  const totalOutflow = (cf.outflow || []).reduce(
    (s, i) => s + Number(i.value || 0),
    0,
  );
  const surplus =
    typeof cf.surplus === "number" ? cf.surplus : totalInflow - totalOutflow;
  const savingsRate = totalInflow > 0 ? (surplus / totalInflow) * 100 : 0;
  const txCount = mappedRecent.length;
  const isId = language === "id";
​
  // BalanceSheet side props (named consts -> single-brace usage in JSX)
  const assetsSide = {
    title: "Assets" as const,
    total: netWorthCurrent,
    groups: assetGroups,
  };
  const liabilitiesSide = {
    title: "Liabilities" as const,
    total: 0,
    groups: [] as AssetGroup[],
  };
​
  // Cashflow data for the existing Sankey chart
  const cashflowData: CashflowData = {
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
  };
​
  return (
    <div className="space-y-4 pb-8">
      {/* HEADER - greeting + net worth delta badge */}
      <section className="flex items-center gap-2.5 animate-fade-in-up">
        <div className="flex items-center gap-2 text-body-sm text-muted-foreground">
          <Clock size={15} className="text-accent/70" />
          <span>{getGreeting(language)}</span>
        </div>
        <div className="h-1 w-1 rounded-full bg-border" />
        <h1 className="text-heading-lg text-foreground font-semibold">
          {capitalize(name)}
        </h1>
      </section>
​
      {summaryData && (
        <>
          {/* ROW 1 - Net Worth hero (2/3) + Gross-Volume-style summary (1/3) */}
          <section
            className="grid grid-cols-1 lg:grid-cols-3 gap-4 animate-fade-in-up"
            style={DELAY_1}
          >
            <div className="lg:col-span-2">
              <InlineErrorBoundary label="Net Worth Chart">
                <NetWorthHero
                  current={summaryData.netWorthCurrent || 0}
                  previous={summaryData.netWorthPrevious || 0}
                  series={summaryData.netWorthSeries || []}
                  period={period as Period}
                />
              </InlineErrorBoundary>
            </div>
            <div className="lg:col-span-1">
              <AssetSummaryWidget
                total={netWorthCurrent}
                deltaRatio={deltaRatio}
                groups={assetGroups}
                isId={isId}
              />
            </div>
          </section>
​
          {/* ROW 2 - Small stat widgets (zentra Transactions/Customers/Insights) */}
          <section
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in-up"
            style={DELAY_2}
          >
            <MiniStatWidget
              label={isId ? "Pemasukan" : "Income"}
              value={totalInflow}
              tone="income"
              hint={isId ? "" : ""}
            />
            <MiniStatWidget
              label={isId ? "Pengeluaran" : "Expenses"}
              value={totalOutflow}
              tone="expense"
              hint={isId ? "" : ""}
            />
            <MiniStatWidget
              label={isId ? "Transaksi" : "Transactions"}
              value={txCount}
              tone="neutral"
              isCurrency={false}
              hint={isId ? "terbaru" : "recent"}
            />
            <InsightWidget ratio={savingsRate} surplus={surplus} isId={isId} />
          </section>

          {/* ROW 3 - Detailed analyses (Tabbed) */}
          <div className="space-y-4">
            <Tabs defaultValue="cashflow" className="w-full">
              <div className="flex items-center justify-between border-b border-border/30 pb-2 mb-2">
                <TabsList>
                  <TabsTrigger value="cashflow">
                    {isId ? "Analisis Arus Kas" : "Cash Flow Analysis"}
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    {isId ? "Distribusi Aset" : "Asset Distribution"}
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="cashflow" className="animate-fade-in-up" style={DELAY_3}>
                <InlineErrorBoundary label="Cash Flow Chart">
                  <CashflowSankey
                    data={cashflowData}
                    period={cashflowPeriod as Period}
                  />
                </InlineErrorBoundary>
              </TabsContent>

              <TabsContent value="assets" className="animate-fade-in-up" style={DELAY_3}>
                <InlineErrorBoundary label="Asset Distribution">
                  <BalanceSheet
                    assets={assetsSide}
                    liabilities={liabilitiesSide}
                    hideEmptyLiabilities
                  />
                </InlineErrorBoundary>
              </TabsContent>
            </Tabs>

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
          </div>
        </>
      )}
    </div>
  );
}
​
/* ZENTRA-STYLE WIDGETS (dark theme, existing color tokens) */
​
function AssetSummaryWidget({
  total,
  deltaRatio,
  groups,
  isId,
}: {
  total: number;
  deltaRatio: number;
  groups: AssetGroup[];
  isId: boolean;
}) {
  const up = deltaRatio >= 0;
  const badgeClass = up
    ? "text-income bg-income/10"
    : "text-expense bg-expense/10";
  return (
    <Card className="h-full p-6 flex flex-col gap-5">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {isId ? "Total Kekayaan" : "Net Worth"}
          </p>
          {deltaRatio !== 0 && (
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${badgeClass}`}
            >
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {up ? "+" : ""}
              {deltaRatio.toFixed(1)}%
            </span>
          )}
        </div>
        <p className="text-3xl font-black font-mono tabular-nums text-foreground">
          {formatIDR(total)}
        </p>
      </div>
​
      <div className="flex flex-col gap-3.5 mt-auto">
        {groups.length === 0 ? (
          <p className="text-xs text-muted-foreground/60">
            {isId ? "Belum ada aset." : "No assets yet."}
          </p>
        ) : (
          groups.slice(0, 4).map((g) => {
            const dotStyle: CSSProperties = { backgroundColor: g.color };
            const barStyle: CSSProperties = {
              width: `${Math.max(g.percent, 2)}%`,
              backgroundColor: g.color,
            };
            return (
              <div key={g.name} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <span className="size-2 rounded-full" style={dotStyle} />
                    {g.name}
                  </span>
                  <span className="font-mono tabular-nums font-semibold text-foreground">
                    {formatIDR(g.total)}
                  </span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500 ease-out"
                    style={barStyle}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}
​
function MiniStatWidget({
  label,
  value,
  tone,
  hint,
  isCurrency = true,
}: {
  label: string;
  value: number;
  tone: "income" | "expense" | "neutral";
  hint: string;
  isCurrency?: boolean;
}) {
  const valueColor =
    tone === "income"
      ? "text-income"
      : tone === "expense"
        ? "text-expense"
        : "text-foreground";
  const dotColor =
    tone === "income"
      ? "bg-income"
      : tone === "expense"
        ? "bg-expense"
        : "bg-accent";
  const filled = Math.min(
    28,
    Math.max(6, Math.round(((value % 100) / 100) * 28) + 8),
  );
​
  return (
    <Card className="p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-1.5 min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            {label}
          </p>
          <p
            className={`text-2xl font-black font-mono tabular-nums truncate ${valueColor}`}
          >
            {isCurrency ? formatIDR(value) : value.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-muted-foreground/50">{hint}</p>
        </div>
        <DotMatrix filled={filled} total={28} dotColor={dotColor} />
      </div>
    </Card>
  );
}
​
function DotMatrix({
  filled,
  total,
  dotColor,
}: {
  filled: number;
  total: number;
  dotColor: string;
}) {
  return (
    <div className="grid grid-cols-4 gap-1 shrink-0 place-items-center" aria-hidden>
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`block size-1.5 rounded-full aspect-square shrink-0 transition-colors ${i < filled ? dotColor : "bg-border/40"}`}
        />
      ))}
    </div>
  );
}
​
function InsightWidget({
  ratio,
  surplus,
  isId,
}: {
  ratio: number;
  surplus: number;
  isId: boolean;
}) {
  const pct = Math.max(0, Math.min(100, ratio));
  const positive = surplus >= 0;
  const progressStyle: CSSProperties = {
    width: `${pct}%`,
    backgroundColor: "var(--accent)",
  };
  return (
    <Card className="relative overflow-hidden p-5 flex flex-col justify-between">
      <div className="relative flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-widest text-accent">
        <Sparkles size={13} />
        {isId ? "Wawasan" : "Insights"}
      </div>
      <div className="relative mt-2">
        <p className="text-3xl font-black font-mono tabular-nums text-foreground">
          {pct.toFixed(0)}%
        </p>
        <p className="text-[11px] text-muted-foreground/70 mt-1 leading-snug">
          {positive
            ? isId
              ? `Anda menabung ${pct.toFixed(0)}% dari pemasukan periode ini.`
              : `You saved ${pct.toFixed(0)}% of income this period.`
            : isId
              ? "Pengeluaran melebihi pemasukan periode ini."
              : "Spending exceeded income this period."}
        </p>
      </div>
      <div className="relative mt-3 h-1.5 w-full rounded-full bg-border/30 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 ease-out"
          style={progressStyle}
        />
      </div>
    </Card>
  );
}
​