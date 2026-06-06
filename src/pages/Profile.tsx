import { Calendar, Mail, Receipt, ShieldCheck, User, Lock, CheckCircle2, ChevronRight, Activity, Wallet } from "lucide-react";
import { useApp } from "@/components/layout/AppLayout";
import { formatDate, formatIDR } from "@/lib/utils/formatters";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function Profile() {
  const { user, counts, accounts } = useApp();

  if (!user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Card className="p-8 text-center max-w-md border-border bg-surface">
          <User size={48} className="mx-auto text-text-muted mb-4" />
          <p className="text-base font-medium text-text-primary mb-2">
            Profil tidak ditemukan
          </p>
          <p className="text-sm text-text-muted">
            Silakan login kembali untuk melihat profil Anda.
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

  const signupDate = (user as any).createdAt || new Date().toISOString();
  
  // Calculate specific account type counts and total value
  const activeAccountsList = accounts.filter((a) => a.isActive);
  const inactiveAccountsCount = accounts.length - activeAccountsList.length;
  
  const totalBalance = activeAccountsList.reduce((sum, a) => sum + a.balance, 0);

  const bankAccounts = activeAccountsList.filter((a) => a.type === "bank");
  const walletAccounts = activeAccountsList.filter((a) => a.type === "wallet");
  const cashAccounts = activeAccountsList.filter((a) => a.type === "cash");
  const investmentAccounts = activeAccountsList.filter((a) => a.type === "investment");

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <header className="space-y-1">
        <h1 className="text-2xl lg:text-3xl font-semibold text-text-primary tracking-tight">
          Profil Akun
        </h1>
        <p className="text-sm text-text-muted">
          Ringkasan identitas, konfigurasi portofolio, dan keamanan data Anda.
        </p>
      </header>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Identity Card */}
        <div className="space-y-6 lg:col-span-1">
          <Card className="border-border bg-surface overflow-hidden">
            {/* Top decorative gradient banner */}
            <div className="h-16 w-full bg-gradient-to-r from-accent/30 via-income/20 to-accent/10" />
            
            <CardContent className="pt-0 px-6 pb-6 relative">
              {/* Profile Avatar with overlap */}
              <div className="flex justify-center -mt-10 mb-4">
                {user.image ? (
                  <div className="relative p-1 bg-surface rounded-full border border-border">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-income opacity-30 blur-sm" />
                    <img
                      src={user.image}
                      alt={user.name ?? "Avatar"}
                      className="relative w-20 h-20 rounded-full object-cover border border-border"
                    />
                  </div>
                ) : (
                  <div className="relative p-1 bg-surface rounded-full border border-border">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-accent to-income opacity-20 blur-sm" />
                    <div className="relative w-20 h-20 rounded-full bg-elevated border border-border text-accent font-bold text-2xl flex items-center justify-center">
                      {userInitials}
                    </div>
                  </div>
                )}
              </div>

              {/* Identity Details */}
              <div className="text-center space-y-1">
                <h2 className="text-lg font-semibold text-text-primary truncate">
                  {user.name ?? "Pengguna"}
                </h2>
                <p className="text-xs text-text-muted flex items-center justify-center gap-1">
                  <Mail size={12} className="shrink-0" />
                  <span className="truncate max-w-[200px]">{user.email}</span>
                </p>
                <div className="pt-2 flex justify-center">
                  <Badge variant="outline" className="bg-income/10 text-income border-income/30 text-[10px] font-medium px-2 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck size={12} />
                    Terverifikasi
                  </Badge>
                </div>
              </div>

              <Separator className="my-5 bg-border" />

              {/* Meta information */}
              <div className="space-y-3 text-xs text-text-muted">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Calendar size={13} />
                    Mendaftar
                  </span>
                  <span className="font-medium text-text-primary">
                    {formatDate(signupDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Activity size={13} />
                    Status Akun
                  </span>
                  <span className="font-medium text-income flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-income animate-pulse" />
                    Aktif
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Lock size={13} />
                    Enkripsi Data
                  </span>
                  <span className="font-medium text-text-primary">AES-256</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Stats Summary Widget */}
          <Card className="border-border bg-surface">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-text-muted">
                Portofolio Aktif
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-1">
                <p className="text-2xl font-bold font-mono tabular-nums text-text-primary">
                  {formatIDR(totalBalance)}
                </p>
                <p className="text-[10px] text-text-muted">
                  Estimasi nilai bersih di {activeAccountsList.length} akun aktif
                </p>
              </div>

              <Separator className="bg-border" />

              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-text-muted">Tingkat Aktivitas</span>
                  <span className="font-medium text-text-primary">
                    {accounts.length > 0
                      ? `${Math.round((activeAccountsList.length / accounts.length) * 100)}%`
                      : "0%"}
                  </span>
                </div>
                <div className="h-1.5 bg-elevated rounded-full overflow-hidden">
                  <div
                    className="h-full bg-accent rounded-full"
                    style={{
                      width: `${accounts.length > 0 ? (activeAccountsList.length / accounts.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Portfolio Breakdown & Activity */}
        <div className="space-y-6 lg:col-span-2">
          
          {/* Account Portfolio Breakdown */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-base font-semibold text-text-primary">
                Struktur Rekening & Wallet
              </CardTitle>
              <CardDescription className="text-sm text-text-muted">
                Distribusi penyimpanan aset finansial terdaftar Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <PortfolioSegmentCard
                  label="Bank"
                  count={bankAccounts.length}
                  total={bankAccounts.reduce((sum, a) => sum + a.balance, 0)}
                  accentColor="#388BFD"
                />
                <PortfolioSegmentCard
                  label="E-Wallet"
                  count={walletAccounts.length}
                  total={walletAccounts.reduce((sum, a) => sum + a.balance, 0)}
                  accentColor="#D29922"
                />
                <PortfolioSegmentCard
                  label="Tunai"
                  count={cashAccounts.length}
                  total={cashAccounts.reduce((sum, a) => sum + a.balance, 0)}
                  accentColor="#2EA043"
                />
                <PortfolioSegmentCard
                  label="Investasi"
                  count={investmentAccounts.length}
                  total={investmentAccounts.reduce((sum, a) => sum + a.balance, 0)}
                  accentColor="#A371F7"
                />
              </div>

              {inactiveAccountsCount > 0 && (
                <div className="p-4 rounded-xl bg-warning/5 border border-warning/20 flex items-center justify-between text-sm mt-4">
                  <span className="text-warning font-medium flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                    Terdapat {inactiveAccountsCount} akun yang sedang dinonaktifkan sementara.
                  </span>
                  <Link to="/accounts" className="text-accent hover:underline flex items-center font-medium gap-0.5 shrink-0">
                    Kelola
                    <ChevronRight size={14} />
                  </Link>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Activity Logs & Audit metrics */}
          <Card className="border-border bg-card">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-base font-semibold text-text-primary">
                Aktivitas & Metrik Pencatatan
              </CardTitle>
              <CardDescription className="text-sm text-text-muted">
                Statistik volume dan tingkat keterisian data transaksi Anda
              </CardDescription>
            </CardHeader>
            <CardContent className="px-6 pb-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div className="p-6 rounded-xl bg-elevated/40 border border-border/60 space-y-3 hover:border-border transition-colors">
                  <div className="flex items-center gap-2 text-accent">
                    <Receipt size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Catatan Transaksi
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold font-mono tabular-nums text-text-primary">
                      {counts.transactions}
                    </p>
                    <p className="text-xs text-text-muted">
                      Total baris data riwayat transaksi tersimpan di server lokal Anda.
                    </p>
                  </div>
                </div>

                <div className="p-6 rounded-xl bg-elevated/40 border border-border/60 space-y-3 hover:border-border transition-colors">
                  <div className="flex items-center gap-2 text-income">
                    <Wallet size={20} />
                    <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                      Konektivitas Aset
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="text-3xl font-bold font-mono tabular-nums text-text-primary">
                      {accounts.length}
                    </p>
                    <p className="text-xs text-text-muted">
                      Akun keuangan terintegrasi dalam sistem dashboard saat ini.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Security & Integration info */}
          <Card className="border-border bg-surface">
            <CardHeader className="p-6 pb-2">
              <CardTitle className="text-base font-semibold text-text-primary flex items-center gap-2">
                <Lock size={18} className="text-accent" />
                Tata Kelola & Keamanan Data
              </CardTitle>
              <CardDescription className="text-sm text-text-muted">
                Standar perlindungan privasi dan akses programatik pihak ketiga
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-3.5">
                  <SecurityPoint text="Data terenkripsi penuh menggunakan AES-256 pada database lokal." />
                  <SecurityPoint text="Autentikasi sesi menggunakan token JWT aman." />
                </div>
                <div className="space-y-3.5">
                  <SecurityPoint text="Akses pihak ketiga ditolak secara default kecuali jika token API dibuat." />
                  <div className="flex items-start gap-2.5 text-xs text-text-muted pl-6">
                    <Link
                      to="/settings"
                      className="text-accent hover:underline flex items-center gap-0.5 font-medium"
                    >
                      Buka Pengaturan API
                      <ChevronRight size={12} />
                    </Link>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
        </div>
      </div>
    </div>
  );
}

// Sub-components for better organization & spacing

function PortfolioSegmentCard({
  label,
  count,
  total,
  accentColor,
}: {
  label: string;
  count: number;
  total: number;
  accentColor: string;
}) {
  return (
    <div className="p-6 rounded-xl bg-elevated/30 border border-border/80 hover:border-border hover:bg-elevated/50 transition-all duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        <span
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: accentColor }}
        />
      </div>
      <p className="text-xl font-bold font-mono tabular-nums text-text-primary truncate">
        {formatIDR(total)}
      </p>
      <p className="text-xs text-text-muted mt-1.5">{count} rekening aktif</p>
    </div>
  );
}

function SecurityPoint({ text }: { text: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 text-xs text-text-muted">
      <CheckCircle2 size={15} className="text-income shrink-0 mt-0.5" />
      <span>{text}</span>
    </div>
  );
}
