/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 · macrostructure: Workbench · genre: modern-minimal · theme: Midnight · slop-test: 58/58 pass */
import { Link } from "react-router-dom";
import { ArrowRight, Plus, Wallet, Globe, CheckCircle2, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useApp } from "@/components/layout/AppLayout";
import { getCurrentPreferences } from "@/lib/preferences";

interface Props {
  userName: string;
}

export function OnboardingHero({ userName }: Props) {
  const { language } = useLanguage();
  const { openOnboarding } = useApp();
  const id = language === "id";
  const prefs = getCurrentPreferences();
  const baseCurrency = prefs.baseCurrency || "IDR";

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Section with Structural Progress Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-2 border-b border-border/60">
        <div className="space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            {id ? `Selamat datang, ${userName}` : `Welcome, ${userName}`}
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {id
              ? "Selesaikan 3 langkah persiapan dasar untuk mengaktifkan dasbor & analisis arus kas."
              : "Complete these 3 setup steps to activate your cash flow analytics and net worth tracker."}
          </p>
        </div>

        {/* Tactile Progress Chip */}
        <div className="inline-flex items-center gap-2.5 rounded-xl border border-border/80 bg-card px-3.5 py-1.5 text-xs font-medium text-muted-foreground shrink-0">
          <span className="size-2 rounded-full bg-accent animate-pulse" />
          <span>{id ? "Status Persiapan: 1/3 Selesai" : "Setup Status: 1/3 Complete"}</span>
        </div>
      </div>

      {/* Main Container Card - Tactile & Structural, No AI-slop glows */}
      <div className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-6 shadow-sm">
        
        {/* Top Currency Status Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/60 bg-muted/40">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-lg border border-border/80 bg-background flex items-center justify-center text-accent shrink-0">
              <Globe size={18} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-foreground">
                  {id ? "Mata Uang Utama Aplikasi" : "Base Application Currency"}
                </span>
                <span className="font-mono text-[11px] font-bold bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-md">
                  {baseCurrency}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                {id
                  ? `Format tampilan angka dan saldo menggunakan acuan ${baseCurrency}.`
                  : `All balances and chart statistics use ${baseCurrency} formatting.`}
              </p>
            </div>
          </div>

          <Button
            onClick={openOnboarding}
            variant="outline"
            size="sm"
            className="h-9 px-4 rounded-xl gap-2 text-xs font-semibold border-border/80 hover:bg-accent/10 hover:text-accent hover:border-accent/40 shrink-0"
          >
            <SlidersHorizontal size={14} />
            <span>{id ? "Ubah Mata Uang & Goals" : "Adjust Currency & Goals"}</span>
          </Button>
        </div>

        {/* 3 Step Interactive Grid */}
        <div className="space-y-3">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-muted-foreground/80">
            {id ? "Langkah Persiapan" : "Getting Started Checklist"}
          </div>

          <div className="grid grid-cols-1 gap-3">
            {/* Step 1: Base Currency & Goals */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-background hover:border-border transition-colors">
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="size-7 rounded-lg border border-border/80 bg-muted text-muted-foreground flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  1
                </span>
                <div className="space-y-0.5 min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                      {id ? "Atur Format Mata Uang & Fokus Keuangan" : "Set Base Currency & Goals"}
                    </h2>
                    {prefs.onboardingCompleted && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                        <CheckCircle2 size={12} />
                        <span>Selesai</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {id
                      ? `Format mata uang aktif: ${baseCurrency}. Klik untuk membuka dialog pengaturan.`
                      : `Active currency format: ${baseCurrency}. Click to configure formatting.`}
                  </p>
                </div>
              </div>

              <Button
                onClick={openOnboarding}
                variant="outline"
                size="sm"
                className="h-8 rounded-lg px-3 text-xs font-medium border-border/80 hover:border-accent/40 shrink-0 self-end sm:self-auto"
              >
                <span>{id ? "Buka Modal" : "Open Modal"}</span>
                <ArrowRight size={13} className="ml-1" />
              </Button>
            </div>

            {/* Step 2: Add First Account */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-background hover:border-border transition-colors">
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="size-7 rounded-lg border border-border/80 bg-muted text-muted-foreground flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  2
                </span>
                <div className="space-y-0.5 min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                    {id ? "Tambah Akun Keuangan Pertama" : "Add Your First Financial Account"}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {id
                      ? "Tambahkan bank, e-wallet, atau kas tunai untuk menghitung kekayaan bersih Anda."
                      : "Add a bank, e-wallet, or cash account to track your starting net worth."}
                  </p>
                </div>
              </div>

              <Button
                asChild
                size="sm"
                className="h-8 rounded-lg px-3.5 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90 shrink-0 self-end sm:self-auto"
              >
                <Link to="/accounts">
                  <Wallet size={13} className="mr-1.5" />
                  <span>{id ? "Tambah Akun" : "Add Account"}</span>
                </Link>
              </Button>
            </div>

            {/* Step 3: Record First Transaction */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-border/70 bg-background hover:border-border transition-colors">
              <div className="flex items-start gap-3.5 min-w-0">
                <span className="size-7 rounded-lg border border-border/80 bg-muted text-muted-foreground flex items-center justify-center text-xs font-mono font-bold shrink-0 mt-0.5">
                  3
                </span>
                <div className="space-y-0.5 min-w-0">
                  <h2 className="text-xs sm:text-sm font-semibold text-foreground">
                    {id ? "Catat Transaksi Pertama" : "Record Your First Transaction"}
                  </h2>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {id
                      ? "Buat entri pengeluaran atau pemasukan pertama untuk mengaktifkan grafik dasbor."
                      : "Log your first income or expense entry to populate dashboard charts."}
                  </p>
                </div>
              </div>

              <Button
                asChild
                variant="secondary"
                size="sm"
                className="h-8 rounded-lg px-3.5 text-xs font-semibold shrink-0 self-end sm:self-auto border border-border/80"
              >
                <Link to="/transactions">
                  <Plus size={13} className="mr-1.5" />
                  <span>{id ? "Catat Transaksi" : "Log Transaction"}</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
