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
import {
	CornerMarks,
	ProfileCard,
	ProfileCardHeader,
	ProfileSectionTitle,
	ProfileActivityItem,
} from "@/components/ui/profile-card";

export default function Profile() {
	const { user, counts, accounts } = useApp();
	const [isEditModalOpen, setIsEditModalOpen] = useState(false);

	if (!user) {
		return (
			<div className="flex h-[50vh] items-center justify-center">
				<div className="relative max-w-md border border-border bg-background p-8 text-center">
					<CornerMarks />

					<User size={48} className="mx-auto mb-4 text-text-muted" />

					<p className="mb-2 text-base font-medium text-text-primary">
						Profil tidak ditemukan
					</p>
					<p className="text-sm text-text-muted">
						Silakan login kembali untuk melihat profil Anda.
					</p>
				</div>
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
		<div className="mx-auto max-w-6xl space-y-8">
			<header className="flex flex-col gap-2 border-b border-border pb-5">
				<div className="flex items-center gap-3">
					<span className="font-mono text-sm tracking-[-0.2em] text-text-muted/50">
						//
					</span>
					<p className="font-mono text-xs uppercase tracking-widest text-accent">
						Account Profile
					</p>
				</div>

				<div>
					<h1 className="text-2xl font-semibold tracking-tight text-text-primary lg:text-3xl">
						Profil Akun
					</h1>
					<p className="mt-1 text-sm text-text-muted">
						Ringkasan identitas, struktur portofolio, aktivitas pencatatan,
						dan keamanan data Anda.
					</p>
				</div>
			</header>

			<div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
				{/* Left profile rail */}
				<aside className="space-y-6">
					<div className="space-y-4">
						<div className="group relative shrink-0">
							<div className="relative flex aspect-square w-full items-center justify-center overflow-hidden border border-border bg-muted">
								<CornerMarks size="lg" />

								{user.image ? (
									<img
										src={normalizeImageUrl(user.image) ?? ""}
										alt={user.name ?? "Avatar"}
										className="h-full w-full object-cover"
									/>
								) : (
									<div className="flex h-full w-full items-center justify-center bg-elevated">
										<div className="flex h-24 w-24 items-center justify-center border border-border bg-background font-mono text-3xl font-semibold text-accent">
											{userInitials}
										</div>
									</div>
								)}

								<div className="pointer-events-none absolute inset-0 h-10 bg-gradient-to-b from-transparent via-accent/10 to-transparent opacity-0 transition-opacity group-hover:opacity-100" />
							</div>
						</div>

						<div className="space-y-4">
							<div>
								<h2 className="truncate text-xl font-semibold text-text-primary">
									{user.name ?? "Pengguna"}
								</h2>
								<p className="mt-1 flex items-center gap-2 truncate font-mono text-xs text-text-muted">
									<Mail size={14} className="shrink-0" />
									<span className="truncate">{user.email}</span>
								</p>
							</div>

							<button
								type="button"
								onClick={() => setIsEditModalOpen(true)}
								className="block w-full border border-border bg-muted px-4 py-2 text-center text-sm font-medium text-text-primary transition-colors hover:bg-muted/70"
							>
								Edit profile
							</button>

							<div className="inline-flex items-center gap-2 border border-income/30 bg-income/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-income">
								<ShieldCheck size={13} />
								Terverifikasi
							</div>

							<div className="space-y-3 border-t border-border pt-4 text-sm">
								<ProfileMeta
									icon={<Calendar size={15} />}
									label="Mendaftar"
									value={formatDate(signupDate)}
								/>
								<ProfileMeta
									icon={<Activity size={15} />}
									label="Status"
									value={
										<span className="flex items-center gap-1.5 text-income">
											<span className="h-1.5 w-1.5 rounded-full bg-income" />
											Aktif
										</span>
									}
								/>
								<ProfileMeta
									icon={<Lock size={15} />}
									label="Enkripsi"
									value="AES-256"
								/>
							</div>
						</div>
					</div>

					{/* Active portfolio mini widget */}
					<ProfileCard>
						<ProfileCardHeader
							kicker="Portfolio"
							title="Portofolio Aktif"
							actionCode={`${activeAccountsList.length}/${accounts.length || 0}`}
						/>

						<div className="space-y-5 p-4">
							<div>
								<p className="font-mono text-2xl font-semibold tabular-nums text-text-primary">
									{formatIDR(totalBalance)}
								</p>
								<p className="mt-1 text-xs text-text-muted">
									Estimasi nilai bersih dari {activeAccountsList.length} akun
									aktif.
								</p>
							</div>

							<div className="space-y-2">
								<div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-widest">
									<span className="text-text-muted">Activity rate</span>
									<span className="text-text-primary">{activityRate}%</span>
								</div>

								<div className="h-1.5 overflow-hidden bg-muted">
									<div
										className="h-full bg-accent transition-all"
										style={{ width: `${activityRate}%` }}
									/>
								</div>
							</div>
						</div>
					</ProfileCard>
				</aside>

				{/* Main content */}
				<main className="space-y-6">
					<section>
						<ProfileSectionTitle
							title="Struktur Rekening & Wallet"
							description="Distribusi penyimpanan aset finansial terdaftar Anda."
						/>

						<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
							<PortfolioSegmentCard
								label="Bank"
								count={bankAccounts.length}
								total={bankAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-blue-400"
							/>
							<PortfolioSegmentCard
								label="E-Wallet"
								count={walletAccounts.length}
								total={walletAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-amber-400"
							/>
							<PortfolioSegmentCard
								label="Tunai"
								count={cashAccounts.length}
								total={cashAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-income"
							/>
							<PortfolioSegmentCard
								label="Investasi"
								count={investmentAccounts.length}
								total={investmentAccounts.reduce((sum, a) => sum + a.balance, 0)}
								accentClass="bg-purple-400"
							/>
						</div>

						{inactiveAccountsCount > 0 && (
							<div className="mt-4 flex items-center justify-between border border-warning/20 bg-warning/5 p-4 text-sm">
								<span className="flex items-center gap-2 font-medium text-warning">
									<span className="h-2 w-2 rounded-full bg-warning" />
									{inactiveAccountsCount} akun sedang dinonaktifkan sementara.
								</span>

								<Link
									to="/accounts"
									className="flex shrink-0 items-center gap-0.5 font-medium text-accent hover:underline"
								>
									Kelola
									<ChevronRight size={14} />
								</Link>
							</div>
						)}
					</section>

					<ProfileCard>
						<ProfileCardHeader
							kicker="Metrics"
							title="Aktivitas & Metrik Pencatatan"
							actionCode="LIVE"
						/>

						<div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2">
							<MetricCard
								icon={<Receipt size={18} />}
								label="Catatan Transaksi"
								value={counts.transactions}
								description="Total baris data riwayat transaksi tersimpan di server lokal Anda."
								tone="accent"
							/>

							<MetricCard
								icon={<Wallet size={18} />}
								label="Konektivitas Aset"
								value={accounts.length}
								description="Akun keuangan terintegrasi dalam sistem dashboard saat ini."
								tone="income"
							/>
						</div>
					</ProfileCard>

					<ProfileCard>
						<ProfileCardHeader
							kicker="Security"
							title="Tata Kelola & Keamanan Data"
							action={
								<Link
									to="/settings"
									className="flex items-center gap-1 font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
								>
									Settings
									<ArrowUpRight size={13} />
								</Link>
							}
						/>

						<div className="grid grid-cols-1 gap-6 p-4 sm:grid-cols-2">
							<div className="space-y-3.5">
								<SecurityPoint text="Data terenkripsi penuh menggunakan AES-256 pada database lokal." />
								<SecurityPoint text="Autentikasi sesi menggunakan token JWT aman." />
							</div>

							<div className="space-y-3.5">
								<SecurityPoint text="Akses pihak ketiga ditolak secara default kecuali token API dibuat." />

								<Link
									to="/settings"
									className="ml-6 flex w-fit items-center gap-0.5 text-xs font-medium text-accent hover:underline"
								>
									Buka Pengaturan API
									<ChevronRight size={12} />
								</Link>
							</div>
						</div>
					</ProfileCard>

					<ProfileCard>
						<ProfileCardHeader
							kicker="Audit"
							title="Recent Activity"
							actionCode={`TX-${counts.transactions}`}
						/>

						<div className="divide-y divide-border">
							<ProfileActivityItem
								index="01"
								icon={<User size={14} />}
								title="Profil akun dimuat"
								description="Identitas dan konfigurasi akun berhasil dibaca dari sesi aktif."
								time="Sekarang"
							/>
							<ProfileActivityItem
								index="02"
								icon={<Wallet size={14} />}
								title="Portofolio tersinkron"
								description={`${activeAccountsList.length} akun aktif tersedia untuk kalkulasi nilai bersih.`}
								time="Realtime"
							/>
							<ProfileActivityItem
								index="03"
								icon={<Receipt size={14} />}
								title="Transaksi tersedia"
								description={`${counts.transactions} catatan transaksi tersimpan di sistem.`}
								time="Realtime"
							/>
						</div>
					</ProfileCard>
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
	return (
		<ProfileCard className="p-5">
			<div className="mb-4 flex items-center justify-between">
				<span className="font-mono text-xs font-medium uppercase tracking-widest text-text-muted">
					{label}
				</span>
				<span className={`h-2.5 w-2.5 ${accentClass}`} />
			</div>

			<p className="truncate font-mono text-xl font-semibold tabular-nums text-text-primary">
				{formatIDR(total)}
			</p>
			<p className="mt-1.5 text-xs text-text-muted">{count} rekening aktif</p>
		</ProfileCard>
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
	const toneClass = tone === "income" ? "text-income" : "text-accent";

	return (
		<ProfileCard className="p-5" corners={false}>
			<CornerMarks />

			<div className={`mb-4 flex items-center gap-2 ${toneClass}`}>
				{icon}
				<span className="font-mono text-[10px] font-bold uppercase tracking-widest text-text-muted">
					{label}
				</span>
			</div>

			<p className="font-mono text-3xl font-semibold tabular-nums text-text-primary">
				{value}
			</p>
			<p className="mt-2 text-xs leading-relaxed text-text-muted">
				{description}
			</p>
		</ProfileCard>
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
		<div className="flex items-center justify-between gap-3 text-text-muted">
			<span className="flex items-center gap-2">
				{icon}
				{label}
			</span>
			<span className="font-medium text-text-primary">{value}</span>
		</div>
	);
}

function SecurityPoint({ text }: { text: React.ReactNode }) {
	return (
		<div className="flex items-start gap-2.5 text-xs leading-relaxed text-text-muted">
			<CheckCircle2 size={15} className="mt-0.5 shrink-0 text-income" />
			<span>{text}</span>
		</div>
	);
}