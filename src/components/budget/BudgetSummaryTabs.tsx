import { Info, Percent, PiggyBank, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { BudgetCategoryData } from "./BudgetClient";

interface BudgetSummaryTabsProps {
  spent: number;
  budget: number;
  remaining: number;
  utilization: number;
  income: number;
  categories: (BudgetCategoryData & { color: string })[];
  uncategorizedSpent: number;
}

export function BudgetSummaryTabs({
  spent,
  budget,
  remaining,
  utilization,
  income,
  categories,
  uncategorizedSpent,
}: BudgetSummaryTabsProps) {
  const { language } = useLanguage();
  const expectedIncome = budget;
  const incomeUtilization =
    expectedIncome > 0 ? Math.min((income / expectedIncome) * 100, 100) : 0;

  const totalSpentAll = spent + uncategorizedSpent;
  const expenseBreakdown = categories
    .filter((c) => c.spent > 0)
    .map((c) => ({
      name: c.name,
      color: c.color,
      amount: c.spent,
      percent: totalSpentAll > 0 ? Math.round((c.spent / totalSpentAll) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 4);

  if (uncategorizedSpent > 0) {
    expenseBreakdown.push({
      name: language === "id" ? "Tanpa kategori" : "Uncategorized",
      color: "#8B949E",
      amount: uncategorizedSpent,
      percent: Math.round((uncategorizedSpent / totalSpentAll) * 100),
    });
  }

  return (
    <Tabs defaultValue="budgeted" className="w-full">
      <TabsList className="grid w-full grid-cols-2 bg-white/[0.02] p-1 border border-white/[0.06] rounded-xl">
        <TabsTrigger
          value="budgeted"
          className="text-xs py-1.5 rounded-lg data-[state=active]:bg-white/[0.06] data-[state=active]:text-foreground"
        >
          {language === "id" ? "Anggaran" : "Budget"}
        </TabsTrigger>
        <TabsTrigger
          value="actuals"
          className="text-xs py-1.5 rounded-lg data-[state=active]:bg-white/[0.06] data-[state=active]:text-foreground"
        >
          {language === "id" ? "Realisasi" : "Actuals"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="budgeted" className="mt-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Expected income */}
          <div className="p-4 border-b border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <TrendingUp size={14} className="text-income" />{" "}
                {language === "id" ? "Target Pemasukan" : "Target Income"}
              </span>
              <span className="text-[10px] text-text-muted font-mono tabular-nums">
                {Math.round(incomeUtilization)}%
              </span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(expectedIncome)}
            </p>
            <ProgressBar
              percent={incomeUtilization}
              fillClass="bg-income"
              trackClass="bg-elevated"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>
                {formatIDR(income)} {language === "id" ? "diterima" : "received"}
              </span>
              <span className="text-text-primary font-medium">
                {formatIDR(Math.max(0, expectedIncome - income))}{" "}
                {language === "id" ? "sisa" : "remaining"}
              </span>
            </div>
          </div>

          {/* Budgeted */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <PiggyBank size={14} className="text-accent" />{" "}
                {language === "id" ? "Dianggarkan" : "Budgeted"}
              </span>
              <span className="text-[10px] text-text-muted font-mono tabular-nums">
                {Math.round(utilization)}%
              </span>
            </div>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(budget)}
            </p>
            <ProgressBar
              percent={utilization}
              fillClass={
                utilization > 90 ? "bg-expense" : utilization > 70 ? "bg-warning" : "bg-accent"
              }
              trackClass="bg-elevated"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>
                {formatIDR(spent)} {language === "id" ? "terpakai" : "spent"}
              </span>
              <span
                className={cn("font-medium", remaining < 0 ? "text-expense" : "text-text-primary")}
              >
                {remaining < 0
                  ? `${formatIDR(Math.abs(remaining))} ${language === "id" ? "lebih" : "over"}`
                  : `${formatIDR(remaining)} ${language === "id" ? "sisa" : "remaining"}`}
              </span>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="actuals" className="mt-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Income */}
          <div className="p-4 border-b border-border space-y-2">
            <h3 className="text-xs text-text-muted flex items-center gap-1.5">
              <TrendingUp size={14} className="text-income" />{" "}
              {language === "id" ? "Pemasukan Riil" : "Actual Income"}
            </h3>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(income)}
            </p>
            {income > 0 ? (
              <ProgressBar percent={100} fillClass="bg-income" trackClass="bg-elevated" />
            ) : (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Info size={12} />
                <span>
                  {language === "id" ? "Belum ada pemasukan bulan ini." : "No income this month."}
                </span>
              </div>
            )}
          </div>

          {/* Expenses breakdown */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs text-text-muted flex items-center gap-1.5">
              <Percent size={14} className="text-accent" />{" "}
              {language === "id" ? "Distribusi Pengeluaran" : "Expense Distribution"}
            </h3>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(totalSpentAll)}
            </p>
            {totalSpentAll > 0 ? (
              <div className="space-y-3">
                <div className="flex h-2.5 gap-0.5 rounded-full overflow-hidden bg-elevated">
                  {expenseBreakdown.map((b) => (
                    <div
                      key={b.name}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{
                        backgroundColor: b.color,
                        width: `${b.percent}%`,
                      }}
                    />
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {expenseBreakdown.map((b) => (
                    <div
                      key={b.name}
                      className="flex items-center gap-1.5 text-xs bg-white/[0.02] border border-white/[0.04] rounded-lg p-1.5"
                    >
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: b.color }}
                      />
                      <div className="min-w-0 flex-1">
                        <p className="text-text-muted truncate text-[10px] uppercase font-semibold">
                          {b.name}
                        </p>
                        <p className="text-text-primary font-mono tabular-nums font-semibold mt-0.5">
                          {b.percent}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Info size={12} />
                <span>
                  {language === "id"
                    ? "Belum ada pengeluaran bulan ini."
                    : "No expenses this month."}
                </span>
              </div>
            )}
          </div>
        </div>
      </TabsContent>
    </Tabs>
  );
}

function ProgressBar({
  percent,
  fillClass,
  trackClass,
}: {
  percent: number;
  fillClass: string;
  trackClass: string;
}) {
  return (
    <div className={cn("flex h-2 gap-1 rounded-full overflow-hidden", trackClass)}>
      <div
        className={cn("rounded-full transition-all duration-300", fillClass)}
        style={{ width: `${Math.min(percent, 100)}%` }}
      />
    </div>
  );
}
