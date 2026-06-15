import { useEffect, useState } from "react";
import { startOfMonth, subMonths } from "date-fns";
import { api } from "@/lib/api";
import { formatMonthLabel } from "@/lib/utils/formatters";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { SkeletonExpenses } from "@/components/ui/skeleton-loader";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { cache, CacheTTL } from "@/lib/cache";
import type { TransactionApiItem } from "@/types";

interface ExpenseAnalyticsData {
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
  maxExpenseCategory: { name: string; amount: number } | null;
}

export default function Expenses() {
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<ExpenseAnalyticsData | null>(null);

  const EXPENSE_CACHE_KEY = `expense:analytics:${language}`;

  const fetchExpenseData = async () => {
    // ✅ PERF: Check cache first — avoids heavy client-side recomputation
    const cached = cache.get<ExpenseAnalyticsData>(EXPENSE_CACHE_KEY);
    if (cached) {
      setExpenseData(cached);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      // Fetch up to 1000 expense transactions for calculations
      const res = await api.get<{ transactions: TransactionApiItem[]; total: number }>("/api/transactions?type=expense&limit=1000");
      const allExpenses = res.transactions || [];

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // Current Month Total
      const currentMonthTotal = allExpenses
        .filter((tx) => new Date(tx.date) >= currentMonthStart)
        .reduce((sum: number, tx) => sum + Number(tx.amount), 0);

      // Previous Month Total
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthTotal = allExpenses
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

      // Build 6-Month Monthly Trend
      const monthlyMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        monthlyMap.set(formatMonthLabel(d, language), 0);
      }

      for (const tx of allExpenses) {
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

      // Average Monthly Expense
      const monthsWithData = monthlyTrend.filter((m) => m.amount > 0).length;
      const averageMonthly =
        monthsWithData > 0
          ? monthlyTrend.reduce((sum, item) => sum + item.amount, 0) / monthsWithData
          : 0;

      // Build Category Breakdown
      const categoryMap = new Map<string, { amount: number; icon: string | null }>();
      let totalExpenseAmount = 0;

      for (const tx of allExpenses) {
        const amt = Number(tx.amount);
        totalExpenseAmount += amt;
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
          percent: totalExpenseAmount > 0 ? (data.amount / totalExpenseAmount) * 100 : 0,
          icon: data.icon,
        }))
        .sort((a, b) => b.amount - a.amount);

      // Highest Spending Category
      const maxExpenseCategory =
        categoryBreakdown.length > 0
          ? {
              name: categoryBreakdown[0].category,
              amount: categoryBreakdown[0].amount,
            }
          : null;

      // Map serialization transaction rows (limit 15)
      const transactions = allExpenses.slice(0, 15).map((tx) => ({
        id: String(tx.id),
        amount: Number(tx.amount),
        date: tx.date,
        description: tx.description,
        accountName: tx.account?.name || (language === "id" ? "Akun Utama" : "Main Account"),
        categoryName: tx.category?.name ?? null,
        categoryIcon: tx.category?.icon ?? null,
      }));

      const expenseResult: ExpenseAnalyticsData = {
        transactions,
        monthlyTrend,
        categoryBreakdown,
        currentMonthTotal,
        monthlyDelta,
        averageMonthly,
        maxExpenseCategory,
      };
      setExpenseData(expenseResult);
      cache.set(EXPENSE_CACHE_KEY, expenseResult, CacheTTL.SHORT);
    } catch (err) {
      console.error("Failed to fetch expense analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenseData();
  }, []);

  useEffect(() => {
    const handleRefresh = () => {
      cache.delete(EXPENSE_CACHE_KEY);
      fetchExpenseData();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, []);

  if (loading && !expenseData) {
    return <SkeletonExpenses />;
  }

  if (!expenseData) return null;

  return (
    <ExpensesClient
      transactions={expenseData.transactions}
      monthlyTrend={expenseData.monthlyTrend}
      categoryBreakdown={expenseData.categoryBreakdown}
      currentMonthTotal={expenseData.currentMonthTotal}
      monthlyDelta={expenseData.monthlyDelta}
      averageMonthly={expenseData.averageMonthly}
      maxExpenseCategory={expenseData.maxExpenseCategory}
    />
  );
}
