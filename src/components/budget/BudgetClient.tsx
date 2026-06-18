import { useEffect, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Calendar } from "lucide-react";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

// ✅ Extracted & Modular components
import { MonthPicker } from "./MonthPicker";
import { BudgetWarningSystem } from "./BudgetWarningSystem";
import { BudgetDonut } from "./BudgetDonut";
import { BudgetSummaryTabs } from "./BudgetSummaryTabs";
import { CategoriesList } from "./CategoriesList";

export interface BudgetCategoryData {
  id: string;
  name: string;
  icon: string | null;
  color: string;
  spent: number;
  limit: number | null;
}

interface Props {
  monthLabel: string;
  year: number;
  /** 1..12 */
  month: number;
  yearOptions: number[];
  categories: BudgetCategoryData[];
  totalSpent: number;
  uncategorizedSpent: number;
  monthlyIncome: number;
}

const BLUE_PALETTE = [
  "#388BFD",
  "#1F6FEB",
  "#79B8FF",
  "#1158C7",
  "#5896FF",
  "#0D419D",
  "#A2C8FF",
  "#C8DDFF",
];

export function BudgetClient({
  monthLabel,
  year,
  month,
  yearOptions,
  categories,
  totalSpent,
  uncategorizedSpent,
  monthlyIncome,
}: Props) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pending, startTransition] = useTransition();

  const totalBudget = categories.reduce((sum, c) => sum + (c.limit ?? 0), 0);
  const remaining = totalBudget - totalSpent;
  const utilization = totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

  const categoriesWithColor = categories.map((cat, i) => ({
    ...cat,
    color: BLUE_PALETTE[i % BLUE_PALETTE.length],
  }));

  function navigateToMonth(targetYear: number, targetMonth: number) {
    const ym = `${targetYear}-${String(targetMonth).padStart(2, "0")}`;
    startTransition(() => navigate(`${pathname}?month=${ym}`));
  }

  function shiftMonth(delta: number) {
    let y = year;
    let m = month + delta;
    if (m === 0) {
      m = 12;
      y -= 1;
    } else if (m === 13) {
      m = 1;
      y += 1;
    }
    navigateToMonth(y, m);
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey || e.shiftKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        shiftMonth(-1);
      } else if (e.key === "ArrowRight") {
        const now = new Date();
        if (year === now.getFullYear() && month >= now.getMonth() + 1) return;
        e.preventDefault();
        shiftMonth(1);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month]);

  return (
    <div className="space-y-6">
      {/* Month picker section */}
      <Card className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-5 gap-4">
        <div className="flex items-center gap-2.5">
          <Calendar size={16} className="text-accent shrink-0" />
          <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
            {language === "id" ? "Periode Anggaran" : "Budget Period"}
          </span>
        </div>
        <MonthPicker
          monthLabel={monthLabel}
          year={year}
          month={month}
          yearOptions={yearOptions}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onPick={navigateToMonth}
          pending={pending}
        />
      </Card>

      {/* Budget Warning System */}
      <BudgetWarningSystem categoriesWithColor={categoriesWithColor} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Donut + Tabs */}
        <div className="lg:col-span-1 space-y-6">
          <BudgetDonut spent={totalSpent} budget={totalBudget} categories={categoriesWithColor} />
          <BudgetSummaryTabs
            spent={totalSpent}
            budget={totalBudget}
            remaining={remaining}
            utilization={utilization}
            income={monthlyIncome}
            categories={categoriesWithColor}
            uncategorizedSpent={uncategorizedSpent}
          />
        </div>

        {/* Right Column: Categories List */}
        <Card className="lg:col-span-2 p-6 space-y-4 gap-0">
          <div className="flex items-center justify-between pb-4 border-b border-white/[0.04]">
            <div>
              <h2 className="text-base font-bold text-foreground">
                {language === "id" ? "Batas Pengeluaran Kategori" : "Category Spending Limits"}
              </h2>
              <p className="text-xs text-muted-foreground/60 mt-1">
                {language === "id"
                  ? "Atur batas maksimal pengeluaran bulanan Anda per kategori"
                  : "Set maximum monthly spending limits per category"}
              </p>
            </div>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-accent/10 text-accent border border-accent/20">
              {categoriesWithColor.length} {language === "id" ? "KATEGORI" : "CATEGORIES"}
            </span>
          </div>

          <div className="overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
            <CategoriesList categories={categoriesWithColor} />
          </div>
        </Card>
      </div>
    </div>
  );
}
