import { useState } from "react";
import { LayoutGrid, BarChart3, Grid3x3, Layers, Check } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  getCurrentPreferences,
  savePreferences,
  type DashboardLayout,
} from "@/lib/preferences";

interface LayoutOption {
  id: DashboardLayout;
  icon: React.ReactNode;
  label: { id: string; en: string };
  desc: { id: string; en: string };
  features: { id: string[]; en: string[] };
}

const LAYOUTS: LayoutOption[] = [
  {
    id: "default",
    icon: <LayoutGrid size={16} />,
    label: { id: "Default", en: "Default" },
    desc: {
      id: "Tata letak seimbang — hero chart di kiri, ringkasan aset di kanan, diikuti statistik dan grafik analisis.",
      en: "Balanced layout — hero chart on the left, asset summary on the right, followed by stats and analysis charts.",
    },
    features: {
      id: ["Hero chart 2/3 + Ringkasan aset 1/3", "4 kartu statistik dalam satu baris", "Grafik & transaksi dalam tab terpisah"],
      en: ["Hero chart 2/3 + Asset summary 1/3", "4 stat cards in one row", "Charts & transactions in separate tabs"],
    },
  },
  {
    id: "analytics",
    icon: <BarChart3 size={16} />,
    label: { id: "Analytics", en: "Analytics" },
    desc: {
      id: "Fokus pada analisis arus kas — Sankey chart full-width di paling atas, diikuti hero dan statistik ringkas.",
      en: "Cash flow analysis focus — full-width Sankey chart at the top, followed by hero and compact stats.",
    },
    features: {
      id: ["Sankey chart full-width di atas", "3 statistik kunci (tanpa hitungan transaksi)", "Transaksi & neraca berdampingan"],
      en: ["Full-width Sankey chart on top", "3 key stats (without transaction count)", "Transactions & balance sheet side-by-side"],
    },
  },
  {
    id: "compact",
    icon: <Grid3x3 size={16} />,
    label: { id: "Compact", en: "Compact" },
    desc: {
      id: "Grid padat — hero dan ringkasan berdampingan 50/50, semua info terlihat dalam satu layar tanpa banyak scroll.",
      en: "Dense grid — hero and summary side-by-side 50/50, all info visible in one screen without much scrolling.",
    },
    features: {
      id: ["Hero + ringkasan 50/50", "4 kartu statistik compact", "Grafik tab di atas, transaksi di bawah"],
      en: ["Hero + summary 50/50", "4 compact stat cards", "Tabbed charts above, transactions below"],
    },
  },
  {
    id: "hero",
    icon: <Layers size={16} />,
    label: { id: "Hero Focus", en: "Hero Focus" },
    desc: {
      id: "Grafik total kekayaan mendominasi — chart lebih besar untuk melihat tren dengan lebih jelas.",
      en: "Net worth chart dominates — taller chart area for clearer trend visualization.",
    },
    features: {
      id: ["Chart full-width lebih tinggi", "Ringkasan aset + statistik 2×2", "Grafik analisis & transaksi di bawah"],
      en: ["Taller full-width chart", "Asset summary + 2×2 stat grid", "Analysis charts & transactions below"],
    },
  },
];

/** Mini visual preview of each layout using colored blocks */
function LayoutPreview({ layout, isId }: { layout: LayoutOption; isId: boolean }) {
  // Colors matching the actual dashboard components
  const hero = "bg-accent/25 border border-accent/20 rounded";
  const summary = "bg-muted/40 border border-border/30 rounded";
  const stat = "bg-income/15 border border-income/15 rounded";
  const chart = "bg-warning/15 border border-warning/15 rounded";
  const tx = "bg-expense/10 border border-expense/10 rounded";
  const balance = "bg-purple-500/10 border border-purple-500/15 rounded";

  void isId; // reserved for future label translations in preview

  if (layout.id === "default") {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex gap-1.5">
          <div className={cn(hero, "flex-[2] h-8")} />
          <div className={cn(summary, "flex-1 h-8")} />
        </div>
        <div className="flex gap-1.5">
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
        </div>
        <div className={cn(chart, "h-6 w-full")} />
        <div className={cn(tx, "h-5 w-full")} />
      </div>
    );
  }

  if (layout.id === "analytics") {
    return (
      <div className="space-y-1.5 w-full">
        <div className={cn(chart, "h-7 w-full")} />
        <div className="flex gap-1.5">
          <div className={cn(hero, "flex-[2] h-6")} />
          <div className={cn(summary, "flex-1 h-6")} />
        </div>
        <div className="flex gap-1.5">
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
        </div>
        <div className="flex gap-1.5">
          <div className={cn(tx, "flex-1 h-5")} />
          <div className={cn(balance, "flex-1 h-5")} />
        </div>
      </div>
    );
  }

  if (layout.id === "compact") {
    return (
      <div className="space-y-1.5 w-full">
        <div className="flex gap-1.5">
          <div className={cn(hero, "flex-1 h-7")} />
          <div className={cn(summary, "flex-1 h-7")} />
        </div>
        <div className="flex gap-1.5">
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
          <div className={cn(stat, "flex-1 h-3")} />
        </div>
        <div className={cn(chart, "h-5 w-full")} />
        <div className={cn(tx, "h-4 w-full")} />
      </div>
    );
  }

  // hero
  return (
    <div className="space-y-1.5 w-full">
      <div className={cn(hero, "h-10 w-full")} />
      <div className="flex gap-1.5">
        <div className={cn(summary, "flex-1 h-5")} />
        <div className="flex-1 grid grid-cols-2 gap-1">
          <div className={cn(stat, "h-5")} />
          <div className={cn(stat, "h-5")} />
          <div className={cn(stat, "h-5")} />
          <div className={cn(stat, "h-5")} />
        </div>
      </div>
      <div className={cn(chart, "h-5 w-full")} />
      <div className={cn(tx, "h-4 w-full")} />
    </div>
  );
}

export function DashboardGridSettings() {
  const { language } = useLanguage();
  const isId = language === "id";
  const [selected, setSelected] = useState<DashboardLayout>(
    getCurrentPreferences().dashboardLayout || "default"
  );

  const handleSelect = (layout: DashboardLayout) => {
    setSelected(layout);
    const prefs = getCurrentPreferences();
    savePreferences({ ...prefs, dashboardLayout: layout });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <LayoutGrid size={14} className="text-muted-foreground" />
          {isId ? "Tata Letak Dashboard" : "Dashboard Layout"}
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          {isId
            ? "Pilih tata letak yang paling sesuai dengan cara Anda melihat data keuangan. Perubahan langsung diterapkan."
            : "Choose the layout that best fits how you view your financial data. Changes are applied immediately."}
        </p>
      </div>

      {/* Layout cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {LAYOUTS.map((layout) => {
          const isSelected = selected === layout.id;
          return (
            <button
              key={layout.id}
              type="button"
              onClick={() => handleSelect(layout.id)}
              className={cn(
                "group relative text-left rounded-xl border p-4 transition-all duration-200",
                "hover:border-accent/40 hover:shadow-sm",
                isSelected
                  ? "border-accent/60 bg-accent/[0.03] shadow-sm shadow-accent/10 ring-1 ring-accent/20"
                  : "border-border/50 bg-surface/30 hover:bg-surface/50"
              )}
            >
              {/* Selected badge */}
              {isSelected && (
                <div className="absolute top-3 right-3 size-5 rounded-full bg-accent flex items-center justify-center">
                  <Check size={12} className="text-white" strokeWidth={3} />
                </div>
              )}

              {/* Icon + Name row */}
              <div className="flex items-center gap-2.5 mb-2.5">
                <div
                  className={cn(
                    "shrink-0 p-1.5 rounded-lg transition-colors",
                    isSelected
                      ? "bg-accent/15 text-accent"
                      : "bg-elevated text-muted-foreground group-hover:text-foreground"
                  )}
                >
                  {layout.icon}
                </div>
                <div>
                  <p
                    className={cn(
                      "text-sm font-bold leading-tight",
                      isSelected ? "text-accent" : "text-foreground"
                    )}
                  >
                    {isId ? layout.label.id : layout.label.en}
                  </p>
                </div>
              </div>

              {/* Visual preview */}
              <div className="mb-3 p-3 rounded-lg bg-elevated/30 border border-border/20">
                <LayoutPreview layout={layout} isId={isId} />
              </div>

              {/* Description */}
              <p className="text-[11px] text-muted-foreground/80 leading-relaxed mb-3">
                {isId ? layout.desc.id : layout.desc.en}
              </p>

              {/* Feature list */}
              <ul className="space-y-1">
                {(isId ? layout.features.id : layout.features.en).map((feat, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60">
                    <span className="mt-1 size-1 rounded-full bg-border shrink-0" />
                    {feat}
                  </li>
                ))}
              </ul>
            </button>
          );
        })}
      </div>
    </div>
  );
}
