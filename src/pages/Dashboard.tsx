import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "@/lib/api";
import { NetWorthHero } from "@/components/dashboard/NetWorthHero";
import { OnboardingHero } from "@/components/dashboard/OnboardingHero";
import { BalanceSheet } from "@/components/dashboard/BalanceSheet";
import { CashflowSankey } from "@/components/charts/CashflowSankey";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { SkeletonDashboard } from "@/components/ui/skeleton-loader";
import { useApp } from "@/components/layout/AppLayout";

const ASSET_GROUP_COLOR: Record<string, string> = {
  cash: "#79B8FF",
  wallet: "#79B8FF",
  bank: "#388BFD",
  investment: "#1F6FEB",
};

const ASSET_GROUP_LABEL: Record<string, string> = {
  cash: "Tunai",
  wallet: "E-wallet",
  bank: "Bank",
  investment: "Investasi",
};

function buildAssetGroups(
  rows: { id: string; name: string; type: string; balance: number }[],
  totalNet: number
) {
  const buckets = new Map<string, any[]>();
  const totals = new Map<string, number>();

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
      name: ASSET_GROUP_LABEL[key] ?? key.charAt(0).toUpperCase() + key.slice(1),
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

export default function Dashboard() {
  const { user, accounts, refresh } = useApp();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);

  const period = searchParams.get("period") || "30d";
  const cashflowPeriod = searchParams.get("cashflow_period") || "30d";

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>(
        `/api/summary?period=${period}&cashflow_period=${cashflowPeriod}`
      );
      setSummaryData(data);
    } catch (err) {
      console.error("Failed to fetch dashboard summary:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, [period, cashflowPeriod]);

  // Listen to refresh events
  useEffect(() => {
    const handleRefresh = () => {
      fetchSummary();
      refresh();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [period, cashflowPeriod]);

  if (loading && !summaryData) {
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
    netWorthCurrent
  );

  const mappedRecent = (summaryData?.recent || []).map((tx: any) => ({
    id: tx.id,
    description: tx.description || tx.category?.name || "Transaksi",
    categoryName: tx.category?.name ?? null,
    categoryIcon: tx.category?.icon ?? null,
    accountName: tx.account?.name || "Akun Utama",
    transferToName: tx.transferTo?.name ?? null,
    date: tx.date,
    amount: Number(tx.amount),
    type: tx.type as "income" | "expense" | "transfer",
  }));

  const name = user?.name?.trim().split(" ")[0] || user?.email?.split("@")[0] || "kamu";

  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
          Selamat datang kembali, {capitalize(name)}
        </h1>
        <p className="text-sm text-text-muted">
          Berikut adalah ringkasan kesehatan finansial Anda saat ini.
        </p>
      </header>

      {summaryData && (
        <>
          <NetWorthHero
            current={summaryData.netWorthCurrent || 0}
            previous={summaryData.netWorthPrevious || 0}
            series={summaryData.netWorthSeries || []}
            period={period as any}
          />

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

          <CashflowSankey
            data={summaryData.cashflow || { inflow: [], outflow: [], total: 0, surplus: 0 }}
            period={cashflowPeriod as any}
          />

          <RecentTransactions transactions={mappedRecent} />
        </>
      )}
    </div>
  );
}
