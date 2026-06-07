import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useApp } from "@/components/layout/AppLayout";
import { BudgetClient, type BudgetCategoryData } from "@/components/budget/BudgetClient";
import { api } from "@/lib/api";
import { Loader2 } from "lucide-react";
import { startOfMonth, endOfMonth, format } from "date-fns";
import { useLanguage } from "@/lib/contexts/LanguageContext";

export default function Budget() {
  const { language } = useLanguage();
  const { categories: globalCategories } = useApp();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [budgetData, setBudgetData] = useState<any>(null);

  const monthParam = searchParams.get("month"); // Format: YYYY-MM
  const now = new Date();
  
  let currentYear = now.getFullYear();
  let currentMonthNum = now.getMonth() + 1; // 1..12

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [y, m] = monthParam.split("-").map(Number);
    if (y >= 2000 && y <= now.getFullYear() + 1 && m >= 1 && m <= 12) {
      currentYear = y;
      currentMonthNum = m;
    }
  }

  const monthDate = new Date(currentYear, currentMonthNum - 1, 1);
  const startDateStr = format(startOfMonth(monthDate), "yyyy-MM-dd");
  const endDateStr = format(endOfMonth(monthDate), "yyyy-MM-dd");

  const monthLabel = monthDate.toLocaleDateString(language === "id" ? "id-ID" : "en-US", {
    month: "long",
    year: "numeric",
  });

  const yearOptions = [now.getFullYear() - 1, now.getFullYear()];

  const fetchBudgetsAndTransactions = async () => {
    try {
      setLoading(true);
      
      // 1. Fetch budgets limits
      const budgets = await api.get<any[]>("/api/budgets");
      const limitsMap = new Map<string, number>();
      for (const b of budgets) {
        limitsMap.set(b.categoryId, Number(b.limit));
      }

      // 2. Fetch all transactions for this month range (limit 1000)
      const txRes = await api.get<any>(
        `/api/transactions?startDate=${startDateStr}&endDate=${endDateStr}&limit=1000`
      );
      const monthTransactions = txRes.transactions || [];

      // 3. Aggregate spent per category (only type=expense)
      const spentMap = new Map<string, number>();
      let totalSpent = 0;
      let uncategorizedSpent = 0;
      let monthlyIncome = 0;

      for (const tx of monthTransactions) {
        const amt = Number(tx.amount);
        if (tx.type === "expense") {
          totalSpent += amt;
          if (tx.categoryId) {
            spentMap.set(tx.categoryId, (spentMap.get(tx.categoryId) || 0) + amt);
          } else {
            uncategorizedSpent += amt;
          }
        } else if (tx.type === "income") {
          monthlyIncome += amt;
        }
      }

      // 4. Map expense categories only
      const expenseCategories = globalCategories.filter((c) => c.type === "expense");
      const mappedCategories: BudgetCategoryData[] = expenseCategories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        icon: cat.icon,
        color: "#388BFD", // Default theme color
        spent: spentMap.get(cat.id) || 0,
        limit: limitsMap.get(cat.id) ?? null,
      }));

      // Sort categories: active ones first, then by spent descending, then by name
      mappedCategories.sort((a, b) => {
        const aActive = a.spent > 0 || a.limit !== null;
        const bActive = b.spent > 0 || b.limit !== null;
        if (aActive !== bActive) return aActive ? -1 : 1;
        if (b.spent !== a.spent) return b.spent - a.spent;
        return a.name.localeCompare(b.name);
      });

      setBudgetData({
        monthLabel,
        year: currentYear,
        month: currentMonthNum,
        yearOptions,
        isCurrentMonth:
          currentYear === now.getFullYear() && currentMonthNum === now.getMonth() + 1,
        categories: mappedCategories,
        totalSpent,
        uncategorizedSpent,
        monthlyIncome,
      });
    } catch (err) {
      console.error("Failed to load budget page data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetsAndTransactions();
  }, [monthParam, globalCategories]);

  useEffect(() => {
    const handleRefresh = () => {
      fetchBudgetsAndTransactions();
    };
    window.addEventListener("refresh-app-data", handleRefresh);
    return () => {
      window.removeEventListener("refresh-app-data", handleRefresh);
    };
  }, [monthParam, globalCategories]);

  if (loading && !budgetData) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-accent" />
      </div>
    );
  }

  if (!budgetData) return null;

  return (
    <BudgetClient
      monthLabel={budgetData.monthLabel}
      year={budgetData.year}
      month={budgetData.month}
      yearOptions={budgetData.yearOptions}
      isCurrentMonth={budgetData.isCurrentMonth}
      categories={budgetData.categories}
      totalSpent={budgetData.totalSpent}
      uncategorizedSpent={budgetData.uncategorizedSpent}
      monthlyIncome={budgetData.monthlyIncome}
    />
  );
}
