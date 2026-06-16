import { useState } from "react";
import { Link } from "react-router-dom";
import {
	Area,
	AreaChart,
	Bar,
	BarChart,
	CartesianGrid,
	Line,
	LineChart,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from "recharts";
import {
	Award,
	Calendar,
	Inbox,
	LineChart as LucideLineChart,
	TrendingDown,
	TrendingUp,
	ArrowRight,
	Target,
	Sparkles,
	AlertCircle,
} from "lucide-react";

import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/ui/empty-state";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface ExpenseTransaction {
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
	transactions: ExpenseTransaction[];
	monthlyTrend: MonthlyTrend[];
	categoryBreakdown: CategoryBreakdown[];
	currentMonthTotal: number;
	monthlyDelta?: number;
	averageMonthly: number;
	maxExpenseCategory: { name: string; amount: number } | null;
}

const CATEGORY_COLORS = [
	"#EF4444", // Red
	"#F57C00", // Dark Orange
	"#F59E0B", // Amber
	"#EC4899", // Pink
	"#8B5CF6", // Purple
	"#3B82F6", // Blue
	"#06B6D4", // Cyan
	"#6366F1", // Indigo
];

function CustomTooltip({ active, payload, label, activeChartData }: any) {
	const { language } = useLanguage();
	if (active && payload && payload.length) {
		const val = payload[0].value;
		let comparisonText = "";
		let comparisonColor = "text-muted-foreground/60";
		
		if (activeChartData) {
			const idx = activeChartData.findIndex((d: any) => d.month === label);
			if (idx > 0) {
				const prevVal = activeChartData[idx - 1].amount;
				if (prevVal > 0) {
					const diff = val - prevVal;
					const pct = (diff / prevVal) * 100;
					if (diff > 0) {
						comparisonText = `+${pct.toFixed(0)}% vs ${activeChartData[idx - 1].month}`;
						comparisonColor = "text-expense font-bold";
					} else if (diff < 0) {
						comparisonText = `${pct.toFixed(0)}% vs ${activeChartData[idx - 1].month}`;
						comparisonColor = "text-income font-bold";
					} else {
						comparisonText = `0% vs ${activeChartData[idx - 1].month}`;
					}
				}
			}
		}

		return (
			<div className="rounded-xl border border-white/[0.08] bg-popover/90 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/50 text-xs space-y-1.5 min-w-[170px]">
				<p className="text-muted-foreground/60 font-bold uppercase tracking-wider text-[9px]">{label}</p>
				<div className="flex items-center justify-between gap-4">
					<span className="text-foreground font-semibold flex items-center gap-1.5">
						<span className="h-2 w-2 rounded-full bg-expense shrink-0" />
						{language === "id" ? "Pengeluaran" : "Expenses"}
					</span>
					<span className="font-mono font-bold text-expense tabular-nums">
						{formatIDR(val)}
					</span>
				</div>
				{comparisonText && (
					<p className={`text-[10px] text-right font-mono ${comparisonColor}`}>
						{comparisonText}
					</p>
				)}
			</div>
		);
	}
	return null;
}

export function ExpensesClient({
	transactions,
	monthlyTrend,
	categoryBreakdown,
	currentMonthTotal,
	monthlyDelta,
	averageMonthly,
	maxExpenseCategory,
}: Props) {
	const { language } = useLanguage();
	const [chartType, setChartType] = useState<"trend" | "cumulative">("trend");
	const [visType, setVisType] = useState<"area" | "line" | "bar">("area");
	const [expenseGoal, setExpenseGoal] = useState<number>(() => {
		// Default goal/budget: average monthly or 15 million if zero
		return averageMonthly > 0 ? Math.round(averageMonthly) : 15000000;
	});

	const hasTrend = monthlyTrend.length > 0 && monthlyTrend.some((t) => t.amount > 0);

	// Calculate cumulative trend data
	let runningSum = 0;
	const cumulativeTrend = monthlyTrend.map((item) => {
		runningSum += item.amount;
		return {
			month: item.month,
			amount: runningSum,
		};
	});

	const activeChartData = chartType === "trend" ? monthlyTrend : cumulativeTrend;

	// Goal projections calculations
	const goalProgressPercent = expenseGoal > 0 ? Math.min((currentMonthTotal / expenseGoal) * 100, 100) : 0;
	const remainingToGoal = Math.max(0, expenseGoal - currentMonthTotal);
	const isGoalExceeded = currentMonthTotal > expenseGoal;

	return (
		<div className="relative animate-fade-in-up space-y-8">
			{/* Ambient glow mesh background */}
			<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-expense/5 blur-[140px]" />
				<div className="absolute top-80 right-0 h-96 w-96 rounded-full bg-amber-500/5 blur-[140px]" />
			</div>

			{/* ──────────────── Header Section ──────────────── */}
			<header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 px-1">
				<div className="space-y-2">
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest text-expense bg-expense/10 border border-expense/20 uppercase">
						<Sparkles size={10} />
						{language === "id" ? "Analisis Pengeluaran Premium" : "Premium Expenses Analysis"}
					</div>
					<h1 className="text-2xl lg:text-[2rem] font-black tracking-tight text-foreground">
						{language === "id" ? "Analisis Pengeluaran" : "Expenses Analysis"}
					</h1>
					<p className="text-xs lg:text-sm text-muted-foreground/60 max-w-xl">
						{language === "id"
							? "Analisa grafik pengeluaran bulanan secara kumulatif, pantau batas anggaran belanja, dan awasi distribusi kategori pengeluaran Anda."
							: "Analyze monthly cumulative expenses, monitor budget limits, and track spending category distributions."}
					</p>
				</div>

				{/* High-end Value Hero Display */}
				<Card className="relative overflow-hidden p-5 lg:p-6 min-w-[280px] lg:text-right flex flex-row lg:flex-col items-center justify-between lg:justify-start hover:border-accent/30 transition-all gap-0">
					<div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-expense/5 blur-[30px]" />
					<div>
						<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
							{language === "id" ? "Pengeluaran Bulan Ini" : "This Month's Expenses"}
						</p>
						<p className="font-mono tabular-nums text-2xl lg:text-3xl font-black text-foreground mt-1">
							{formatIDR(currentMonthTotal)}
						</p>
					</div>
					<div className="lg:mt-2 lg:flex lg:justify-end">
						<DeltaPill delta={monthlyDelta} />
					</div>
				</Card>
			</header>

			{/* ──────────────── KPI Grid Section ──────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<KPIStatCard
					title={language === "id" ? "Rata-Rata Bulanan" : "Monthly Average"}
					value={formatIDR(averageMonthly)}
					subText={language === "id" ? "Rata-rata belanja per bulan" : "Average spending per month"}
					icon={<Calendar size={18} />}
					colorClass="text-blue-400"
					bgClass="bg-blue-500/10 border-blue-500/20"
					description={language === "id" ? "Tolak ukur pengeluaran bulanan aktif" : "Benchmark of active monthly spending"}
				/>
				<KPIStatCard
					title={language === "id" ? "Kategori Tertinggi" : "Top Category"}
					value={maxExpenseCategory ? formatIDR(maxExpenseCategory.amount) : "Rp 0"}
					subText={maxExpenseCategory?.name}
					icon={<Award size={18} />}
					colorClass="text-amber-400"
					bgClass="bg-amber-500/10 border-amber-500/20"
					description={language === "id" ? "Kategori pengeluaran terbesar dicatat" : "Highest spending category recorded"}
				/>
			</div>

			{/* ──────────────── Main Analytics Content ──────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				
				{/* LEFT: Monthly Trend Area Chart + Budget Tracker */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* Chart Panel */}
					<Card className="p-6 space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<h3 className="text-sm font-bold text-foreground">
									{language === "id" ? "Tren & Akumulasi Pengeluaran" : "Expense Trends & Accumulation"}
								</h3>
								<p className="text-[11px] text-muted-foreground/50 mt-0.5">
									{language === "id" ? "Analisis performa riil vs kurva pengeluaran kumulatif" : "Performance analysis of real vs cumulative spending curves"}
								</p>
							</div>

							{/* Chart Type Toggle Switcher */}
							<div className="flex flex-wrap gap-2 self-start">
								{/* Trend Mode */}
								<div className="flex bg-white/[0.02] p-1 border border-border/30 rounded-xl">
									<button
										onClick={() => setChartType("trend")}
										className={cn(
											"text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
											chartType === "trend"
												? "bg-white/[0.06] text-foreground shadow-sm"
												: "text-muted-foreground/50 hover:text-foreground"
										)}
									>
										{language === "id" ? "Tren Bulanan" : "Monthly Trend"}
									</button>
									<button
										onClick={() => setChartType("cumulative")}
										className={cn(
											"text-[10px] font-bold px-3 py-1.5 rounded-lg transition-all",
											chartType === "cumulative"
												? "bg-white/[0.06] text-foreground shadow-sm"
												: "text-muted-foreground/50 hover:text-foreground"
										)}
									>
										{language === "id" ? "Akumulasi" : "Cumulative"}
									</button>
								</div>

								{/* Vis Mode */}
								<div className="flex bg-white/[0.02] p-1 border border-border/30 rounded-xl">
									{(["area", "line", "bar"] as const).map((type) => (
										<button
											key={type}
											onClick={() => setVisType(type)}
											className={cn(
												"text-[10px] font-bold px-2.5 py-1.5 rounded-lg transition-all capitalize",
												visType === type
													? "bg-white/[0.06] text-foreground shadow-sm"
													: "text-muted-foreground/50 hover:text-foreground"
											)}
										>
											{type === "area" ? (language === "id" ? "Area" : "Area") : type === "line" ? (language === "id" ? "Garis" : "Line") : (language === "id" ? "Batang" : "Bar")}
										</button>
									))}
								</div>
							</div>
						</div>

						<div className="h-72">
							{!hasTrend ? (
								<EmptyState
									icon={LucideLineChart}
									title={language === "id" ? "Data tidak mencukupi" : "Insufficient data"}
									description={
										language === "id"
											? "Tambahkan transaksi pengeluaran untuk melihat visualisasi tren."
											: "Add expense transactions to see the trend visualization."
									}
								/>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									{visType === "area" ? (
										<AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
											<defs>
												<linearGradient id="expenseAreaGlow" x1="0" y1="0" x2="0" y2="1">
													<stop offset="0%" stopColor="var(--expense)" stopOpacity={0.25} />
													<stop offset="100%" stopColor="var(--expense)" stopOpacity={0} />
												</linearGradient>
											</defs>
											<CartesianGrid stroke="var(--border)" strokeOpacity={0.15} vertical={false} />
											<XAxis
												dataKey="month"
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												dy={10}
												minTickGap={30}
											/>
											<YAxis
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												width={75}
												tickFormatter={(v: number) => formatIDR(v, { compact: true })}
											/>
											<Tooltip content={<CustomTooltip activeChartData={activeChartData} />} cursor={{ stroke: "var(--expense)", strokeWidth: 1.5, opacity: 0.15 }} />
											<Area
												type="monotone"
												dataKey="amount"
												stroke="var(--expense)"
												strokeWidth={2}
												fill="url(#expenseAreaGlow)"
												activeDot={{ r: 5, fill: "var(--expense)", stroke: "var(--card-bg)", strokeWidth: 2.5 }}
											/>
										</AreaChart>
									) : visType === "line" ? (
										<LineChart data={activeChartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
											<CartesianGrid stroke="var(--border)" strokeOpacity={0.15} vertical={false} />
											<XAxis
												dataKey="month"
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												dy={10}
												minTickGap={30}
											/>
											<YAxis
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												width={75}
												tickFormatter={(v: number) => formatIDR(v, { compact: true })}
											/>
											<Tooltip content={<CustomTooltip activeChartData={activeChartData} />} cursor={{ stroke: "var(--expense)", strokeWidth: 1.5, opacity: 0.15 }} />
											<Line
												type="monotone"
												dataKey="amount"
												stroke="var(--expense)"
												strokeWidth={2.5}
												dot={{ r: 3, fill: "var(--expense)", strokeWidth: 0 }}
												activeDot={{ r: 5, fill: "var(--expense)", stroke: "var(--card-bg)", strokeWidth: 2.5 }}
											/>
										</LineChart>
									) : (
										<BarChart data={activeChartData} margin={{ top: 10, right: 10, left: 15, bottom: 0 }}>
											<CartesianGrid stroke="var(--border)" strokeOpacity={0.15} vertical={false} />
											<XAxis
												dataKey="month"
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												dy={10}
												minTickGap={30}
											/>
											<YAxis
												stroke="var(--foreground)"
												strokeOpacity={0.4}
												fontSize={11}
												tickLine={false}
												axisLine={false}
												width={75}
												tickFormatter={(v: number) => formatIDR(v, { compact: true })}
											/>
											<Tooltip content={<CustomTooltip activeChartData={activeChartData} />} cursor={{ fill: "var(--expense)", opacity: 0.05 }} />
											<Bar
												dataKey="amount"
												fill="var(--expense)"
												radius={[4, 4, 0, 0]}
												maxBarSize={40}
											/>
										</BarChart>
									)}
								</ResponsiveContainer>
							)}
						</div>
					</Card>

					{/* Goal Target Planner Widget */}
					<Card className="p-6 space-y-5 relative overflow-hidden">
						<div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-expense/5 blur-[40px] pointer-events-none" />
						
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="h-8 w-8 rounded-lg bg-expense/10 border border-expense/20 text-expense flex items-center justify-center shrink-0">
									<Target size={16} />
								</div>
								<div>
									<h3 className="text-sm font-bold text-foreground">
										{language === "id" ? "Batas Anggaran Bulanan" : "Monthly Budget Limit"}
									</h3>
									<p className="text-[11px] text-muted-foreground/50">
										{language === "id" ? "Atur & awasi batas maksimal belanja bulanan Anda" : "Set & monitor your maximum monthly spending"}
									</p>
								</div>
							</div>

							{/* Goal Slider / Input Group */}
							<div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5 self-start">
								<span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
									{language === "id" ? "BATAS:" : "LIMIT:"}
								</span>
								<input
									type="number"
									value={expenseGoal}
									onChange={(e) => setExpenseGoal(Math.max(0, Number(e.target.value)))}
									className="bg-transparent text-xs font-bold text-foreground font-mono focus:outline-none w-28 text-right border-0 p-0"
								/>
							</div>
						</div>

						{/* Progress Bar & Status */}
						<div className="space-y-3">
							<div className="flex items-center justify-between text-xs font-mono">
								<span className="text-muted-foreground/50">
									{language === "id" ? "Penggunaan Anggaran" : "Budget Usage"}
								</span>
								<span className={cn("font-bold", isGoalExceeded ? "text-expense" : "text-amber-400")}>{goalProgressPercent.toFixed(1)}%</span>
							</div>
							
							<div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.02]">
								<div
									className="h-full bg-progress rounded-full transition-all duration-500 ease-out shadow-lg"
									style={{
										width: `${goalProgressPercent}%`,
										boxShadow: `0 0 10px ${getComputedStyle(document.documentElement).getPropertyValue('--progress')}66`,
									}}
								/>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 text-[11px]">
								<span className="text-muted-foreground/60 font-medium">
									{isGoalExceeded ? (
										<span className="text-expense font-semibold flex items-center gap-1">
											<AlertCircle size={11} /> {language === "id" ? "Anggaran terlampaui! Kurangi pengeluaran non-esensial untuk menjaga arus kas." : "Budget exceeded! Reduce non-essential spending to maintain cash flow."}
										</span>
									) : (
										language === "id"
											? `Tersisa sisa batas anggaran sebesar ${formatIDR(remainingToGoal)}`
											: `Remaining budget limit is ${formatIDR(remainingToGoal)}`
									)}
								</span>
								<span className="text-muted-foreground/40 font-mono text-[10px] uppercase">
									{language === "id" ? "Batas:" : "Limit:"} {formatIDR(expenseGoal)}
								</span>
							</div>
						</div>
					</Card>

				</div>

				{/* RIGHT: Top Source Categories breakdown */}
				<Card className="p-6 flex flex-col space-y-6">
					<div>
						<h3 className="text-sm font-bold text-foreground">
							{language === "id" ? "Distribusi Kategori" : "Category Distribution"}
						</h3>
						<p className="text-[11px] text-muted-foreground/50 mt-0.5">
							{language === "id" ? "Proporsi pembagian alokasi belanja Anda" : "Proportion of your spending allocation"}
						</p>
					</div>

					{categoryBreakdown.length === 0 ? (
						<EmptyState
							icon={Inbox}
							title={language === "id" ? "Belum ada data" : "No data available"}
							description={
								language === "id"
									? "Breakdown kategori akan tampil setelah Anda mencatat transaksi."
									: "Category breakdown will appear after you record transactions."
							}
							size="sm"
						/>
					) : (
						<ul className="flex-1 space-y-4">
							{categoryBreakdown.slice(0, 6).map((cat, i) => {
								const color = CATEGORY_COLORS[i % CATEGORY_COLORS.length];
								return (
									<li key={cat.category} className="space-y-1.5">
										<div className="flex items-center justify-between text-xs gap-2">
											<div className="flex items-center gap-2 min-w-0">
												<div
													className="h-6 w-6 rounded-lg flex items-center justify-center shrink-0 text-xs border border-white/[0.06]"
													style={{ backgroundColor: `${color}1A`, color }}
												>
													{cat.icon || "📊"}
												</div>
												<span className="font-semibold text-foreground truncate">{cat.category}</span>
											</div>
											<div className="text-right shrink-0 flex items-center gap-2">
												<span className="font-mono font-bold text-foreground">{formatIDR(cat.amount)}</span>
												<span className="font-mono text-[10px] text-muted-foreground/50 w-7 text-right">{cat.percent.toFixed(0)}%</span>
											</div>
										</div>
										<div className="h-1 bg-white/[0.04] rounded-full overflow-hidden">
											<div
												className="h-full bg-progress rounded-full transition-all duration-500 ease-out shadow-md"
												style={{
													width: `${cat.percent}%`,
													boxShadow: `0 0 8px ${getComputedStyle(document.documentElement).getPropertyValue('--progress')}44`,
												}}
											/>
										</div>
									</li>
								);
							})}
						</ul>
					)}

					{categoryBreakdown.length > 0 && (
						<div className="pt-4 border-t border-white/[0.04]">
							<Link
								to="/transactions?type=expense"
								className="group flex items-center justify-center gap-1.5 text-xs text-accent hover:underline font-semibold w-full text-center"
							>
								{language === "id" ? "Lihat Seluruh Transaksi Pengeluaran" : "View All Expense Transactions"}
								<ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
							</Link>
						</div>
					)}
				</Card>
			</div>

			{/* ──────────────── Bottom Section: Audit Log ──────────────── */}
			{transactions.length > 0 && (
				<Card className="p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-bold text-foreground">
								{language === "id" ? "Riwayat Pengeluaran Terbaru" : "Recent Expenses"}
							</h3>
							<p className="text-[11px] text-muted-foreground/50 mt-0.5">
								{language === "id" ? "Catatan transaksi belanja terakhir" : "Latest spending transactions"}
							</p>
						</div>
						<Link
							to="/transactions?type=expense"
							className="text-xs font-semibold text-accent hover:underline"
						>
							{language === "id" ? "Lihat Semua" : "View All"}
						</Link>
					</div>

					<div className="divide-y divide-white/[0.04]">
						{transactions.slice(0, 5).map((tx) => (
							<div
								key={tx.id}
								className="flex items-center justify-between gap-4 py-3.5 hover:bg-white/[0.01] transition-colors rounded-lg px-2 -mx-2"
							>
								<div className="flex items-center gap-3.5 min-w-0 flex-1">
									<div className="h-9 w-9 rounded-xl bg-expense/10 border border-expense/20 text-expense flex items-center justify-center shrink-0 text-sm">
										{tx.categoryIcon || "📊"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[13px] text-foreground font-semibold truncate">
											{tx.description || tx.categoryName || (language === "id" ? "Pengeluaran" : "Expenses")}
										</p>
										<p className="text-[11px] text-muted-foreground/50 mt-0.5 font-medium">
											{formatDateShort(tx.date, language)} · {tx.accountName}
										</p>
									</div>
								</div>
								
								<div className="shrink-0 flex items-center gap-3">
									<span className="hidden sm:inline-flex px-2 py-0.5 rounded text-[10px] font-bold border bg-white/[0.03] border-white/[0.08] text-muted-foreground/60">
										{tx.categoryName || (language === "id" ? "Tanpa Kategori" : "Uncategorized")}
									</span>
									<span className="text-[13px] font-bold font-mono tabular-nums text-expense bg-expense/10 border border-expense/20 px-2.5 py-1 rounded-lg">
										-{formatIDR(tx.amount)}
									</span>
								</div>
							</div>
						))}
					</div>
				</Card>
			)}
		</div>
	);
}

function DeltaPill({ delta }: { delta?: number }) {
	if (delta === undefined || delta === 0) return null;
	const up = delta > 0;
	const Icon = up ? TrendingUp : TrendingDown;
	// Untuk pengeluaran: naik = buruk (merah), turun = baik (hijau)
	const cls = up ? "text-expense bg-expense/10 border-expense/25" : "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25";
	return (
		<span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${cls}`}>
			<Icon size={12} />
			{up ? "+" : ""}
			{(delta * 100).toFixed(1)}%
		</span>
	);
}

function KPIStatCard({
	title,
	value,
	subText,
	icon,
	colorClass,
	bgClass,
	description,
}: {
	title: string;
	value: string;
	subText?: string;
	icon: React.ReactNode;
	colorClass: string;
	bgClass: string;
	description: string;
}) {
	return (
		<Card className="relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 group gap-0">
			<div className="flex justify-between items-start">
				<div className="space-y-1">
					<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50 transition-colors group-hover:text-foreground/80">
						{title}
					</p>
					<p className="font-mono tabular-nums text-lg font-black text-foreground mt-1 tracking-tight">
						{value}
					</p>
					{subText && (
						<p className="text-[11px] text-muted-foreground/60 truncate max-w-[170px] mt-0.5 font-medium">
							{subText}
						</p>
					)}
				</div>
				<div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 border ${colorClass} ${bgClass}`}>
					{icon}
				</div>
			</div>
			
			<div className="mt-4 pt-3 border-t border-white/[0.04]">
				<p className="text-[10px] text-muted-foreground/40 font-medium">{description}</p>
			</div>
		</Card>
	);
}