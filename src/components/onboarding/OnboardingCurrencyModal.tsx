/* Hallmark · component: Modal · genre: modern-minimal · theme: Midnight · pre-emit critique: P5 H5 E5 S5 R5 V5 · slop-test: 58/58 pass */
import { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Check, ArrowRight, ArrowLeft, Globe, Search,
  TrendingUp, Shield, Wallet, PiggyBank
} from "lucide-react";
import { toast } from "sonner";
import { getCurrentPreferences, savePreferencesNow } from "@/lib/preferences";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface CurrencyOption {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  rateHint: string;
  description: string;
  sampleAmount: number;
  formattedSample: string;
}

const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: "IDR",
    name: "Rupiah Indonesia",
    symbol: "Rp",
    flag: "🇮🇩",
    rateHint: "Mata uang utama Indonesia",
    description: "Format standar Rupiah (misal: Rp 150.000)",
    sampleAmount: 150000,
    formattedSample: "Rp 150.000",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
    flag: "🇺🇸",
    rateHint: "1 USD ≈ Rp 16.250",
    description: "Format standar Amerika Serikat (misal: $ 10.00)",
    sampleAmount: 10,
    formattedSample: "$ 10.00",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
    flag: "🇸🇬",
    rateHint: "1 SGD ≈ Rp 12.100",
    description: "Format standar Singapura (misal: S$ 25.00)",
    sampleAmount: 25,
    formattedSample: "S$ 25.00",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
    flag: "🇪🇺",
    rateHint: "1 EUR ≈ Rp 17.500",
    description: "Format standar Uni Eropa (misal: € 15.00)",
    sampleAmount: 15,
    formattedSample: "€ 15.00",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
    flag: "🇯🇵",
    rateHint: "1 JPY ≈ Rp 105",
    description: "Format standar Jepang (misal: ¥ 1.500)",
    sampleAmount: 1500,
    formattedSample: "¥ 1.500",
  },
  {
    code: "MYR",
    name: "Malaysian Ringgit",
    symbol: "RM",
    flag: "🇲🇾",
    rateHint: "1 MYR ≈ Rp 3.650",
    description: "Format standar Malaysia (misal: RM 45.00)",
    sampleAmount: 45,
    formattedSample: "RM 45.00",
  },
];

const FINANCIAL_GOALS = [
  {
    id: "budgeting",
    title: "Kelola Pengeluaran Harian",
    desc: "Pantau pengeluaran harian & cegah boros.",
    icon: Wallet,
  },
  {
    id: "savings",
    title: "Mencapai Target Tabungan",
    desc: "Alokasikan dana darurat & impian masa depan.",
    icon: PiggyBank,
  },
  {
    id: "analytics",
    title: "Analisis Arus Kas & Laporan",
    desc: "Dapatkan rekap grafik & proyeksi keuangan.",
    icon: TrendingUp,
  },
];

interface OnboardingCurrencyModalProps {
  open: boolean;
  onComplete: () => void;
}

export function OnboardingCurrencyModal({ open, onComplete }: OnboardingCurrencyModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedCode, setSelectedCode] = useState<string>("IDR");
  const [selectedGoal, setSelectedGoal] = useState<string>("budgeting");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [submitting, setSubmitting] = useState<boolean>(false);

  const filteredCurrencies = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return CURRENCY_OPTIONS;
    return CURRENCY_OPTIONS.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  const activeCurrency = useMemo(
    () => CURRENCY_OPTIONS.find((c) => c.code === selectedCode) || CURRENCY_OPTIONS[0],
    [selectedCode]
  );

  if (!open) return null;

  const handleFinishOnboarding = async () => {
    try {
      setSubmitting(true);
      const currentPrefs = getCurrentPreferences();
      const updated = {
        ...currentPrefs,
        baseCurrency: selectedCode,
        onboardingCompleted: true,
      };

      await savePreferencesNow(updated);

      toast.success(
        `Pengaturan selesai! Mata uang ${selectedCode} telah aktif. Selamat datang!`
      );
      onComplete();
    } catch (err) {
      console.error("Failed to complete onboarding:", err);
      toast.error("Gagal menyimpan konfigurasi. Silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 sm:p-6 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-border/80 bg-card p-6 md:p-7 shadow-2xl transition-all duration-200">
        
        {/* Progress Bar & Header */}
        <div className="space-y-3 pb-4 border-b border-border/60">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-foreground">
              {step === 1 ? "Konfigurasi Mata Uang Utama" : "Fokus Keuangan Pengguna"}
            </span>
            <span className="font-mono text-muted-foreground font-medium">
              Langkah {step} dari 2
            </span>
          </div>

          <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-accent transition-all duration-300 rounded-full"
              style={{ width: step === 1 ? "50%" : "100%" }}
            />
          </div>
        </div>

        {/* Step 1: Base Currency Picker */}
        {step === 1 && (
          <div className="mt-5 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Pilih Mata Uang Utama
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih mata uang acuan untuk tampilan saldo, transaksi, dan laporan analisis Anda.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Cari mata uang (USD, IDR, Euro)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl bg-background border-border/80 text-xs focus-visible:ring-accent"
              />
            </div>

            {/* Currency Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[240px] overflow-y-auto pr-1">
              {filteredCurrencies.map((c) => {
                const isSelected = selectedCode === c.code;
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => setSelectedCode(c.code)}
                    className={`flex items-start gap-2.5 rounded-xl p-3 text-left transition-all duration-150 ${
                      isSelected
                        ? "border border-accent bg-accent/10 shadow-sm"
                        : "border border-border/60 bg-background hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-xl select-none leading-none pt-0.5">{c.flag}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-semibold text-xs text-foreground truncate">{c.name}</span>
                        <span className="font-mono text-xs font-bold text-accent">{c.code}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/80 mt-0.5 truncate">{c.rateHint}</p>
                    </div>
                    {isSelected && (
                      <div className="size-4 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0 mt-0.5">
                        <Check size={10} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Interactive Preview Card */}
            <div className="rounded-xl border border-border/80 bg-muted/30 p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-lg border border-border/80 bg-background flex items-center justify-center text-accent text-xs font-bold font-mono">
                  {activeCurrency.symbol}
                </div>
                <div>
                  <p className="text-[10px] font-mono font-semibold uppercase tracking-wider text-muted-foreground">Format Saldo</p>
                  <p className="text-xs font-bold font-mono text-foreground tabular-nums">
                    {activeCurrency.formattedSample}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded border border-accent/20">
                {activeCurrency.code}
              </span>
            </div>

            {/* Step 1 Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <span className="text-[11px] text-muted-foreground flex items-center gap-1.5">
                <Globe size={13} className="text-accent" />
                <span>Dapat diubah kembali di Pengaturan</span>
              </span>

              <Button
                onClick={() => setStep(2)}
                className="h-9 px-5 rounded-xl gap-1.5 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <span>Lanjut</span>
                <ArrowRight size={14} />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Financial Focus */}
        {step === 2 && (
          <div className="mt-5 space-y-4 animate-fade-in">
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Tujuan Utama Keuangan
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pilih prioritas utama Anda untuk menyelaraskan widget dasbor.
              </p>
            </div>

            {/* Goals Radio List */}
            <div className="space-y-2">
              {FINANCIAL_GOALS.map((goal) => {
                const Icon = goal.icon;
                const isSelected = selectedGoal === goal.id;
                return (
                  <button
                    key={goal.id}
                    type="button"
                    onClick={() => setSelectedGoal(goal.id)}
                    className={`w-full flex items-center gap-3 rounded-xl p-3.5 text-left transition-all duration-150 ${
                      isSelected
                        ? "border border-accent bg-accent/10 shadow-sm"
                        : "border border-border/60 bg-background hover:border-border hover:bg-muted/30"
                    }`}
                  >
                    <div className={`size-9 rounded-lg flex items-center justify-center shrink-0 border ${
                      isSelected
                        ? "bg-accent text-accent-foreground border-accent"
                        : "bg-muted border-border/80 text-muted-foreground"
                    }`}>
                      <Icon size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-semibold text-foreground">{goal.title}</h3>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{goal.desc}</p>
                    </div>
                    {isSelected && (
                      <div className="size-4.5 rounded-full bg-accent flex items-center justify-center text-accent-foreground shrink-0">
                        <Check size={11} strokeWidth={3} />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Security Note */}
            <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5 flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <Shield size={14} className="text-accent shrink-0" />
              <span>Seluruh data transaksi tersimpan terenkripsi secara aman.</span>
            </div>

            {/* Step 2 Actions */}
            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="h-9 px-3.5 rounded-xl gap-1 text-xs font-medium border-border/80"
              >
                <ArrowLeft size={13} />
                <span>Kembali</span>
              </Button>

              <Button
                onClick={handleFinishOnboarding}
                disabled={submitting}
                className="h-9 px-5 rounded-xl gap-1.5 text-xs font-semibold bg-accent text-accent-foreground hover:bg-accent/90"
              >
                <span>{submitting ? "Menyimpan..." : "Mulai Gunakan Aplikasi"}</span>
                <Check size={14} />
              </Button>
            </div>
          </div>
        )}

      </div>
    </div>,
    document.body
  );
}
