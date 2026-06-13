import { AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import type { BudgetCategoryData } from "./BudgetClient";

interface BudgetWarningSystemProps {
  categoriesWithColor: (BudgetCategoryData & { color: string })[];
}

export function BudgetWarningSystem({ categoriesWithColor }: BudgetWarningSystemProps) {
  const { language } = useLanguage();

  const budgetAlerts = categoriesWithColor
    .filter((c) => c.limit !== null && c.limit > 0)
    .map((c) => {
      const percent = Math.round((c.spent / (c.limit ?? 1)) * 100);
      const remaining = (c.limit ?? 0) - c.spent;
      const isOver = c.spent > (c.limit ?? 0);
      return {
        ...c,
        percent,
        remaining,
        isOver,
      };
    })
    .filter((c) => c.percent >= 80)
    .sort((a, b) => b.percent - a.percent);

  if (budgetAlerts.length === 0) return null;

  return (
    <Card
      className="p-5 space-y-3.5 relative overflow-hidden gap-0"
      style={{
        borderColor: "color-mix(in srgb, var(--expense) 20%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--expense) 5%, transparent)",
      }}
    >
      {/* Top glowing indicator strip */}
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-expense via-warning to-expense/50" />

      <div className="flex items-center gap-2">
        <AlertCircle size={16} className="text-expense shrink-0 animate-pulse" />
        <h3 className="text-sm font-bold text-foreground">
          {language === "id" ? "Sistem Peringatan Anggaran" : "Budget Warning System"}
        </h3>
        <span className="text-[9px] bg-expense/10 text-expense font-bold px-1.5 py-0.5 rounded-full border border-expense/20 animate-pulse ml-auto">
          {budgetAlerts.length} {language === "id" ? "PERINGATAN" : "ALERTS"}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {budgetAlerts.map((alert) => (
          <div
            key={alert.id}
            className="flex items-center justify-between p-3.5 rounded-xl border border-white/[0.04] bg-white/[0.01] hover:bg-white/[0.02] transition-colors gap-0"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]"
                style={{
                  backgroundColor: `color-mix(in oklab, ${alert.color} 10%, transparent)`,
                  color: alert.color,
                }}
              >
                <span className="text-xs">{alert.icon || "•"}</span>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-text-primary truncate">{alert.name}</p>
                <p className="text-[10px] text-text-muted mt-0.5 font-mono">
                  {alert.isOver ? (
                    <span className="text-expense font-bold">
                      {language === "id"
                        ? `Melebihi batas sebesar ${formatIDR(Math.abs(alert.remaining))}`
                        : `Over budget by ${formatIDR(Math.abs(alert.remaining))}`}
                    </span>
                  ) : (
                    <span className="text-warning font-semibold">
                      {language === "id"
                        ? `Mendekati batas (Sisa ${formatIDR(alert.remaining)})`
                        : `Approaching limit (${formatIDR(alert.remaining)} left)`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="text-right pl-3 shrink-0">
              <span
                className={cn(
                  "text-xs font-mono font-bold px-2 py-0.5 rounded-full border",
                  alert.isOver
                    ? "bg-expense/10 text-expense border-expense/20"
                    : "bg-warning/10 text-warning border-warning/20"
                )}
              >
                {alert.percent}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
