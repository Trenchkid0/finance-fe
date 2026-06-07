"use client";

import { useEffect, useState, useTransition } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Pencil,
  X,
  Calendar,
  PiggyBank,
  TrendingUp,
  Percent,
  Sparkles,
  Info,
  ChevronDown
} from "lucide-react";
import { toast } from "sonner";
import { setBudgetLimit } from "@/app/actions/budgets";
import { cn } from "@/lib/utils/cn";
import { cleanMoneyString, formatIDR, formatInputRupiah } from "@/lib/utils/formatters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/lib/contexts/LanguageContext";

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
  isCurrentMonth: boolean;
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
  isCurrentMonth,
  categories,
  totalSpent,
  uncategorizedSpent,
  monthlyIncome,
}: Props) {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [pending, startTransition] = useTransition();

  const totalBudget = categories.reduce(
    (sum, c) => sum + (c.limit ?? 0),
    0,
  );
  const remaining = totalBudget - totalSpent;
  const utilization =
    totalBudget > 0 ? Math.min((totalSpent / totalBudget) * 100, 100) : 0;

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
  }, [year, month]);

  return (
    <div className="space-y-6">
      {/* Month picker section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-2xl border border-white/[0.06] bg-white/[0.02]">
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
          isCurrentMonth={isCurrentMonth}
          onPrev={() => shiftMonth(-1)}
          onNext={() => shiftMonth(1)}
          onPick={navigateToMonth}
          onJumpToday={() => {
            const now = new Date();
            navigateToMonth(now.getFullYear(), now.getMonth() + 1);
          }}
          pending={pending}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column: Donut + Tabs */}
        <div className="lg:col-span-1 space-y-6">
          <BudgetDonut
            spent={totalSpent}
            budget={totalBudget}
            categories={categoriesWithColor}
          />
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
        <div className="lg:col-span-2 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
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
            <Badge className="bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold font-mono">
              {categoriesWithColor.length} {language === "id" ? "KATEGORI" : "CATEGORIES"}
            </Badge>
          </div>

          <div className="overflow-y-auto max-h-[600px] pr-1 scrollbar-thin">
            <CategoriesList categories={categoriesWithColor} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Month picker -------------------------------------------------------

function MonthPicker({
  monthLabel,
  year,
  month,
  yearOptions,
  isCurrentMonth,
  onPrev,
  onNext,
  onPick,
  onJumpToday,
  pending,
}: {
  monthLabel: string;
  year: number;
  month: number;
  yearOptions: number[];
  isCurrentMonth: boolean;
  onPrev: () => void;
  onNext: () => void;
  onPick: (y: number, m: number) => void;
  onJumpToday: () => void;
  pending: boolean;
}) {
  const { language } = useLanguage();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickedYear, setPickedYear] = useState(year);

  const now = new Date();
  const currentY = now.getFullYear();
  const currentM = now.getMonth() + 1;

  const canGoNext = !(year === currentY && month >= currentM);

  return (
    <div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl p-1.5 shrink-0 self-start sm:self-center">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/[0.04] transition-colors rounded-lg text-muted-foreground/60 hover:text-foreground"
        onClick={onPrev}
        aria-label={language === "id" ? "Bulan sebelumnya" : "Previous month"}
        disabled={pending}
      >
        <ChevronLeft size={16} />
      </Button>

      <div className="relative">
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg hover:bg-white/[0.04] transition-colors text-xs font-bold text-foreground"
          aria-haspopup="dialog"
          aria-expanded={pickerOpen}
        >
          <span>{monthLabel}</span>
          <ChevronDown
            size={12}
            className={cn(
              "text-muted-foreground/60 transition-transform duration-200",
              pickerOpen && "rotate-180",
            )}
          />
        </button>

        {pickerOpen ? (
          <YearMonthPanel
            pickedYear={pickedYear}
            onPickedYearChange={setPickedYear}
            yearOptions={yearOptions}
            currentYear={currentY}
            currentMonth={currentM}
            selectedYear={year}
            selectedMonth={month}
            onPick={(y, m) => {
              setPickerOpen(false);
              onPick(y, m);
            }}
          />
        ) : null}
      </div>

      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 hover:bg-white/[0.04] transition-colors rounded-lg text-muted-foreground/60 hover:text-foreground"
        onClick={onNext}
        aria-label={language === "id" ? "Bulan berikutnya" : "Next month"}
        disabled={pending || !canGoNext}
      >
        <ChevronRight size={16} />
      </Button>

      {!isCurrentMonth ? (
        <Button
          variant="secondary"
          size="sm"
          className="h-8 text-xs font-medium px-2.5 ml-1.5"
          onClick={onJumpToday}
          disabled={pending}
        >
          {language === "id" ? "Hari ini" : "Today"}
        </Button>
      ) : null}
    </div>
  );
}



function YearMonthPanel({
  pickedYear,
  onPickedYearChange,
  yearOptions,
  currentYear,
  currentMonth,
  selectedYear,
  selectedMonth,
  onPick,
}: {
  pickedYear: number;
  onPickedYearChange: (y: number) => void;
  yearOptions: number[];
  currentYear: number;
  currentMonth: number;
  selectedYear: number;
  selectedMonth: number;
  onPick: (y: number, m: number) => void;
}) {
  const { language } = useLanguage();
  const minYear = Math.min(...yearOptions);
  const maxYear = Math.max(currentYear, ...yearOptions);

  const monthLabels = language === "id"
    ? ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"]
    : ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  return (
    <div className="absolute z-50 right-0 mt-2 w-[260px] rounded-2xl border border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40 p-4 space-y-3 animate-in fade-in-50 slide-in-from-top-2 duration-150">
      <div className="flex items-center justify-between">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPickedYearChange(pickedYear - 1)}
          disabled={pickedYear <= minYear}
          aria-label={language === "id" ? "Tahun sebelumnya" : "Previous year"}
        >
          <ChevronLeft size={14} />
        </Button>
        <span className="text-sm font-semibold text-text-primary font-mono">
          {pickedYear}
        </span>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPickedYearChange(pickedYear + 1)}
          disabled={pickedYear >= maxYear}
          aria-label={language === "id" ? "Tahun berikutnya" : "Next year"}
        >
          <ChevronRight size={14} />
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-1.5">
        {monthLabels.map((label, idx) => {
          const m = idx + 1;
          const isFuture =
            pickedYear > currentYear ||
            (pickedYear === currentYear && m > currentMonth);
          const isSelected = pickedYear === selectedYear && m === selectedMonth;

          return (
            <button
              key={label}
              type="button"
              onClick={() => !isFuture && onPick(pickedYear, m)}
              disabled={isFuture}
              className={cn(
                "px-2 py-2 rounded-md text-xs font-semibold transition-all duration-150",
                isSelected
                  ? "bg-accent text-white"
                  : isFuture
                    ? "text-text-muted/30 cursor-not-allowed"
                    : "text-text-muted hover:text-text-primary hover:bg-surface border border-transparent hover:border-border",
              )}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// --- Donut chart --------------------------------------------------------

function BudgetDonut({
  spent,
  budget,
  categories,
}: {
  spent: number;
  budget: number;
  categories: (BudgetCategoryData & { color: string })[];
}) {
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
    <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4 transition-colors duration-200">
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
    </div>
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
        <circle
          r={radius}
          fill="none"
          stroke="#1C2128"
          strokeWidth={thickness}
        />
        
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

// --- Summary tabs (Budgeted / Actual) -----------------------------------

function BudgetSummaryTabs({
  spent,
  budget,
  remaining,
  utilization,
  income,
  categories,
  uncategorizedSpent,
}: {
  spent: number;
  budget: number;
  remaining: number;
  utilization: number;
  income: number;
  categories: (BudgetCategoryData & { color: string })[];
  uncategorizedSpent: number;
}) {
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
      percent:
        totalSpentAll > 0 ? Math.round((c.spent / totalSpentAll) * 100) : 0,
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
        <TabsTrigger value="budgeted" className="text-xs py-1.5 rounded-lg data-[state=active]:bg-white/[0.06] data-[state=active]:text-foreground">
          {language === "id" ? "Anggaran" : "Budget"}
        </TabsTrigger>
        <TabsTrigger value="actuals" className="text-xs py-1.5 rounded-lg data-[state=active]:bg-white/[0.06] data-[state=active]:text-foreground">
          {language === "id" ? "Realisasi" : "Actuals"}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="budgeted" className="mt-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
          {/* Expected income */}
          <div className="p-4 border-b border-border space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <TrendingUp size={14} className="text-income" /> {language === "id" ? "Target Pemasukan" : "Target Income"}
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
              <span>{formatIDR(income)} {language === "id" ? "diterima" : "received"}</span>
              <span className="text-text-primary font-medium">
                {formatIDR(Math.max(0, expectedIncome - income))} {language === "id" ? "sisa" : "remaining"}
              </span>
            </div>
          </div>

          {/* Budgeted */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-xs text-text-muted flex items-center gap-1.5">
                <PiggyBank size={14} className="text-accent" /> {language === "id" ? "Dianggarkan" : "Budgeted"}
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
              fillClass={utilization > 90 ? "bg-expense" : utilization > 70 ? "bg-warning" : "bg-accent"}
              trackClass="bg-elevated"
            />
            <div className="flex justify-between text-xs text-text-muted">
              <span>{formatIDR(spent)} {language === "id" ? "terpakai" : "spent"}</span>
              <span
                className={cn(
                  "font-medium",
                  remaining < 0 ? "text-expense" : "text-text-primary",
                )}
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
              <TrendingUp size={14} className="text-income" /> {language === "id" ? "Pemasukan Riil" : "Actual Income"}
            </h3>
            <p className="text-xl font-bold font-mono tabular-nums text-text-primary">
              {formatIDR(income)}
            </p>
            {income > 0 ? (
              <ProgressBar percent={100} fillClass="bg-income" trackClass="bg-elevated" />
            ) : (
              <div className="flex items-center gap-1 text-xs text-text-muted">
                <Info size={12} />
                <span>{language === "id" ? "Belum ada pemasukan bulan ini." : "No income this month."}</span>
              </div>
            )}
          </div>

          {/* Expenses breakdown */}
          <div className="p-4 space-y-3">
            <h3 className="text-xs text-text-muted flex items-center gap-1.5">
              <Percent size={14} className="text-accent" /> {language === "id" ? "Distribusi Pengeluaran" : "Expense Distribution"}
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
                        <p className="text-text-muted truncate text-[10px] uppercase font-semibold">{b.name}</p>
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
                <span>{language === "id" ? "Belum ada pengeluaran bulan ini." : "No expenses this month."}</span>
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

// --- Categories list ----------------------------------------------------

function CategoriesList({
  categories,
}: {
  categories: (BudgetCategoryData & { color: string })[];
}) {
  const { language } = useLanguage();
  if (categories.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-elevated p-8 text-center">
        <p className="text-sm font-semibold text-text-primary mb-1">
          {language === "id" ? "Belum ada kategori pengeluaran" : "No expense categories yet"}
        </p>
        <p className="text-xs text-text-muted">
          {language === "id"
            ? "Tambahkan kategori dari halaman pengaturan untuk mulai mengatur anggaran."
            : "Add categories from settings page to start budgeting."}
        </p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-border/60">
      {categories.map((cat) => (
        <BudgetCategoryRow
          key={cat.id}
          category={cat}
        />
      ))}
    </div>
  );
}

function BudgetCategoryRow({
  category,
}: {
  category: BudgetCategoryData & { color: string };
}) {
  const { language } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [draftLimit, setDraftLimit] = useState<string>(
    category.limit !== null ? formatInputRupiah(String(category.limit)) : "",
  );
  const [pending, startTransition] = useTransition();

  const hasLimit = category.limit !== null && category.limit > 0;
  const remaining = hasLimit ? (category.limit ?? 0) - category.spent : 0;
  const isOver = hasLimit && category.spent > (category.limit ?? 0);
  const overage = isOver ? category.spent - (category.limit ?? 0) : 0;

  const percentUsed = hasLimit ? Math.round((category.spent / (category.limit ?? 1)) * 100) : 0;

  function handleSave() {
    const num = Number(cleanMoneyString(draftLimit));
    if (!Number.isFinite(num) || num < 0) {
      toast.error(
        language === "id"
          ? "Masukkan angka yang valid (≥ 0)."
          : "Please enter a valid number (≥ 0)."
      );
      return;
    }
    startTransition(async () => {
      const result = await setBudgetLimit(category.id, num);
      if (result.ok) {
        toast.success(
          num > 0
            ? (language === "id" ? "Batas anggaran tersimpan." : "Budget limit saved.")
            : (language === "id" ? "Batas anggaran dihapus." : "Budget limit removed."),
        );
        setEditing(false);
      } else {
        toast.error(
          result.error ??
            (language === "id" ? "Gagal menyimpan batas anggaran." : "Failed to save budget limit.")
        );
      }
    });
  }

  return (
    <div className="py-3 px-2 flex items-center justify-between border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors rounded-xl group">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        {/* Circle color-matched icon */}
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border border-white/[0.06]"
          style={{
            backgroundColor: `color-mix(in oklab, ${category.color} 10%, transparent)`,
            color: category.color,
          }}
        >
          <span className="text-xs">{category.icon || "•"}</span>
        </div>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-text-primary truncate">
              {category.name}
            </span>
            {hasLimit && (
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded-full font-mono font-medium",
                isOver ? "bg-expense/10 text-expense" : percentUsed > 85 ? "bg-warning/10 text-warning" : "bg-accent/10 text-accent"
              )}>
                {percentUsed}%
              </span>
            )}
          </div>
          
          {hasLimit ? (
            <div className="flex items-center gap-3">
              <div className="w-24 bg-elevated h-1 rounded-full overflow-hidden shrink-0">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", isOver ? "bg-expense" : percentUsed > 85 ? "bg-warning" : "bg-accent")}
                  style={{ width: `${Math.min(percentUsed, 100)}%` }}
                />
              </div>
              <span className={cn(
                "text-xs font-mono",
                isOver ? "text-expense" : remaining < 0 ? "text-expense" : "text-text-muted"
              )}>
                {isOver
                  ? (language === "id" ? `Lebih ${formatIDR(overage)}` : `Over by ${formatIDR(overage)}`)
                  : (language === "id" ? `${formatIDR(remaining)} sisa` : `${formatIDR(remaining)} remaining`)}
              </span>
            </div>
          ) : (
            <span className="text-xs text-text-muted/60">
              {language === "id" ? "Belum ada batas anggaran" : "No budget limit"}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 shrink-0 pl-3">
        {editing ? (
          <div className="flex items-center gap-1.5 bg-elevated border border-border rounded-lg p-1">
            <Input
              type="text"
              inputMode="numeric"
              value={draftLimit}
              onChange={(e) => setDraftLimit(formatInputRupiah(e.target.value))}
              placeholder="Limit"
              className="h-7 w-20 text-xs font-mono border-0 focus-visible:ring-0 bg-transparent p-1 text-text-primary"
              aria-label={language === "id" ? `Batas anggaran ${category.name}` : `Budget limit ${category.name}`}
              autoFocus
              disabled={pending}
            />
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-income hover:bg-income/10 hover:text-income"
              onClick={handleSave}
              disabled={pending}
              aria-label={language === "id" ? "Simpan" : "Save"}
            >
              <Check size={12} />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 text-expense hover:bg-expense/10 hover:text-expense"
              onClick={() => {
                setEditing(false);
                setDraftLimit(
                  category.limit !== null ? formatInputRupiah(String(category.limit)) : "",
                );
              }}
              disabled={pending}
              aria-label={language === "id" ? "Batal" : "Cancel"}
            >
              <X size={12} />
            </Button>
          </div>
        ) : (
          <>
            <div className="text-right">
              <p className="text-sm font-bold font-mono tabular-nums text-text-primary">
                {formatIDR(category.spent)}
              </p>
              <p className="text-[10px] text-text-muted font-mono">
                {language === "id" ? "dari" : "of"} {hasLimit ? formatIDR(category.limit ?? 0) : "—"}
              </p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              className="h-7 w-7 text-text-muted opacity-0 group-hover:opacity-100 focus:opacity-100 hover:text-text-primary hover:bg-elevated transition-all"
              onClick={() => setEditing(true)}
              aria-label={language === "id" ? `Atur batas ${category.name}` : `Set limit for ${category.name}`}
            >
              <Pencil size={12} />
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// Simple custom Badge component to match design rules
function Badge({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium", className)}>
      {children}
    </span>
  );
}
