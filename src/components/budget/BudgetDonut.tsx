import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { formatIDR } from "@/lib/utils/formatters";
import type { BudgetCategoryData } from "./BudgetClient";

interface BudgetDonutProps {
  spent: number;
  budget: number;
  categories: (BudgetCategoryData & { color: string })[];
}

export function BudgetDonut({ spent, budget, categories }: BudgetDonutProps) {
  const { language } = useLanguage();
  const hasBudget = budget > 0;
  const hasSpending = spent > 0;

  const segments: { id: string; value: number; color: string; label: string }[] = [];

  if (hasBudget && hasSpending) {
    const cap = Math.min(spent, budget);
    let remainingCap = cap;
    for (const cat of categories) {
      if (cat.spent <= 0) continue;
      const slice = Math.min(cat.spent, remainingCap);
      if (slice <= 0) break;
      segments.push({
        id: cat.id,
        value: slice,
        color: cat.color,
        label: cat.name,
      });
      remainingCap -= slice;
    }
    if (spent < budget) {
      segments.push({
        id: "unused",
        value: budget - spent,
        color: "#1C2128",
        label: language === "id" ? "Sisa" : "Remaining",
      });
    } else if (spent > budget) {
      segments.push({
        id: "overage",
        value: spent - budget,
        color: "#F85149",
        label: language === "id" ? "Lebih" : "Over",
      });
    }
  } else {
    segments.push({
      id: "unused",
      value: 1,
      color: "#161B22",
      label: language === "id" ? "Belum diatur" : "Unset",
    });
  }

  return (
    <Card className="p-6 space-y-4 transition-colors duration-200 gap-0">
      <div className="flex justify-between items-center">
        <h3 className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-[0.12em]">
          {language === "id" ? "Ringkasan Alokasi" : "Allocation Summary"}
        </h3>
        {hasBudget && (
          <span className="text-[10px] text-text-muted font-mono font-medium">
            {Math.round((spent / budget) * 100)}% {language === "id" ? "terpakai" : "used"}
          </span>
        )}
      </div>
      <div className="flex items-center justify-center h-[200px] relative">
        <div className="w-[170px] h-[170px] relative">
          <DonutSVG segments={segments} thickness={8} />

          {/* Center content overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
            <p className="text-[10px] text-text-muted uppercase tracking-wider font-semibold mb-0.5">
              {language === "id" ? "Terpakai" : "Spent"}
            </p>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(spent)}
            </p>
            {hasBudget ? (
              <p className="text-[10px] text-text-muted font-mono mt-0.5">
                {language === "id" ? "dari" : "of"} {formatIDR(budget)}
              </p>
            ) : (
              <div className="flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-full bg-warning/5 border border-warning/20">
                <Sparkles size={9} className="text-warning" />
                <span className="text-[9px] text-warning font-medium">
                  {language === "id" ? "Atur batas kategori" : "Set category limit"}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}

interface DonutSegment {
  id: string;
  value: number;
  color: string;
  label: string;
}

function DonutSVG({
  segments,
  thickness = 8,
}: {
  segments: DonutSegment[];
  thickness?: number;
}) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  if (total <= 0) return null;

  const radius = 50 - thickness / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;

  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="xMidYMid meet"
      className="w-full h-full -rotate-90"
      aria-hidden
    >
      <g transform="translate(50, 50)">
        <circle r={radius} fill="none" stroke="#1C2128" strokeWidth={thickness} />

        {segments.map((seg) => {
          const ratio = seg.value / total;
          const length = circumference * ratio;
          const dasharray = `${length} ${circumference - length}`;
          const dashoffset = -offset;
          offset += length;

          return (
            <circle
              key={seg.id}
              r={radius}
              fill="none"
              stroke={seg.color}
              strokeWidth={thickness}
              strokeDasharray={dasharray}
              strokeDashoffset={dashoffset}
              strokeLinecap="round"
            >
              <title>
                {seg.label}: {formatIDR(seg.value)}
              </title>
            </circle>
          );
        })}
      </g>
    </svg>
  );
}
