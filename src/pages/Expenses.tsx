import { useEffect, useState } from "react";
import { startOfMonth, subMonths } from "date-fns";
import { api } from "@/lib/api";
import { formatMonthLabel } from "@/lib/utils/formatters";
import { ExpensesClient } from "@/components/expenses/ExpensesClient";
import { Loader2 } from "lucide-react";

export default function Expenses() {
  const [loading, setLoading] = useState(true);
  const [expenseData, setExpenseData] = useState<any>(null);

  const fetchExpenseData = async () => {
    try {
      setLoading(true);
      // Fetch up to 1000 expense transactions for calculations
      const res = await api.get<any>("/api/transactions?type=expense&limit=1000");
      const allExpenses = res.transactions || [];

      const now = new Date();
      const currentMonthStart = startOfMonth(now);
      const sixMonthsAgo = startOfMonth(subMonths(now, 5));

      // Current Month Total
      const currentMonthTotal = allExpenses
        .filter((tx: any) => new Date(tx.date) >= currentMonthStart)
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      // Previous Month Total
      const previousMonthStart = startOfMonth(subMonths(now, 1));
      const previousMonthTotal = allExpenses
        .filter(
          (tx: any) =>
            new Date(tx.date) >= previousMonthStart &&
            new Date(tx.date) < currentMonthStart
        )
        .reduce((sum: number, tx: any) => sum + Number(tx.amount), 0);

      const monthlyDelta =
        previousMonthTotal === 0
          ? undefined
          : (currentMonthTotal - previousMonthTotal) / previousMonthTotal;

      // Build 6-Month Monthly Trend
      const monthlyMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        monthlyMap.set(formatMonthLabel(d), 0);
      }

      for (const tx of allExpenses) {
        const txDate = new Date(tx.date);
        if (txDate >= sixMonthsAgo) {
          const key = formatMonthLabel(txDate);
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
        const catName = tx.category?.name || "Tanpa Kategori";
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
      const transactions = allExpenses.slice(0, 15).map((tx: any) => ({
        id: tx.id,
        amount: Number(tx.amount),
        date: tx.date,
        description: tx.description,
        accountName: tx.account?.name || "Akun Utama",
        categoryName: tx.category?.name ?? null,
        categoryIcon: tx.category?.icon ?? null,
      }));

      setExpenseData({
        transactions,
        monthlyTrend,
        categoryBreakdown,
        currentMonthTotal,
        monthlyDelta,
        averageMonthly,
        maxExpenseCategory,
      });
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
      fetchExpenseData();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, []);

  if (loading && !expenseData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
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
