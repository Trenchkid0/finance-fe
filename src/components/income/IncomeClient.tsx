"use client";

import { Link } from "react-router-dom";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Award, Calendar, DollarSign, Inbox, LineChart, TrendingUp } from "lucide-react";
import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/dashboard/StatCard";

interface IncomeTransaction {
  id: string;
  amount: number;
  date: string;
  description: string | null;
  accountName: string;
  categoryName: string | null;
  categoryIcon: string | null;
}

interface MonthlyTrend {
  month: string;
  amount: number;
}

interface CategoryBreakdown {
  category: string;
  amount: number;
  percent: number;
  icon: string | null;
}

interface Props {
  transactions: IncomeTransaction[];
  monthlyTrend: MonthlyTrend[];
  categoryBreakdown: CategoryBreakdown[];
  currentMonthTotal: number;
  /** Period-over-period ratio vs last full month (undefined if 0). */
  monthlyDelta?: number;
  averageMonthly: number;
  maxIncome: { description: string; amount: number } | null;
}

// Color palette untuk kategori income - lebih cerah dan positif
const CATEGORY_COLORS = [
  "#2EA043", // green
  "#388BFD", // blue
  "#39D353", // light green
  "#79B8FF", // light blue
  "#A371F7", // purple
  "#D29922", // amber
  "#E88F6C", // orange
  "#58A6FF", // sky blue
];

export function IncomeClient({
  transactions,
  monthlyTrend,
  categoryBreakdown,
  currentMonthTotal,
  monthlyDelta,
  averageMonthly,
  maxIncome,
}: Props) {
  const hasTrend =
    monthlyTrend.length > 0 && monthlyTrend.some((t) => t.amount > 0);

  const allTimeTotal = categoryBreakdown.reduce((s, c) => s + c.amount, 0);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl lg:text-3xl font-semibold text-foreground">
          Income Analysis
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor income sources, track growth, and optimize revenue streams.
        </p>
      </header>

      {/* KPI grid */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="This Month"
          amount={currentMonthTotal}
          delta={monthlyDelta}
          tone="income"
          icon={<TrendingUp size={16} />}
        />
        <StatCard
          label="Monthly Average"
          amount={averageMonthly}
          icon={<Calendar size={16} />}
        />
        <StatCard
          label="Top Source"
          amount={maxIncome?.description ?? "No data"}
          tone="income"
          icon={<Award size={16} />}
          trendDescription={
            maxIncome ? formatIDR(maxIncome.amount) : undefined
          }
        />
        <StatCard
          label="All Time Total"
          amount={allTimeTotal}
          tone="income"
          icon={<DollarSign size={16} />}
        />
      </section>

      {/* Charts */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Monthly Trend Chart */}
        <Card className="lg:col-span-2 p-5">
          <h2 className="text-base font-medium text-foreground mb-4">
            Monthly Income Trend
          </h2>
          <div className="h-64">
            {!hasTrend ? (
              <EmptyState
                icon={LineChart}
                title="Not enough data"
                description="Add income transactions to see monthly trends."
              />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={monthlyTrend}
                  margin={{ top: 8, right: 10, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="incomeTrendGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2EA043" stopOpacity={0.5} />
                      <stop offset="95%" stopColor="#2EA043" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    stroke="#30363D"
                    strokeOpacity={0.5}
                    vertical={false}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#9CA3AF"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v: number) =>
                      formatIDR(v, { compact: true })
                    }
                  />
                  <Tooltip
                    contentStyle={{
                      background: "#1C2128",
                      border: "1px solid #30363D",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    labelStyle={{ color: "#F0F6FC" }}
                    formatter={(v: number) => [formatIDR(v), "Income"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#2EA043"
                    strokeWidth={2}
                    fill="url(#incomeTrendGlow)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        {/* Category Breakdown with Color Legend */}
        <Card className="p-5 flex flex-col">
          <div className="flex-1">
            <h2 className="text-base font-medium text-foreground mb-4">
              Category Breakdown
            </h2>
            {categoryBreakdown.length === 0 ? (
              <EmptyState
                icon={Inbox}
                title="No breakdown yet"
                description="Income transactions with categories will appear here."
                size="sm"
              />
            ) : (
              <div className="space-y-4">
                {/* Color Reference Boxes - Like Budget */}
                <div className="grid grid-cols-4 gap-2">
                  {categoryBreakdown.slice(0, 8).map((cat, i) => (
                    <div
                      key={cat.category}
                      className="flex flex-col items-center gap-1.5 p-2 rounded-lg border border-border/50 hover:border-border transition-colors"
                      title={`${cat.category}: ${formatIDR(cat.amount)}`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-sm"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}15`,
                          color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                        }}
                      >
                        {cat.icon || "💰"}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center truncate w-full">
                        {cat.percent.toFixed(0)}%
                      </span>
                    </div>
                  ))}
                </div>

                {/* Category List with Progress Bars */}
                <ul className="space-y-3">
                  {categoryBreakdown.slice(0, 5).map((cat, i) => (
                    <li key={cat.category} className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div
                            className="w-3 h-3 rounded shrink-0"
                            style={{ backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                          />
                          <span className="text-foreground font-medium truncate">
                            {cat.category}
                          </span>
                        </div>
                        <span className="font-mono tabular-nums text-foreground font-semibold shrink-0 ml-2">
                          {formatIDR(cat.amount)}
                        </span>
                      </div>
                      <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-300"
                          style={{
                            width: `${cat.percent}%`,
                            backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
                          }}
                        />
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {categoryBreakdown.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <Link
                to="/transactions?type=income"
                className="text-xs text-accent hover:underline font-medium"
              >
                View all income transactions →
              </Link>
            </div>
          )}
        </Card>
      </section>

      {/* Recent Transactions */}
      {transactions.length > 0 && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-foreground">
              Recent Income
            </h2>
            <Link
              to="/transactions?type=income"
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              View all
            </Link>
          </div>
          <div className="space-y-2">
            {transactions.slice(0, 5).map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between py-2 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <span className="text-sm">{tx.categoryIcon || "💰"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-foreground truncate">
                      {tx.description || tx.categoryName || "Income"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatDateShort(tx.date)} · {tx.accountName}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-mono tabular-nums text-income font-semibold shrink-0 ml-4">
                  +{formatIDR(tx.amount)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// Made with Bob
