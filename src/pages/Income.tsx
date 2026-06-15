import { useEffect, useState } from "react";
import { startOfMonth, subMonths } from "date-fns";
import { api } from "@/lib/api";
import { formatMonthLabel } from "@/lib/utils/formatters";
import { IncomeClient } from "@/components/income/IncomeClient";
import { SkeletonIncome } from "@/components/ui/skeleton-loader";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cache, CacheTTL } from "@/lib/cache";
import type { TransactionApiItem } from "@/types";

interface IncomeAnalyticsData {
  transactions: {
    id: string;
    amount: number;
    date: string;
    description: string | null;
    accountName: string;
    categoryName: string | null;
    categoryIcon: string | null;
  }[];
  monthlyTrend: { month: string; amount: number }[];
  categoryBreakdown: { category: string; amount: number; percent: number; icon: string | null }[];
  currentMonthTotal: number;
  monthlyDelta: number | undefined;
  averageMonthly: number;
  maxIncome: { description: string; amount: number } | null;
}

export default function Income() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [incomeData, setIncomeData] = useState<IncomeAnalyticsData | null>(null);

  const INCOME_CACHE_KEY = `income:analytics:${language}`;

  const fetchIncomeData = async () => {
    // ✅ PERF: Check cache first — avoids heavy client-side recomputation
    const cached = cache.get<IncomeAnalyticsData>(INCOME_CACHE_KEY);
    if (cached) {
      setIncomeData(cached);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch up to 1000 income transactions for calculations
      const res = await api.get<{ transactions: TransactionApiItem[]; total: number }>("/api/transactions?type=income&limit=1000");
      const allIncome = res.transactions || [];

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // Current Month Total
      const currentMonthTotal = allIncome
        .filter((tx) => new Date(tx.date) >= currentMonthStart)
        .reduce((sum: number, tx) => sum + Number(tx.amount), 0);

      // Previous Month Total
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthTotal = allIncome
        .filter(
          (tx) =>
            new Date(tx.date) >= previousMonthStart &&
            new Date(tx.date) < currentMonthStart
        )
        .reduce((sum: number, tx) => sum + Number(tx.amount), 0);

      const monthlyDelta =
        previousMonthTotal === 0
          ? undefined
          : (currentMonthTotal - previousMonthTotal) / previousMonthTotal;

      // Maximum Single Income
      const maxIncomeTx = allIncome.reduce<{ description: string; amount: number } | null>((max, tx) => {
        const amt = Number(tx.amount);
        if (!max || amt > max.amount) {
          return {
            description: tx.description || tx.category?.name || (language === "id" ? "Pemasukan" : "Income"),
            amount: amt,
          };
        }
        return max;
      }, null);

      // Build 6-Month Monthly Trend
      const monthlyMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        monthlyMap.set(formatMonthLabel(d, language), 0);
      }

      for (const tx of allIncome) {
        const txDate = new Date(tx.date);
        if (txDate >= sixMonthsAgo) {
          const key = formatMonthLabel(txDate, language);
          if (monthlyMap.has(key)) {
            monthlyMap.set(key, monthlyMap.get(key)! + Number(tx.amount));
          }
        }
      }

      const monthlyTrend = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
        month,
        amount,
      }));

      // Average Monthly Income
      const monthsWithData = monthlyTrend.filter((m) => m.amount > 0).length;
      const averageMonthly =
        monthsWithData > 0
          ? monthlyTrend.reduce((sum, item) => sum + item.amount, 0) / monthsWithData
          : 0;

      // Build Category Breakdown
      const categoryMap = new Map<string, { amount: number; icon: string | null }>();
      let totalIncomeAmount = 0;

      for (const tx of allIncome) {
        const amt = Number(tx.amount);
        totalIncomeAmount += amt;
        const catName = tx.category?.name || (language === "id" ? "Tanpa Kategori" : "Uncategorized");
        const catIcon = tx.category?.icon || "📂";

        if (!categoryMap.has(catName)) {
          categoryMap.set(catName, { amount: 0, icon: catIcon });
        }
        categoryMap.get(catName)!.amount += amt;
      }

      const categoryBreakdown = Array.from(categoryMap.entries())
        .map(([category, data]) => ({
          category,
          amount: data.amount,
          percent: totalIncomeAmount > 0 ? (data.amount / totalIncomeAmount) * 100 : 0,
          icon: data.icon,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Map serialization transaction rows (limit 15)
      const transactions = allIncome.slice(0, 15).map((tx) => ({
        id: String(tx.id),
        amount: Number(tx.amount),
        date: tx.date,
        description: tx.description,
        accountName: tx.account?.name || (language === "id" ? "Akun Utama" : "Main Account"),
        categoryName: tx.category?.name ?? null,
        categoryIcon: tx.category?.icon ?? null,
      }));

      const incomeResult: IncomeAnalyticsData = {
        transactions,
        monthlyTrend,
        categoryBreakdown,
        currentMonthTotal,
        monthlyDelta,
        averageMonthly,
        maxIncome: maxIncomeTx,
      };
      setIncomeData(incomeResult);
      cache.set(INCOME_CACHE_KEY, incomeResult, CacheTTL.SHORT);
    } catch (err) {
      console.error("Failed to fetch income analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncomeData();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      cache.delete(INCOME_CACHE_KEY);
      fetchIncomeData();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, []);

  if (loading && !incomeData) {
    return <SkeletonIncome />;
  }

  if (!incomeData) return null;

  return (
    <IncomeClient
      transactions={incomeData.transactions}
      monthlyTrend={incomeData.monthlyTrend}
      categoryBreakdown={incomeData.categoryBreakdown}
      currentMonthTotal={incomeData.currentMonthTotal}
      monthlyDelta={incomeData.monthlyDelta}
      averageMonthly={incomeData.averageMonthly}
      maxIncome={incomeData.maxIncome}
    />
  );
}
