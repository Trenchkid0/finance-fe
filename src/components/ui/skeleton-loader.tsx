import * as React from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Skeleton loader components — AGENTS.md §4.7 mandates skeleton screens
 * over spinners to prevent layout shift during data loading.
 *
 * Usage:
 *   <SkeletonCard />
 *   <SkeletonTable rows={5} />
 *   <SkeletonChart />
 */

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-elevated", className)}
      {...props}
    />
  );
}

/**
 * Skeleton for StatCard component — matches exact dimensions to prevent
 * layout shift when real data loads.
 */
export function SkeletonCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-lg border border-border bg-card p-6 space-y-3",
        className
      )}
    >
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-4 w-20" />
    </div>
  );
}

/**
 * Skeleton for NetWorthHero chart card.
 */
export function SkeletonNetWorth({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card overflow-hidden",
        className
      )}
    >
      <div className="flex items-start justify-between gap-4 p-5 pb-3">
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-8 w-20" />
      </div>
      <div className="h-52 px-4 pt-2 pb-3">
        <Skeleton className="h-full w-full" />
      </div>
    </div>
  );
}

/**
 * Skeleton for data table rows.
 */
export function SkeletonTable({
  rows = 5,
  columns = 4,
  className,
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-0", className)}>
      {/* Table header */}
      <div className="bg-elevated px-6 py-3 flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`header-${i}`} className="h-3 flex-1" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={`row-${rowIndex}`}
          className="border-b border-border px-6 py-3 flex gap-4"
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`cell-${rowIndex}-${colIndex}`}
              className="h-4 flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton for chart/visualization blocks.
 */
export function SkeletonChart({
  height = "h-80",
  className,
}: {
  height?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border border-border bg-card p-5 space-y-4",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-20" />
      </div>
      <Skeleton className={cn("w-full", height)} />
    </div>
  );
}

/**
 * Skeleton for BalanceSheet component.
 */
export function SkeletonBalanceSheet({ className }: { className?: string }) {
  return (
    <div className={cn("grid grid-cols-1 lg:grid-cols-2 gap-6", className)}>
      {[1, 2].map((i) => (
        <div
          key={i}
          className="rounded-lg border border-border bg-card p-6 space-y-4"
        >
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-8 w-40" />
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map((j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-28" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Full dashboard skeleton — combines all dashboard components.
 */
export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Net Worth Hero */}
      <SkeletonNetWorth />

      {/* Balance Sheet */}
      <SkeletonBalanceSheet />

      {/* Charts & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <SkeletonChart />
        </div>
        <div className="lg:col-span-1">
          <div className="rounded-lg border border-border bg-card">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="divide-y divide-border">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="px-6 py-3 flex items-center gap-3">
                  <div className="flex-1 space-y-1">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                  </div>
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Made with Bob

/**
 * Skeleton for Transactions page — summary cards + table rows.
 */
export function SkeletonTransactions() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-28 rounded-xl" />
          <Skeleton className="h-9 w-36 rounded-xl" />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      <div className="flex gap-2 flex-wrap">
        <Skeleton className="h-9 w-40 rounded-xl" />
        <Skeleton className="h-9 w-32 rounded-xl" />
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      <SkeletonTable rows={8} columns={5} />
    </div>
  );
}

/**
 * Skeleton for Settings page.
 */
export function SkeletonSettings() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-6 space-y-4">
            <Skeleton className="h-5 w-32" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center justify-between">
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-8 w-40 rounded-lg" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for analytics pages (Income / Expenses) — stat cards + chart + category breakdown + transaction list.
 */
export function SkeletonAnalytics({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-6 animate-fade-in-up", className)}>
      {/* Header */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>
      {/* Stat cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-3 w-20" />
          </div>
        ))}
      </div>
      {/* Chart area */}
      <SkeletonChart height="h-64" />
      {/* Category breakdown + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-32" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-4">
          <Skeleton className="h-5 w-36" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between">
              <div className="flex-1 space-y-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** Convenience alias for Income page skeleton. */
export function SkeletonIncome() {
  return <SkeletonAnalytics />;
}

/** Convenience alias for Expenses page skeleton. */
export function SkeletonExpenses() {
  return <SkeletonAnalytics />;
}

/**
 * Skeleton for Budget page — month selector + category budget rows.
 */
export function SkeletonBudget() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-xl" />
          <Skeleton className="h-9 w-32 rounded-xl" />
        </div>
      </div>
      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      {/* Budget category rows */}
      <div className="rounded-lg border border-border bg-card p-5 space-y-4">
        <Skeleton className="h-5 w-36" />
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-28" />
              </div>
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Goals page — goal cards in a grid.
 */
export function SkeletonGoals() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-64" />
        </div>
        <Skeleton className="h-9 w-32 rounded-xl" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-32" />
              <Skeleton className="h-8 w-8 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full rounded-full" />
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-3 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Recurring page — stat cards + calendar grid + side panel.
 */
export function SkeletonRecurring() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80" />
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      {/* Calendar + side panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-lg border border-border bg-card overflow-hidden">
          <div className="p-4 border-b border-border flex items-center justify-between">
            <Skeleton className="h-4 w-32" />
            <div className="flex gap-1">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <Skeleton className="h-8 w-8 rounded-lg" />
            </div>
          </div>
          <div className="grid grid-cols-7 divide-x divide-y divide-border">
            {Array.from({ length: 35 }).map((_, i) => (
              <div key={i} className="min-h-[70px] border-t border-l border-border p-2">
                <Skeleton className="h-3 w-4 mb-1" />
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-lg border border-border bg-card p-5 space-y-4 min-h-[300px]">
          <Skeleton className="h-4 w-36" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-lg border border-border bg-elevated/40 p-3 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Skeleton for Investments page — stat cards + holdings table.
 */
export function SkeletonInvestments() {
  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36 rounded-xl" />
      </div>
      {/* Stats overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-lg border border-border bg-card p-4 space-y-2">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-6 w-28" />
          </div>
        ))}
      </div>
      {/* Holdings table */}
      <SkeletonTable rows={5} columns={6} />
    </div>
  );
}
