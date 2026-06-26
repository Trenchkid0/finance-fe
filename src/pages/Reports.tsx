import { useEffect, useState, useTransition } from "react";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Download,
  Filter,
  Calendar,
  Layers,
  Inbox,
  Loader2,
  FileSpreadsheet,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { CustomSingleDatePicker } from "@/components/ui/CustomSingleDatePicker";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as ChartTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  AreaChart,
  Area,
} from "recharts";

interface CategoryOption {
  value: string;
  label: string;
}

interface AccountOption {
  value: string;
  label: string;
}

interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netSavings: number;
  savingsRate: number;
  totalTaxDeductible: number;
}

interface ReportBreakdownItem {
  id: string;
  name: string;
  amount: number;
  color: string;
  icon: string;
  percentage: number;
}

interface ReportSeriesItem {
  date: string;
  income: number;
  expense: number;
  savings: number;
}

interface ReportsResponse {
  summary: ReportSummary;
  breakdown: ReportBreakdownItem[];
  series: ReportSeriesItem[];
}

export default function Reports() {
  const { language } = useLanguage();
  const isId = language === "id";

  // Filter states
  const [datePreset, setDatePreset] = useState<string>("30d");
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState<string>(() => new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState<string>("all");
  const [groupBy, setGroupBy] = useState<string>("category");
  const [accountId, setAccountId] = useState<string>("all");
  const [categoryId, setCategoryId] = useState<string>("all");

  // Options lists
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);

  // Report data states
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [pending, startTransition] = useTransition();

  // Populate options on mount
  useEffect(() => {
    const loadFiltersData = async () => {
      try {
        const [catsRes, accsRes] = await Promise.all([
          api.get<Array<{ id: string; name: string; icon: string }>>("/api/categories"),
          api.get<Array<{ id: string; name: string }>>("/api/accounts"),
        ]);

        setCategories([
          { value: "all", label: isId ? "Semua Kategori" : "All Categories" },
          ...(catsRes || []).map((c) => ({
            value: c.id,
            label: `${c.icon || "📂"} ${c.name}`,
          })),
        ]);

        setAccounts([
          { value: "all", label: isId ? "Semua Akun" : "All Accounts" },
          ...(accsRes || []).map((a) => ({
            value: a.id,
            label: a.name,
          })),
        ]);
      } catch (err) {
        console.error("Failed to load options", err);
      }
    };
    loadFiltersData();
  }, [isId]);

  // Adjust startDate/endDate based on presets
  useEffect(() => {
    if (datePreset === "custom") return;

    const end = new Date();
    const start = new Date();

    if (datePreset === "30d") {
      start.setDate(end.getDate() - 30);
    } else if (datePreset === "ytd") {
      start.setMonth(0, 1);
    } else if (datePreset === "last_year") {
      start.setFullYear(end.getFullYear() - 1, 0, 1);
      end.setFullYear(end.getFullYear() - 1, 11, 31);
    } else if (datePreset === "365d") {
      start.setDate(end.getDate() - 365);
    }

    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [datePreset]);

  // Fetch report data when filters change
  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        startDate,
        endDate,
        type: reportType,
        groupBy,
        accountId,
        categoryId,
      });
      const res = await api.get<ReportsResponse>(`/api/reports?${params.toString()}`);
      setData(res);
    } catch (err) {
      console.error("Failed to fetch reports", err);
      toast.error(isId ? "Gagal memuat laporan" : "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    startTransition(() => {
      fetchReport();
    });
  }, [startDate, endDate, reportType, groupBy, accountId, categoryId]);

  // Handle Tax-Ready CSV Export Href
  const taxExportHref = () => {
    const params = new URLSearchParams({
      startDate,
      endDate,
      accountId,
      categoryId,
    });
    return `/api/transactions/export/tax?${params.toString()}`;
  };

  // Recharts color palette
  const COLORS = ["#388BFD", "#2EA043", "#D29922", "#F85149", "#A371F7", "#39D353", "#8B949E"];

  const renderCharts = () => {
    if (!data) return null;

    const breakdownData = data.breakdown || [];
    const seriesData = data.series || [];

    const hasBreakdown = breakdownData.length > 0;
    const hasSeries = seriesData.length > 0;

    return (
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Breakdown Card */}
        <Card className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
              {isId ? "Proporsi Pengeluaran / Pemasukan" : "Expense / Income Distribution"}
            </h3>
            {!hasBreakdown ? (
              <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl">
                <p className="text-xs text-text-muted">{isId ? "Tidak ada data distribusi" : "No distribution data available"}</p>
              </div>
            ) : (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={breakdownData}
                      dataKey="amount"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={4}
                    >
                      {breakdownData.map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color || COLORS[idx % COLORS.length]} />
                      ))}
                    </Pie>
                    <ChartTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const item = payload[0].payload as ReportBreakdownItem;
                          return (
                            <div className="bg-elevated border border-border px-3 py-2 rounded-lg text-xs">
                              <p className="font-semibold text-text-primary flex items-center gap-1.5">
                                <span>{item.icon}</span>
                                <span>{item.name}</span>
                              </p>
                              <p className="text-text-muted mt-1 font-mono tabular-nums">
                                {formatIDR(item.amount)} ({item.percentage.toFixed(1)}%)
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
          {hasBreakdown && (
            <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 mt-4">
              {breakdownData.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-text-muted">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }}
                  />
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Trend Card */}
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4">
            {isId ? "Tren Arus Kas (Per Bulan)" : "Cash Flow Trend (Monthly)"}
          </h3>
          {!hasSeries ? (
            <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl">
              <p className="text-xs text-text-muted">{isId ? "Tidak ada data tren" : "No trend data available"}</p>
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={seriesData}>
                  <defs>
                    <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#2EA043" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#2EA043" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F85149" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#F85149" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="#30363D" strokeDasharray="3 3" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#8B949E" fontSize={10} tickLine={false} />
                  <YAxis
                    stroke="#8B949E"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(val) => formatIDR(val, { compact: true })}
                  />
                  <ChartTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-elevated border border-border px-3 py-2 rounded-lg text-xs space-y-1">
                            <p className="font-semibold text-text-muted mb-1">{payload[0].payload.date}</p>
                            {payload.map((p, idx) => (
                              <div key={idx} className="flex items-center justify-between gap-4 font-mono tabular-nums">
                                <span style={{ color: p.color }}>{p.name}:</span>
                                <span className="font-semibold text-text-primary">
                                  {formatIDR(Number(p.value))}
                                </span>
                              </div>
                            ))}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    name={isId ? "Pemasukan" : "Income"}
                    stroke="#2EA043"
                    fillOpacity={1}
                    fill="url(#colorIncome)"
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    name={isId ? "Pengeluaran" : "Expense"}
                    stroke="#F85149"
                    fillOpacity={1}
                    fill="url(#colorExpense)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header and Export */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground flex items-center gap-2">
            📊 {isId ? "Laporan & Pajak" : "Reports & Tax"}
          </h1>
          <p className="text-sm text-muted-foreground/80 mt-1.5">
            {isId
              ? "Analisis keuangan mendalam dan ekspor siap SPT pajak."
              : "In-depth financial intelligence and tax SPT ready exports."}
          </p>
        </div>

        {data && data.summary.totalTaxDeductible > 0 && (
          <Button asChild size="sm" className="h-9 gap-2 font-semibold">
            <a href={taxExportHref()} download>
              <Download size={14} />
              {isId ? "Ekspor CSV Pajak" : "Export Tax CSV"}
            </a>
          </Button>
        )}
      </div>

      {/* Dynamic Filters Form */}
      <Card className="p-4 border border-border bg-surface">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Date Preset */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
              {isId ? "Rentang Waktu" : "Date Period"}
            </label>
            <FormSelect
              value={datePreset}
              onChange={setDatePreset}
              options={[
                { value: "30d", label: isId ? "30 Hari Terakhir" : "Last 30 Days" },
                { value: "ytd", label: isId ? "Tahun Ini (YTD)" : "Year to Date" },
                { value: "last_year", label: isId ? "Tahun Lalu" : "Last Year" },
                { value: "365d", label: isId ? "365 Hari Terakhir" : "Last 365 Days" },
                { value: "custom", label: isId ? "Kustom Tanggal" : "Custom Dates" },
              ]}
            />
          </div>

          {/* Group By */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
              {isId ? "Kelompokkan" : "Group By"}
            </label>
            <FormSelect
              value={groupBy}
              onChange={setGroupBy}
              options={[
                { value: "category", label: isId ? "Kategori" : "Category" },
                { value: "account", label: isId ? "Akun" : "Account" },
              ]}
            />
          </div>

          {/* Report Type */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
              {isId ? "Tipe Transaksi" : "Transaction Type"}
            </label>
            <FormSelect
              value={reportType}
              onChange={setReportType}
              options={[
                { value: "all", label: isId ? "Semua Tipe" : "All Types" },
                { value: "expense", label: isId ? "Hanya Pengeluaran" : "Expenses Only" },
                { value: "income", label: isId ? "Hanya Pemasukan" : "Income Only" },
              ]}
            />
          </div>

          {/* Account Filter */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
              {isId ? "Filter Akun" : "Account Filter"}
            </label>
            <FormSelect value={accountId} onChange={setAccountId} options={accounts} />
          </div>

          {/* Category Filter */}
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
              {isId ? "Filter Kategori" : "Category Filter"}
            </label>
            <FormSelect value={categoryId} onChange={setCategoryId} options={categories} />
          </div>
        </div>

        {/* Custom Date Inputs if selected */}
        {datePreset === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/40 max-w-md">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
                {isId ? "Mulai Tanggal" : "Start Date"}
              </label>
              <CustomSingleDatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/75 uppercase tracking-wider">
                {isId ? "Sampai Tanggal" : "End Date"}
              </label>
              <CustomSingleDatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
        )}
      </Card>

      {/* Loading Overlay */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 text-accent animate-spin" />
          <p className="text-xs text-text-muted">{isId ? "Menghitung data laporan…" : "Calculating report metrics…"}</p>
        </div>
      ) : !data || (data.breakdown.length === 0 && data.series.length === 0) ? (
        <Card className="p-8 border border-border bg-surface flex items-center justify-center">
          <EmptyState
            icon={Inbox}
            title={isId ? "Tidak ada transaksi ditemukan" : "No matching transactions found"}
            description={
              isId
                ? "Cobalah mengubah filter waktu atau kriteria pencarian Anda."
                : "Try adjusting your dates or filter criteria to view report metrics."
            }
            size="sm"
          />
        </Card>
      ) : (
        <>
          {/* Stats KPI grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {/* KPI: Total Inflow */}
            <Card className="p-4 gap-0 relative overflow-hidden">
              <div className="absolute top-3 right-3 size-8 rounded-lg bg-income/10 flex items-center justify-center">
                <TrendingUp size={15} className="text-income" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">
                {isId ? "Total Pemasukan" : "Total Inflow"}
              </p>
              <p className="text-xl font-extrabold font-mono tabular-nums text-income">
                {formatIDR(data.summary.totalIncome)}
              </p>
            </Card>

            {/* KPI: Total Outflow */}
            <Card className="p-4 gap-0 relative overflow-hidden">
              <div className="absolute top-3 right-3 size-8 rounded-lg bg-expense/10 flex items-center justify-center">
                <TrendingDown size={15} className="text-expense" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">
                {isId ? "Total Pengeluaran" : "Total Outflow"}
              </p>
              <p className="text-xl font-extrabold font-mono tabular-nums text-expense">
                {formatIDR(data.summary.totalExpense)}
              </p>
            </Card>

            {/* KPI: Net Savings */}
            <Card className="p-4 gap-0 relative overflow-hidden">
              <div className="absolute top-3 right-3 size-8 rounded-lg bg-accent/10 flex items-center justify-center">
                <Wallet size={15} className="text-accent" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">
                {isId ? "Tabungan Bersih" : "Net Savings"}
              </p>
              <p
                className={`text-xl font-extrabold font-mono tabular-nums ${
                  data.summary.netSavings >= 0 ? "text-income" : "text-expense"
                }`}
              >
                {formatIDR(data.summary.netSavings)}
              </p>
            </Card>

            {/* KPI: Savings Rate */}
            <Card className="p-4 gap-0 relative overflow-hidden">
              <p className="text-[9px] font-bold uppercase tracking-wider text-text-muted mb-2">
                {isId ? "Rasio Menabung" : "Savings Rate"}
              </p>
              <div className="flex items-baseline gap-2">
                <p className="text-xl font-extrabold font-mono tabular-nums text-text-primary">
                  {data.summary.savingsRate.toFixed(1)}%
                </p>
              </div>
              <div className="w-full bg-white/[0.05] h-1.5 rounded-full mt-3 overflow-hidden">
                <div
                  className="bg-accent h-full rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, data.summary.savingsRate))}%` }}
                />
              </div>
            </Card>

            {/* KPI: Tax Deductible Total */}
            <Card className="p-4 gap-0 relative overflow-hidden border-warning/30 bg-warning/5">
              <div className="absolute top-3 right-3 size-8 rounded-lg bg-warning/10 flex items-center justify-center">
                <FileSpreadsheet size={15} className="text-warning" />
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-warning mb-2">
                {isId ? "Deduktibel Pajak" : "Tax Deductible"}
              </p>
              <p className="text-xl font-extrabold font-mono tabular-nums text-warning">
                {formatIDR(data.summary.totalTaxDeductible)}
              </p>
              <p className="text-[9px] text-text-muted/80 mt-1.5">
                {isId ? "Siap diekspor ke format SPT" : "Ready to export for tax SPT"}
              </p>
            </Card>
          </div>

          {/* Charts visualizations */}
          {renderCharts()}

          {/* Breakdown list table */}
          <Card className="p-6">
            <h3 className="text-sm font-semibold text-text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
              <Layers size={14} className="text-text-muted" />
              {isId ? `Detail Distribusi per ${groupBy === "category" ? "Kategori" : "Akun"}` : `Distribution Detail by ${groupBy === "category" ? "Category" : "Account"}`}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse text-left">
                <thead>
                  <tr className="border-b border-border bg-elevated/40">
                    <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-text-muted">
                      {groupBy === "category"
                        ? isId
                          ? "Kategori"
                          : "Category"
                        : isId
                          ? "Akun"
                          : "Account"}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">
                      {isId ? "Total Nominal" : "Total Amount"}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-text-muted text-right">
                      {isId ? "Persentase" : "Percentage"}
                    </th>
                    <th className="py-2.5 px-4 text-xs font-semibold uppercase tracking-wider text-text-muted hidden md:table-cell">
                      {isId ? "Visualisasi" : "Visual"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.breakdown.map((item, idx) => (
                    <tr
                      key={item.id}
                      className="border-b border-border/60 hover:bg-elevated/20 transition-all duration-150"
                    >
                      <td className="py-3 px-4 flex items-center gap-2.5 font-medium text-text-primary">
                        <span className="text-lg" aria-hidden>
                          {item.icon || "📂"}
                        </span>
                        <span>{item.name}</span>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-text-primary">
                        {formatIDR(item.amount)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-text-muted">
                        {item.percentage.toFixed(1)}%
                      </td>
                      <td className="py-3 px-4 hidden md:table-cell w-1/3">
                        <div className="w-full bg-white/[0.04] h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                              width: `${item.percentage}%`,
                              backgroundColor: item.color || COLORS[idx % COLORS.length],
                            }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
