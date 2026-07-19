import { useEffect, useState, useTransition } from "react";
import {
  TrendingUp, TrendingDown, Wallet, Download,
  Layers, Inbox, Loader2, FileSpreadsheet, PiggyBank,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FormSelect } from "@/components/ui/FormSelect";
import { EmptyState } from "@/components/ui/empty-state";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { CustomSingleDatePicker } from "@/components/ui/CustomSingleDatePicker";
import {
  ResponsiveContainer, PieChart, Pie, Cell,
  Tooltip as ChartTooltip, XAxis, YAxis, CartesianGrid,
  AreaChart, Area,
} from "recharts";

interface CategoryOption { value: string; label: string; }
interface AccountOption { value: string; label: string; }
interface ReportSummary {
  totalIncome: number; totalExpense: number; netSavings: number;
  savingsRate: number; totalTaxDeductible: number;
}
interface ReportBreakdownItem {
  id: string; name: string; amount: number;
  color: string; icon: string; percentage: number;
}
interface ReportSeriesItem { date: string; income: number; expense: number; savings: number; }
interface ReportsResponse {
  summary: ReportSummary; breakdown: ReportBreakdownItem[]; series: ReportSeriesItem[];
}

// Interactive donut chart with hoverable center label
function DonutChart({ data, isId }: { data: ReportBreakdownItem[]; isId: boolean }) {
  const [active, setActive] = useState<ReportBreakdownItem | null>(null);
  const total = data.reduce((s, d) => s + d.amount, 0);
  const displayed = active ?? { name: isId ? "Total" : "Total", amount: total, color: "var(--accent)", icon: "📊", id: "", percentage: 100 };

  const FALLBACK = ["#388BFD","#2EA043","#D29922","#F85149","#A371F7","#39D353","#8B949E"];

  return (
    <div className="relative h-64">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="amount"
            nameKey="name"
            cx="50%" cy="50%"
            innerRadius={72} outerRadius={95}
            paddingAngle={3}
            onMouseEnter={(_, idx) => setActive(data[idx])}
            onMouseLeave={() => setActive(null)}
          >
            {data.map((entry, idx) => (
              <Cell
                key={entry.id}
                fill={entry.color || FALLBACK[idx % FALLBACK.length]}
                opacity={active && active.id !== entry.id ? 0.35 : 1}
                stroke="none"
                style={{ cursor: "pointer", transition: "opacity 0.2s" }}
              />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>

      {/* Center label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-xl mb-0.5">{displayed.icon}</span>
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-bold font-sans">
          {displayed.name}
        </p>
        <p className="text-sm font-black font-mono tabular-nums text-foreground mt-0.5">
          {formatIDR(displayed.amount)}
        </p>
        {active && (
          <p className="text-[11px] font-bold text-accent mt-0.5 font-mono">
            {active.percentage.toFixed(1)}%
          </p>
        )}
      </div>
    </div>
  );
}

// KPI card with optional mini progress bar and glow border
function KpiCard({
  label, value, icon: Icon, color, sub, progress,
}: {
  label: string; value: string; icon: React.ElementType;
  color: "income" | "expense" | "accent" | "warning"; sub?: string; progress?: number;
}) {
  const colorMap = {
    income: { bg: "bg-income/10", text: "text-income", border: "border-income/20" },
    expense: { bg: "bg-expense/10", text: "text-expense", border: "border-expense/20" },
    accent: { bg: "bg-accent/10", text: "text-accent", border: "border-accent/20" },
    warning: { bg: "bg-warning/10", text: "text-warning", border: "border-warning/20" },
  };
  const c = colorMap[color];

  return (
    <Card className={cn("p-4 gap-0 relative overflow-hidden group transition-all duration-300 hover:shadow-lg", `hover:${c.border}`)}>
      {/* Top-right icon badge */}
      <div className={cn("absolute top-3 right-3 size-8 rounded-lg flex items-center justify-center transition-all duration-300 group-hover:scale-110", c.bg)}>
        <Icon size={15} className={c.text} />
      </div>

      {/* Subtle gradient glow bg */}
      <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[inherit]", c.bg)} style={{ opacity: 0 }} />

      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/60 mb-2 font-sans">{label}</p>
      <p className={cn("text-xl font-extrabold font-mono tabular-nums", c.text)}>{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground/60 mt-1.5 font-medium">{sub}</p>}
      {progress !== undefined && (
        <div className="mt-3 h-1.5 w-full bg-border/30 rounded-full overflow-hidden">
          <div
            className={cn("h-full rounded-full transition-all duration-700", color === "income" ? "bg-income" : color === "expense" ? "bg-expense" : color === "warning" ? "bg-warning" : "bg-accent")}
            style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
          />
        </div>
      )}
    </Card>
  );
}

export default function Reports() {
  const { language } = useLanguage();
  const isId = language === "id";

  const [datePreset, setDatePreset] = useState("30d");
  const [startDate, setStartDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 30); return d.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [reportType, setReportType] = useState("all");
  const [groupBy, setGroupBy] = useState("category");
  const [accountId, setAccountId] = useState("all");
  const [categoryId, setCategoryId] = useState("all");
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [data, setData] = useState<ReportsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  useEffect(() => {
    const load = async () => {
      try {
        const [catsRes, accsRes] = await Promise.all([
          api.get<Array<{ id: string; name: string; icon: string }>>("/api/categories"),
          api.get<Array<{ id: string; name: string }>>("/api/accounts"),
        ]);
        setCategories([
          { value: "all", label: isId ? "Semua Kategori" : "All Categories" },
          ...(catsRes || []).map((c) => ({ value: c.id, label: `${c.icon || "📂"} ${c.name}` })),
        ]);
        setAccounts([
          { value: "all", label: isId ? "Semua Akun" : "All Accounts" },
          ...(accsRes || []).map((a) => ({ value: a.id, label: a.name })),
        ]);
      } catch { /* silent */ }
    };
    load();
  }, [isId]);

  useEffect(() => {
    if (datePreset === "custom") return;
    const end = new Date(); const start = new Date();
    if (datePreset === "30d") start.setDate(end.getDate() - 30);
    else if (datePreset === "ytd") start.setMonth(0, 1);
    else if (datePreset === "last_year") { start.setFullYear(end.getFullYear() - 1, 0, 1); end.setFullYear(end.getFullYear() - 1, 11, 31); }
    else if (datePreset === "365d") start.setDate(end.getDate() - 365);
    setStartDate(start.toISOString().split("T")[0]);
    setEndDate(end.toISOString().split("T")[0]);
  }, [datePreset]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ startDate, endDate, type: reportType, groupBy, accountId, categoryId });
      const res = await api.get<ReportsResponse>(`/api/reports?${params}`);
      setData(res);
    } catch {
      toast.error(isId ? "Gagal memuat laporan" : "Failed to load report data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { startTransition(() => { fetchReport(); }); }, [startDate, endDate, reportType, groupBy, accountId, categoryId]);

  const taxExportHref = () => {
    const p = new URLSearchParams({ startDate, endDate, accountId, categoryId });
    return `/api/transactions/export/tax?${p}`;
  };

  const COLORS = ["#388BFD","#2EA043","#D29922","#F85149","#A371F7","#39D353","#8B949E"];

  const hasData = data && (data.breakdown.length > 0 || data.series.length > 0);

  return (
    <div className="space-y-6 animate-fade-in-up">

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground flex items-center gap-2">
            📊 {isId ? "Laporan & Pajak" : "Reports & Tax"}
          </h1>
          <p className="text-sm text-muted-foreground/70 mt-1.5">
            {isId ? "Analisis keuangan mendalam dan ekspor siap SPT pajak." : "In-depth financial intelligence and tax-ready exports."}
          </p>
        </div>
        {data && data.summary.totalTaxDeductible > 0 && (
          <Button asChild size="sm" className="h-9 gap-2 font-semibold">
            <a href={taxExportHref()} download>
              <Download size={14} /> {isId ? "Ekspor CSV Pajak" : "Export Tax CSV"}
            </a>
          </Button>
        )}
      </div>

      {/* ── Filter Bar ── */}
      <Card className="p-5 border border-border/60 bg-card/60">
        <p className="text-[10px] uppercase tracking-widest text-muted-foreground/50 font-bold mb-4 font-sans">
          {isId ? "Filter Laporan" : "Report Filters"}
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          <div className="space-y-1.5 col-span-2 md:col-span-1">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Periode" : "Period"}</label>
            <FormSelect value={datePreset} onChange={setDatePreset} placeholder="Period" options={[
              { value: "30d", label: isId ? "30 Hari Terakhir" : "Last 30 Days" },
              { value: "ytd", label: isId ? "Tahun Ini (YTD)" : "Year to Date" },
              { value: "last_year", label: isId ? "Tahun Lalu" : "Last Year" },
              { value: "365d", label: isId ? "365 Hari Terakhir" : "Last 365 Days" },
              { value: "custom", label: isId ? "Kustom Tanggal" : "Custom Dates" },
            ]} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Kelompokkan" : "Group By"}</label>
            <FormSelect value={groupBy} onChange={setGroupBy} placeholder="Group" options={[
              { value: "category", label: isId ? "Kategori" : "Category" },
              { value: "account", label: isId ? "Akun" : "Account" },
            ]} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Tipe" : "Type"}</label>
            <FormSelect value={reportType} onChange={setReportType} placeholder="Type" options={[
              { value: "all", label: isId ? "Semua Tipe" : "All Types" },
              { value: "expense", label: isId ? "Pengeluaran" : "Expenses" },
              { value: "income", label: isId ? "Pemasukan" : "Income" },
            ]} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Akun" : "Account"}</label>
            <FormSelect value={accountId} onChange={setAccountId} placeholder="Account" options={accounts} />
          </div>
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Kategori" : "Category"}</label>
            <FormSelect value={categoryId} onChange={setCategoryId} placeholder="Category" options={categories} />
          </div>
        </div>
        {datePreset === "custom" && (
          <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/40 max-w-sm">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Mulai" : "Start"}</label>
              <CustomSingleDatePicker value={startDate} onChange={setStartDate} />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground/60 uppercase tracking-wider">{isId ? "Selesai" : "End"}</label>
              <CustomSingleDatePicker value={endDate} onChange={setEndDate} />
            </div>
          </div>
        )}
      </Card>

      {/* ── Content ── */}
      {loading ? (
        <div className="h-64 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-7 w-7 text-accent animate-spin" />
          <p className="text-xs text-muted-foreground">{isId ? "Menghitung data laporan…" : "Calculating report metrics…"}</p>
        </div>
      ) : !hasData ? (
        <Card className="p-8 flex items-center justify-center">
          <EmptyState icon={Inbox} title={isId ? "Tidak ada transaksi" : "No transactions found"}
            description={isId ? "Coba ubah filter waktu atau kriteria pencarian Anda." : "Try adjusting your date range or filter criteria."}
            size="sm" />
        </Card>
      ) : (
        <div className="space-y-6">

          {/* ── KPI Grid ── */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            <KpiCard
              label={isId ? "Total Pemasukan" : "Total Inflow"}
              value={formatIDR(data!.summary.totalIncome)}
              icon={TrendingUp} color="income"
            />
            <KpiCard
              label={isId ? "Total Pengeluaran" : "Total Outflow"}
              value={formatIDR(data!.summary.totalExpense)}
              icon={TrendingDown} color="expense"
            />
            <KpiCard
              label={isId ? "Tabungan Bersih" : "Net Savings"}
              value={formatIDR(data!.summary.netSavings)}
              icon={Wallet} color={data!.summary.netSavings >= 0 ? "income" : "expense"}
            />
            <KpiCard
              label={isId ? "Rasio Menabung" : "Savings Rate"}
              value={`${data!.summary.savingsRate.toFixed(1)}%`}
              icon={PiggyBank} color="accent"
              progress={data!.summary.savingsRate}
            />
            <KpiCard
              label={isId ? "Deduktibel Pajak" : "Tax Deductible"}
              value={formatIDR(data!.summary.totalTaxDeductible)}
              icon={FileSpreadsheet} color="warning"
              sub={isId ? "Siap ekspor SPT" : "Ready for tax SPT"}
            />
          </div>

          {/* ── Charts Row ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

            {/* Donut */}
            <Card className="p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-sans">
                {isId ? "Proporsi Distribusi" : "Distribution Breakdown"}
              </h3>
              {data!.breakdown.length === 0 ? (
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">{isId ? "Tidak ada data" : "No data available"}</p>
                </div>
              ) : (
                <>
                  <DonutChart data={data!.breakdown} isId={isId} />
                  <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 justify-center">
                    {data!.breakdown.slice(0, 6).map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <span className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: item.color || COLORS[idx % COLORS.length] }} />
                        <span>{item.name}</span>
                        <span className="font-mono text-[10px] text-muted-foreground/60">{item.percentage.toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </Card>

            {/* Area Trend */}
            <Card className="p-5">
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 mb-4 font-sans">
                {isId ? "Tren Arus Kas (Per Bulan)" : "Cash Flow Trend (Monthly)"}
              </h3>
              {data!.series.length === 0 ? (
                <div className="h-64 flex items-center justify-center border border-dashed border-border rounded-xl">
                  <p className="text-xs text-muted-foreground">{isId ? "Tidak ada data tren" : "No trend data"}</p>
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data!.series} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="gradIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--income)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--income)" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="gradExpense" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--expense)" stopOpacity={0.25} />
                          <stop offset="95%" stopColor="var(--expense)" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke="var(--border)" strokeDasharray="2 8" opacity={0.4} />
                      <XAxis dataKey="date" stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false} />
                      <YAxis stroke="var(--muted-foreground)" fontSize={9} tickLine={false} axisLine={false}
                        tickFormatter={(v) => formatIDR(v, { compact: true })} />
                      <ChartTooltip
                        content={({ active, payload }) => {
                          if (!active || !payload?.length) return null;
                          return (
                            <div className="rounded-xl border border-border/60 bg-card/95 backdrop-blur-md px-3 py-2.5 shadow-lg text-xs space-y-1">
                              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">{payload[0].payload.date}</p>
                              {payload.map((p, idx) => (
                                <div key={idx} className="flex items-center justify-between gap-6">
                                  <span className="flex items-center gap-1.5" style={{ color: p.color }}>
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: p.color as string }} />
                                    {p.name}
                                  </span>
                                  <span className="font-mono font-bold text-foreground">{formatIDR(Number(p.value))}</span>
                                </div>
                              ))}
                            </div>
                          );
                        }}
                      />
                      <Area type="monotone" dataKey="income" name={isId ? "Pemasukan" : "Income"}
                        stroke="var(--income)" strokeWidth={2} fill="url(#gradIncome)" />
                      <Area type="monotone" dataKey="expense" name={isId ? "Pengeluaran" : "Expense"}
                        stroke="var(--expense)" strokeWidth={2} fill="url(#gradExpense)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </Card>
          </div>

          {/* ── Breakdown Table ── */}
          <Card className="overflow-hidden">
            <div className="px-5 py-4 border-b border-border/40 flex items-center gap-2">
              <Layers size={14} className="text-muted-foreground/60" />
              <h3 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/60 font-sans">
                {isId
                  ? `Detail per ${groupBy === "category" ? "Kategori" : "Akun"}`
                  : `Breakdown by ${groupBy === "category" ? "Category" : "Account"}`}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/10">
                    <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-left">
                      {groupBy === "category" ? (isId ? "Kategori" : "Category") : (isId ? "Akun" : "Account")}
                    </th>
                    <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-right">
                      {isId ? "Total" : "Amount"}
                    </th>
                    <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 text-right">
                      %
                    </th>
                    <th className="py-2.5 px-5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60 hidden md:table-cell">
                      {isId ? "Distribusi" : "Share"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data!.breakdown.map((item, idx) => {
                    const barColor = item.color || COLORS[idx % COLORS.length];
                    return (
                      <tr key={item.id}
                        className="border-b border-border/30 hover:bg-muted/10 transition-colors duration-150 group">
                        <td className="py-3 px-5">
                          <div className="flex items-center gap-2.5">
                            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: barColor }} />
                            <span className="text-lg leading-none" aria-hidden>{item.icon || "📂"}</span>
                            <span className="font-semibold text-foreground text-xs">{item.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-5 text-right font-mono tabular-nums text-foreground font-bold text-xs">
                          {formatIDR(item.amount)}
                        </td>
                        <td className="py-3 px-5 text-right">
                          <span className="text-xs font-bold font-mono tabular-nums px-2 py-0.5 rounded-md"
                            style={{ backgroundColor: `${barColor}18`, color: barColor }}>
                            {item.percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="py-3 px-5 hidden md:table-cell w-1/3">
                          <div className="relative h-2 w-full bg-border/20 rounded-full overflow-hidden">
                            <div className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                              style={{ width: `${item.percentage}%`, backgroundColor: barColor }} />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>

        </div>
      )}
    </div>
  );
}
