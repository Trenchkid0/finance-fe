"use client";

import { useState } from "react";
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
import {
	Award,
	Calendar,
	Inbox,
	LineChart,
	TrendingDown,
	TrendingUp,
	ArrowRight,
	Target,
	Sparkles,
} from "lucide-react";

import { formatDateShort, formatIDR } from "@/lib/utils/formatters";
import { EmptyState } from "@/components/ui/empty-state";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

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
	monthlyDelta?: number;
	averageMonthly: number;
	maxIncome: { description: string; amount: number } | null;
}

const CATEGORY_COLORS = [
	"#10B981", // Emerald Green
	"#3B82F6", // Blue
	"#06B6D4", // Cyan
	"#8B5CF6", // Purple
	"#F59E0B", // Amber
	"#EC4899", // Pink
	"#14B8A6", // Teal
	"#6366F1", // Indigo
];

function CustomTooltip({ active, payload, label }: any) {
	const { language } = useLanguage();
	if (active && payload && payload.length) {
		return (
			<div className="rounded-xl border border-white/[0.08] bg-popover/90 backdrop-blur-xl p-3.5 shadow-2xl shadow-black/50 text-xs space-y-1.5 min-w-[150px]">
				<p className="text-muted-foreground/60 font-bold uppercase tracking-wider text-[9px]">{label}</p>
				<div className="flex items-center justify-between gap-4">
					<span className="text-foreground font-semibold flex items-center gap-1.5">
						<span className="h-2 w-2 rounded-full bg-income shrink-0" />
						{language === "id" ? "Nilai" : "Value"}
					</span>
					<span className="font-mono font-bold text-income tabular-nums">
						{formatIDR(payload[0].value)}
					</span>
				</div>
			</div>
		);
	}
	return null;
}

export function IncomeClient({
	transactions,
	monthlyTrend,
	categoryBreakdown,
	currentMonthTotal,
	monthlyDelta,
	averageMonthly,
	maxIncome,
}: Props) {
	const { language } = useLanguage();
	const [chartType, setChartType] = useState<"trend" | "cumulative">("trend");
	const [incomeGoal, setIncomeGoal] = useState<number>(() => {
		// Default goal: average monthly plus 25%, or 20 million if zero
		return averageMonthly > 0 ? Math.round(averageMonthly * 1.25) : 20000000;
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
	const goalProgressPercent = incomeGoal > 0 ? Math.min((currentMonthTotal / incomeGoal) * 100, 100) : 0;
	const remainingToGoal = Math.max(0, incomeGoal - currentMonthTotal);
	const isGoalMet = currentMonthTotal >= incomeGoal;



	return (
		<div className="relative animate-fade-in-up space-y-8">
			{/* Ambient glow mesh background */}
			<div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
				<div className="absolute -top-40 left-1/3 h-96 w-96 rounded-full bg-income/5 blur-[140px]" />
				<div className="absolute top-80 right-0 h-96 w-96 rounded-full bg-blue-500/5 blur-[140px]" />
			</div>

			{/* ──────────────── Header Section ──────────────── */}
			<header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 px-1">
				<div className="space-y-2">
					<div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest text-income bg-income/10 border border-income/20 uppercase">
						<Sparkles size={10} />
						{language === "id" ? "Analisis Pendapatan Premium" : "Premium Income Analysis"}
					</div>
					<h1 className="text-2xl lg:text-[2rem] font-black tracking-tight text-foreground">
						{language === "id" ? "Analisis Pendapatan" : "Income Analytics"}
					</h1>
					<p className="text-xs lg:text-sm text-muted-foreground/60 max-w-xl">
						{language === "id"
							? "Analisa pertumbuhan dana masuk Anda secara kumulatif, atur target bulanan dinamis, dan tinjau proyeksi pendapatan tahunan."
							: "Analyze your cumulative incoming funds growth, set dynamic monthly goals, and review annual projections."}
					</p>
				</div>

				{/* High-end Value Hero Display */}
				<div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 lg:p-6 min-w-[280px] lg:text-right flex items-center justify-between lg:block hover:border-white/[0.1] transition-all">
					<div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-income/5 blur-[30px]" />
					<div>
						<p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/50">
							{language === "id" ? "Pemasukan Bulan Ini" : "This Month's Income"}
						</p>
						<p className="font-mono tabular-nums text-2xl lg:text-3xl font-black text-foreground mt-1">
							{formatIDR(currentMonthTotal)}
						</p>
					</div>
					<div className="lg:mt-2 lg:flex lg:justify-end">
						<DeltaPill delta={monthlyDelta} />
					</div>
				</div>
			</header>

			{/* ──────────────── KPI Grid Section ──────────────── */}
			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<KPIStatCard
					title={language === "id" ? "Rata-Rata Bulanan" : "Monthly Average"}
					value={formatIDR(averageMonthly)}
					subText={language === "id" ? "Rata-rata pemasukan per bulan" : "Average income per month"}
					icon={<Calendar size={18} />}
					colorClass="text-blue-400"
					bgClass="bg-blue-500/10 border-blue-500/20"
					description={language === "id" ? "Tolak ukur performa bulanan aktif" : "Benchmark of active monthly performance"}
				/>
				<KPIStatCard
					title={language === "id" ? "Sumber Terbesar" : "Top Source"}
					value={maxIncome ? formatIDR(maxIncome.amount) : "Rp 0"}
					subText={maxIncome?.description}
					icon={<Award size={18} />}
					colorClass="text-amber-400"
					bgClass="bg-amber-500/10 border-amber-500/20"
					description={language === "id" ? "Nilai transaksi masuk tertinggi" : "Highest incoming transaction value"}
				/>
			</div>

			{/* ──────────────── Main Analytics Content ──────────────── */}
			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
				
				{/* LEFT: Monthly Trend Area Chart + Goal Tracker */}
				<div className="lg:col-span-2 space-y-6">
					
					{/* Chart Panel */}
					<section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-6">
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div>
								<h3 className="text-sm font-bold text-foreground">
									{language === "id" ? "Tren & Akumulasi Pemasukan" : "Income Trends & Accumulation"}
								</h3>
								<p className="text-[11px] text-muted-foreground/50 mt-0.5">
									{language === "id" ? "Analisis performa riil vs kurva pertumbuhan kumulatif" : "Performance analysis of real vs cumulative growth curves"}
								</p>
							</div>

							{/* Chart Type Toggle Switcher */}
							<div className="flex bg-white/[0.02] p-1 border border-white/[0.06] rounded-xl self-start">
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
									{language === "id" ? "Akumulasi Kumulatif" : "Cumulative Income"}
								</button>
							</div>
						</div>

						<div className="h-72">
							{!hasTrend ? (
								<EmptyState
									icon={LineChart}
									title={language === "id" ? "Data tidak mencukupi" : "Insufficient data"}
									description={
										language === "id"
											? "Tambahkan transaksi pemasukan untuk melihat visualisasi tren."
											: "Add income transactions to see the trend visualization."
									}
								/>
							) : (
								<ResponsiveContainer width="100%" height="100%">
									<AreaChart data={activeChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
										<defs>
											<linearGradient id="incomeAreaGlow" x1="0" y1="0" x2="0" y2="1">
												<stop offset="0%" stopColor="#10B981" stopOpacity={0.25} />
												<stop offset="100%" stopColor="#10B981" stopOpacity={0} />
											</linearGradient>
										</defs>
										<CartesianGrid stroke="#ffffff" strokeOpacity={0.03} vertical={false} />
										<XAxis
											dataKey="month"
											stroke="#9CA3AF"
											strokeOpacity={0.4}
											fontSize={11}
											tickLine={false}
											axisLine={false}
											dy={10}
										/>
										<YAxis
											stroke="#9CA3AF"
											strokeOpacity={0.4}
											fontSize={11}
											tickLine={false}
											axisLine={false}
											width={65}
											tickFormatter={(v: number) => formatIDR(v, { compact: true })}
										/>
										<Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(16,185,129,0.15)", strokeWidth: 1.5 }} />
										<Area
											type="monotone"
											dataKey="amount"
											stroke="#10B981"
											strokeWidth={2}
											fill="url(#incomeAreaGlow)"
											activeDot={{ r: 5, fill: "#10B981", stroke: "#0D1117", strokeWidth: 2.5 }}
										/>
									</AreaChart>
								</ResponsiveContainer>
							)}
						</div>
					</section>

					{/* NEW Goal Target Planner Widget */}
					<section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-5 relative overflow-hidden">
						<div className="absolute -bottom-12 -left-12 h-36 w-36 rounded-full bg-income/5 blur-[40px] pointer-events-none" />
						
						<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
							<div className="flex items-center gap-3">
								<div className="h-8 w-8 rounded-lg bg-income/10 border border-income/20 text-income flex items-center justify-center shrink-0">
									<Target size={16} />
								</div>
								<div>
									<h3 className="text-sm font-bold text-foreground">
										{language === "id" ? "Target Planner Bulanan" : "Monthly Goal Planner"}
									</h3>
									<p className="text-[11px] text-muted-foreground/50">
										{language === "id" ? "Atur & pantau pencapaian gol pemasukan Anda" : "Set & monitor your income goal achievement"}
									</p>
								</div>
							</div>

							{/* Goal Slider / Input Group */}
							<div className="flex items-center gap-2 bg-white/[0.02] border border-white/[0.06] rounded-xl px-3 py-1.5 self-start">
								<span className="text-[10px] font-bold text-muted-foreground/50 uppercase">
									{language === "id" ? "TARGET:" : "GOAL:"}
								</span>
								<input
									type="number"
									value={incomeGoal}
									onChange={(e) => setIncomeGoal(Math.max(0, Number(e.target.value)))}
									className="bg-transparent text-xs font-bold text-foreground font-mono focus:outline-none w-28 text-right border-0 p-0"
								/>
							</div>
						</div>

						{/* Progress Bar & Status */}
						<div className="space-y-3">
							<div className="flex items-center justify-between text-xs font-mono">
								<span className="text-muted-foreground/50">
									{language === "id" ? "Pencapaian Gol" : "Goal Progress"}
								</span>
								<span className="text-income font-bold">{goalProgressPercent.toFixed(1)}%</span>
							</div>
							
							<div className="h-2.5 bg-white/[0.04] rounded-full overflow-hidden p-0.5 border border-white/[0.02]">
								<div
									className="h-full rounded-full bg-gradient-to-r from-income to-emerald-400 transition-all duration-500 ease-out"
									style={{
										width: `${goalProgressPercent}%`,
										boxShadow: "0 0 10px rgba(16,185,129,0.3)",
									}}
								/>
							</div>

							<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-1 text-[11px]">
								<span className="text-muted-foreground/60 font-medium">
									{isGoalMet ? (
										<span className="text-income font-semibold flex items-center gap-1">
											<Sparkles size={11} /> {language === "id" ? "Target Terlampaui! Luar biasa perkembangan Anda bulan ini." : "Goal Exceeded! Outstanding progress this month."}
										</span>
									) : (
										language === "id"
											? `Dibutuhkan ${formatIDR(remainingToGoal)} lagi untuk mencapai gol`
											: `Need another ${formatIDR(remainingToGoal)} to reach goal`
									)}
								</span>
								<span className="text-muted-foreground/40 font-mono text-[10px] uppercase">
									{language === "id" ? "Target:" : "Goal:"} {formatIDR(incomeGoal)}
								</span>
							</div>
						</div>
					</section>

				</div>

				{/* RIGHT: Top Source Categories breakdown */}
				<section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 flex flex-col space-y-6">
					<div>
						<h3 className="text-sm font-bold text-foreground">
							{language === "id" ? "Distribusi Kategori" : "Category Distribution"}
						</h3>
						<p className="text-[11px] text-muted-foreground/50 mt-0.5">
							{language === "id" ? "Proporsi pembagian sumber dana masuk" : "Proportion of incoming fund sources"}
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
													{cat.icon || "💰"}
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
												className="h-full rounded-full transition-all duration-500 ease-out"
												style={{
													width: `${cat.percent}%`,
													backgroundColor: color,
													boxShadow: `0 0 8px ${color}44`,
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
								to="/transactions?type=income"
								className="group flex items-center justify-center gap-1.5 text-xs text-accent hover:underline font-semibold w-full text-center"
							>
								{language === "id" ? "Lihat Seluruh Transaksi Pemasukan" : "View All Income Transactions"}
								<ArrowRight size={12} className="transition-transform duration-200 group-hover:translate-x-0.5" />
							</Link>
						</div>
					)}
				</section>
			</div>

			{/* ──────────────── Bottom Section: Audit Log ──────────────── */}
			{transactions.length > 0 && (
				<section className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 space-y-4">
					<div className="flex items-center justify-between">
						<div>
							<h3 className="text-sm font-bold text-foreground">
								{language === "id" ? "Riwayat Pemasukan Terbaru" : "Recent Income"}
							</h3>
							<p className="text-[11px] text-muted-foreground/50 mt-0.5">
								{language === "id" ? "Catatan transaksi pemasukan terakhir" : "Latest incoming transactions"}
							</p>
						</div>
						<Link
							to="/transactions?type=income"
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
									<div className="h-9 w-9 rounded-xl bg-income/10 border border-income/20 text-income flex items-center justify-center shrink-0 text-sm">
										{tx.categoryIcon || "💰"}
									</div>
									<div className="min-w-0 flex-1">
										<p className="text-[13px] text-foreground font-semibold truncate">
											{tx.description || tx.categoryName || (language === "id" ? "Pemasukan" : "Income")}
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
									<span className="text-[13px] font-bold font-mono tabular-nums text-income bg-income/10 border border-income/20 px-2.5 py-1 rounded-lg">
										+{formatIDR(tx.amount)}
									</span>
								</div>
							</div>
						))}
					</div>
				</section>
			)}
		</div>
	);
}

function DeltaPill({ delta }: { delta?: number }) {
	if (delta === undefined || delta === 0) return null;
	const up = delta > 0;
	const Icon = up ? TrendingUp : TrendingDown;
	const cls = up ? "text-[#10B981] bg-[#10B981]/10 border-[#10B981]/25" : "text-amber-400 bg-amber-400/10 border-amber-400/25";
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
		<div className="relative overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5 transition-all duration-300 hover:border-white/[0.12] hover:bg-white/[0.04] hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(0,0,0,0.3)] group">
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
		</div>
	);
}