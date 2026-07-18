import { useState } from "react";
import {
	Calendar,
	Mail,
	Receipt,
	ShieldCheck,
	User,
	Lock,
	CheckCircle2,
	ChevronRight,
	Activity,
	Wallet,
	ArrowUpRight,
} from "lucide-react";
import { Link } from "react-router-dom";

import { useApp } from "@/components/layout/AppLayout";
import { normalizeImageUrl } from "@/lib/api";
import { formatDate, formatIDR } from "@/lib/utils/formatters";
import { EditProfileModal } from "@/components/profile/EditProfileModal";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function Profile() {
	const { language } = useLanguage();
	const { user, counts, accounts } = useApp();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	if (!user) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<Card className="relative max-w-md p-8 text-center border border-border bg-card rounded-xl">
					<User size={48} className="mx-auto mb-4 text-muted-foreground" />
					<p className="mb-2 text-base font-bold text-foreground">
						{language === "id" ? "Profil tidak ditemukan" : "Profile not found"}
					</p>
					<p className="text-sm text-muted-foreground">
						{language === "id"
							? "Silakan login kembali untuk melihat profil Anda."
							: "Please login again to view your profile."}
					</p>
				</Card>
			</div>
		);
	}

	const userInitials = user.name
		? user.name
				.split(" ")
				.map((n) => n[0])
				.join("")
				.toUpperCase()
				.slice(0, 2)
		: "U";

	const signupDate = user.createdAt || new Date().toISOString();

	const activeAccountsList = accounts.filter((a) => a.isActive);
	const inactiveAccountsCount = accounts.length - activeAccountsList.length;

	const totalBalance = activeAccountsList.reduce((sum, a) => sum + a.balance, 0);
	const activityRate =
		accounts.length > 0
			? Math.round((activeAccountsList.length / accounts.length) * 100)
			: 0;

	const bankAccounts = activeAccountsList.filter((a) => a.type === "bank");
	const walletAccounts = activeAccountsList.filter((a) => a.type === "wallet");
	const cashAccounts = activeAccountsList.filter((a) => a.type === "cash");
	const investmentAccounts = activeAccountsList.filter(
		(a) => a.type === "investment",
	);

	return (
		<div className="mx-auto max-w-6xl space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
				<div>
					<h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
						{language === "id" ? "Profil Akun" : "Account Profile"}
					</h1>
					<p className="text-sm text-muted-foreground/80 mt-1.5">
						{language === "id"
							? "Ringkasan identitas, struktur portofolio, aktivitas pencatatan, dan keamanan data Anda."
							: "Overview of your identity, portfolio structure, logging activity, and data security."}
					</p>
				</div>
				<Button
					onClick={() => setIsEditModalOpen(true)}
					className="h-9 rounded-xl gap-2 text-xs font-semibold px-4 shrink-0"
				>
					{language === "id" ? "Edit Profil" : "Edit Profile"}
				</Button>
			</div>

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
				{/* Left profile rail */}
				<aside className="space-y-6">
					<Card className="p-6 space-y-6 rounded-xl border border-border bg-card">
						<div className="flex flex-col items-center text-center space-y-4">
							{/* Avatar */}
							<div className="relative flex aspect-square w-24 h-24 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-muted">
								{user.image ? (
									<img
										src={normalizeImageUrl(user.image) ?? ""}
										alt={user.name ?? "Avatar"}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-accent/10 text-accent font-semibold text-2xl">
										{userInitials}
									</div>
								)}
							</div>

							<div className="space-y-1 w-full">
								<h2 className="truncate text-lg font-bold text-foreground">
									{user.name ?? (language === "id" ? "Pengguna" : "User")}
								</h2>
								<p className="flex items-center justify-center gap-1.5 truncate text-xs text-muted-foreground">
									<Mail size={13} className="shrink-0" />
									<span className="truncate">{user.email}</span>
								</p>
							</div>

							<div className="inline-flex items-center gap-1.5 rounded-full bg-income/10 border border-income/20 px-2.5 py-0.5 text-xs font-semibold text-income">
								<ShieldCheck size={13} />
								{language === "id" ? "Terverifikasi" : "Verified"}
							</div>
						</div>

						<div className="space-y-3.5 border-t border-border pt-4 text-xs">
							<ProfileMeta
								icon={<Calendar size={14} className="text-muted-foreground" />}
								label={language === "id" ? "Mendaftar" : "Registered"}
								value={formatDate(signupDate, language)}
							/>
							<ProfileMeta
								icon={<Activity size={14} className="text-muted-foreground" />}
								label="Status"
								value={
									<span className="flex items-center gap-1.5 text-income font-semibold">
										<span className="h-1.5 w-1.5 rounded-full bg-income" />
										{language === "id" ? "Aktif" : "Active"}
									</span>
								}
							/>
							<ProfileMeta
								icon={<Lock size={14} className="text-muted-foreground" />}
								label={language === "id" ? "Enkripsi" : "Encryption"}
								value="AES-256"
							/>
						</div>
					</Card>

					{/* Active portfolio mini widget */}
					<Card className="p-5 space-y-4 rounded-xl border border-border bg-card">
						<div className="flex items-center justify-between">
							<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								{language === "id" ? "Portofolio Aktif" : "Active Portfolio"}
							</span>
							<span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-lg">
								{activeAccountsList.length}/{accounts.length || 0}
							</span>
						</div>

						<div className="space-y-4">
							<div>
								<p className="text-xl font-bold font-mono tabular-nums text-foreground">
									{formatIDR(totalBalance)}
								</p>
								<p className="mt-1 text-xs text-muted-foreground">
									{language === "id"
										? `Estimasi nilai bersih dari ${activeAccountsList.length} akun aktif.`
										: `Estimated net worth across ${activeAccountsList.length} active accounts.`}
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
									<span>Activity rate</span>
									<span className="text-foreground">{activityRate}%</span>
								</div>

								<div className="h-2 overflow-hidden bg-muted border border-border rounded-full p-0.5">
									<div
										className="h-full bg-accent rounded-full transition-all"
										style={{ width: `${activityRate}%` }}
									/>
								</div>
							</div>
						</div>
					</Card>
				</aside>

				{/* Main content */}
				<main className="space-y-6">
					<section className="space-y-4">
						<div className="flex flex-col">
							<h2 className="text-base font-bold text-foreground">
								{language === "id" ? "Struktur Rekening & E-Wallet" : "Account & E-Wallet Structure"}
							</h2>
							<p className="text-xs text-muted-foreground/80">
								{language === "id"
									? "Distribusi penyimpanan aset finansial terdaftar Anda."
									: "Distribution of your registered financial assets."}
							</p>
						</div>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<PortfolioSegmentCard
								label={language === "id" ? "Bank" : "Bank"}
								count={bankAccounts.length}
								total={bankAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-blue-500"
							/>
							<PortfolioSegmentCard
								label={language === "id" ? "E-Wallet" : "E-Wallet"}
								count={walletAccounts.length}
								total={walletAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-amber-500"
							/>
							<PortfolioSegmentCard
								label={language === "id" ? "Tunai" : "Cash"}
								count={cashAccounts.length}
								total={cashAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-income"
							/>
							<PortfolioSegmentCard
								label={language === "id" ? "Investasi" : "Investments"}
								count={investmentAccounts.length}
								total={investmentAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-purple-500"
							/>
						</div>

						{inactiveAccountsCount > 0 && (
							<div className="mt-4 flex items-center justify-between border border-warning/20 bg-warning/5 p-4 text-sm rounded-xl">
								<span className="flex items-center gap-2 font-medium text-warning text-xs">
									<span className="h-2 w-2 rounded-full bg-warning animate-pulse" />
									{language === "id"
										? `${inactiveAccountsCount} rekening sedang dinonaktifkan sementara.`
										: `${inactiveAccountsCount} accounts are currently disabled.`}
								</span>

								<Link
									to="/accounts"
									className="flex shrink-0 items-center gap-0.5 font-semibold text-accent hover:underline text-xs"
								>
									{language === "id" ? "Kelola" : "Manage"}
									<ChevronRight size={14} />
								</Link>
							</div>
						)}
					</section>

					{/* Metrics Card */}
					<Card className="rounded-xl border border-border bg-card">
						<div className="flex items-center justify-between border-b border-border/30 p-4">
							<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Metrics
							</span>
							<span className="text-[9px] font-bold text-accent bg-accent/10 border border-accent/20 px-2 py-0.5 rounded">
								LIVE
							</span>
						</div>

						<div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
							<MetricCard
								icon={<Receipt size={18} />}
								label={language === "id" ? "Catatan Transaksi" : "Transaction Records"}
								value={counts.transactions}
								description={
									language === "id"
										? "Total baris data riwayat transaksi tersimpan di server lokal Anda."
										: "Total rows of transaction history data saved on your local server."
								}
								tone="accent"
							/>

							<MetricCard
								icon={<Wallet size={18} />}
								label={language === "id" ? "Konektivitas Aset" : "Asset Connectivity"}
								value={accounts.length}
								description={
									language === "id"
										? "Akun keuangan terintegrasi dalam sistem dashboard saat ini."
										: "Financial accounts currently integrated into your dashboard."
								}
								tone="income"
							/>
						</div>
					</Card>

					{/* Security Card */}
					<Card className="rounded-xl border border-border bg-card">
						<div className="flex items-center justify-between border-b border-border/30 p-4">
							<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Security
							</span>
							<Link
								to="/settings"
								className="flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
							>
								{language === "id" ? "Pengaturan" : "Settings"}
								<ArrowUpRight size={13} />
							</Link>
						</div>

						<div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2">
							<div className="space-y-3">
								<SecurityPoint text={language === "id" ? "Data terenkripsi penuh menggunakan AES-256 pada database lokal." : "Data fully encrypted using AES-256 in local database."} />
								<SecurityPoint text={language === "id" ? "Autentikasi sesi menggunakan token JWT aman." : "Session authentication using secure JWT tokens."} />
							</div>

							<div className="space-y-3">
								<SecurityPoint text={language === "id" ? "Akses pihak ketiga ditolak secara default kecuali token API dibuat." : "Third-party access denied by default unless API tokens are generated."} />

								<Link
									to="/settings"
									className="ml-6 flex w-fit items-center gap-0.5 text-xs font-bold text-accent hover:underline"
								>
									{language === "id" ? "Buka Pengaturan API" : "Open API Settings"}
									<ChevronRight size={12} />
								</Link>
							</div>
						</div>
					</Card>

					{/* Recent Activity Card */}
					<Card className="rounded-xl border border-border bg-card">
						<div className="flex items-center justify-between border-b border-border/30 p-4">
							<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
								Audit
							</span>
							<span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded">
								TX-{counts.transactions}
							</span>
						</div>

						<div className="divide-y divide-border/40">
							<ProfileActivityItem
								index="01"
								icon={<User size={14} />}
								title={language === "id" ? "Profil akun dimuat" : "Account profile loaded"}
								description={
									language === "id"
										? "Identitas dan konfigurasi akun berhasil dibaca dari sesi aktif."
										: "Account identity and configuration successfully retrieved from active session."
								}
								time={language === "id" ? "Sekarang" : "Now"}
							/>
							<ProfileActivityItem
								index="02"
								icon={<Wallet size={14} />}
								title={language === "id" ? "Portofolio tersinkron" : "Portfolio synchronized"}
								description={
									language === "id"
										? `${activeAccountsList.length} akun aktif tersedia untuk kalkulasi nilai bersih.`
										: `${activeAccountsList.length} active accounts available for net worth calculation.`
								}
								time="Realtime"
							/>
							<ProfileActivityItem
								index="03"
								icon={<Receipt size={14} />}
								title={language === "id" ? "Transaksi tersedia" : "Transactions available"}
								description={
									language === "id"
										? `${counts.transactions} catatan transaksi tersimpan di sistem.`
										: `${counts.transactions} transaction records stored in system.`
								}
								time="Realtime"
							/>
						</div>
					</Card>
				</main>
			</div>

			<EditProfileModal
				open={isEditModalOpen}
				onClose={() => setIsEditModalOpen(false)}
				user={user}
			/>
		</div>
	);
}

function PortfolioSegmentCard({
	label,
	count,
	total,
	accentClass,
}: {
	label: string;
	count: number;
	total: number;
	accentClass: string;
}) {
	const { language } = useLanguage();
	return (
		<Card className="p-5 rounded-xl border border-border bg-card">
			<div className="mb-4 flex items-center justify-between">
				<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
					{label}
				</span>
				<span className={`h-2.5 w-2.5 rounded-full ${accentClass}`} />
			</div>

			<p className="truncate font-mono text-xl font-bold tabular-nums text-foreground">
				{formatIDR(total)}
			</p>
			<p className="mt-1.5 text-xs text-muted-foreground">
				{count} {language === "id" ? "rekening aktif" : "active accounts"}
			</p>
		</Card>
	);
}

function MetricCard({
	icon,
	label,
	value,
	description,
	tone,
}: {
	icon: React.ReactNode;
	label: string;
	value: number;
	description: string;
	tone: "accent" | "income";
}) {
	const toneClass = tone === "income" ? "text-income bg-income/10 border-income/20" : "text-accent bg-accent/10 border-accent/20";

	return (
		<Card className="p-5 rounded-xl border border-border bg-surface flex flex-col justify-between">
			<div className="flex items-center gap-2 mb-4">
				<div className={`p-1.5 rounded-lg border ${toneClass}`}>
					{icon}
				</div>
				<span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
					{label}
				</span>
			</div>

			<p className="font-mono text-3xl font-bold tabular-nums text-foreground">
				{value}
			</p>
			<p className="mt-2 text-xs leading-relaxed text-muted-foreground">
				{description}
			</p>
		</Card>
	);
}

function ProfileMeta({
	icon,
	label,
	value,
}: {
	icon: React.ReactNode;
	label: string;
	value: React.ReactNode;
}) {
	return (
		<div className="flex items-center justify-between gap-3 text-muted-foreground">
			<span className="flex items-center gap-2">
				{icon}
				{label}
			</span>
			<span className="font-medium text-foreground">{value}</span>
		</div>
	);
}

function SecurityPoint({ text }: { text: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2.5 text-xs leading-relaxed text-muted-foreground">
			<CheckCircle2 size={15} className="mt-0.5 shrink-0 text-income" />
			<span>{text}</span>
		</div>
	);
}

function ProfileActivityItem({
	index,
	icon,
	title,
	description,
	time,
}: {
	index: string;
	icon: React.ReactNode;
	title: string;
	description: string;
	time: string;
}) {
	return (
		<div className="group relative flex items-start gap-4 p-4 transition-colors hover:bg-muted/10">
			<div className="mt-1 flex items-center justify-center p-1.5 rounded-lg bg-muted text-muted-foreground group-hover:text-accent group-hover:bg-accent/10 transition-colors">
				{icon}
			</div>

			<div className="min-w-0 flex-1">
				<p className="text-sm font-semibold text-foreground">
					{title}
				</p>
				<p className="mt-1 text-xs leading-relaxed text-muted-foreground">
					{description}
				</p>
				<p className="mt-2 text-[10px] uppercase font-bold tracking-widest text-muted-foreground/60">
					{time}
				</p>
			</div>

			<span className="text-[10px] font-mono tabular-nums text-muted-foreground/40">
				[{index}]
			</span>
		</div>
	);
}