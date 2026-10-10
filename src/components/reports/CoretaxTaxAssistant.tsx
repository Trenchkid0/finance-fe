import { useState, useMemo, useEffect } from "react";
import {
  FileText,
  Calculator,
  Copy,
  Check,
  Download,
  HelpCircle,
  Sparkles,
  DollarSign,
  TrendingDown,
  ShieldCheck,
  AlertTriangle,
  Building2,
  CheckCircle2,
  Landmark,
  Wallet,
  ExternalLink,
  Briefcase,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatIDR, formatInputRupiah, cleanMoneyString, terbilangRupiah } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import {
  PTKP_DETAILS,
  calculateIndonesianTax,
} from "@/lib/tax/coretaxCalculator";
import type {
  PtkpStatus,
  TaxCalculationResult,
} from "@/lib/tax/coretaxCalculator";
import { exportCoretaxToPDF } from "@/lib/tax/exportCoretaxPdf";

export interface SalaryCategoryData {
  detectedSalary: number;
  latestSalary: number;
  averageSalary: number;
  count: number;
  lastDate?: string;
  categoryName?: string;
}

interface AccountItem {
  id: string;
  name: string;
  type: string;
  balance: number;
  currency: string;
  icon?: string;
  color?: string;
}

interface CoretaxTaxAssistantProps {
  accounts?: AccountItem[];
  averageMonthlyIncome?: number;
  salaryCategoryData?: SalaryCategoryData | null;
  isId?: boolean;
}

export function CoretaxTaxAssistant({
  accounts = [],
  averageMonthlyIncome = 0,
  salaryCategoryData = null,
  isId = true,
}: CoretaxTaxAssistantProps) {
  // Determine initial salary source
  const initialSalary = useMemo(() => {
    if (salaryCategoryData?.detectedSalary && salaryCategoryData.detectedSalary > 0) {
      return Math.round(salaryCategoryData.detectedSalary);
    }
    if (averageMonthlyIncome && averageMonthlyIncome > 2_000_000) {
      return Math.round(averageMonthlyIncome);
    }
    return 10_000_000; // Default 10 Juta
  }, [salaryCategoryData, averageMonthlyIncome]);

  const [monthlySalary, setMonthlySalary] = useState<number>(initialSalary);
  const [salaryInput, setSalaryInput] = useState<string>(() =>
    initialSalary ? formatInputRupiah(String(initialSalary)) : ""
  );

  const [hasThr, setHasThr] = useState<boolean>(true);
  const [thrAmount, setThrAmount] = useState<number>(initialSalary);
  const [thrInput, setThrInput] = useState<string>(() =>
    initialSalary ? formatInputRupiah(String(initialSalary)) : ""
  );

  const [annualZakat, setAnnualZakat] = useState<number>(0);
  const [zakatInput, setZakatInput] = useState<string>("");

  const [salarySourceType, setSalarySourceType] = useState<"category" | "average" | "custom">(() => {
    if (salaryCategoryData?.detectedSalary && salaryCategoryData.detectedSalary > 0) return "category";
    if (averageMonthlyIncome && averageMonthlyIncome > 0) return "average";
    return "custom";
  });

  const applySalary = (amount: number, sourceType: "category" | "average" | "custom" = "custom") => {
    const safeAmount = Math.max(0, Math.round(amount));
    setMonthlySalary(safeAmount);
    setSalaryInput(formatInputRupiah(String(safeAmount)));
    setSalarySourceType(sourceType);
  };

  const applyThr = (amount: number) => {
    const safeAmount = Math.max(0, Math.round(amount));
    setThrAmount(safeAmount);
    setThrInput(formatInputRupiah(String(safeAmount)));
  };


  // Keep state updated if salary category data or average income loads asynchronously
  useEffect(() => {
    if (salaryCategoryData?.detectedSalary && salaryCategoryData.detectedSalary > 0) {
      const detected = Math.round(salaryCategoryData.detectedSalary);
      setMonthlySalary(detected);
      setSalaryInput(formatInputRupiah(String(detected)));
      setSalarySourceType("category");
      if (hasThr && (thrAmount === 10_000_000 || thrAmount === initialSalary)) {
        setThrAmount(detected);
        setThrInput(formatInputRupiah(String(detected)));
      }
    } else if (averageMonthlyIncome && averageMonthlyIncome > 2_000_000 && salarySourceType !== "custom") {
      const avg = Math.round(averageMonthlyIncome);
      setMonthlySalary(avg);
      setSalaryInput(formatInputRupiah(String(avg)));
      setSalarySourceType("average");
      if (hasThr && (thrAmount === 10_000_000 || thrAmount === initialSalary)) {
        setThrAmount(avg);
        setThrInput(formatInputRupiah(String(avg)));
      }
    }
  }, [salaryCategoryData?.detectedSalary, averageMonthlyIncome]);

  const [ptkpStatus, setPtkpStatus] = useState<PtkpStatus>("TK/0");
  const [includeBpjsTk, setIncludeBpjsTk] = useState<boolean>(true);
  const [hasNpwp, setHasNpwp] = useState<boolean>(true);
  const [thrMonth, setThrMonth] = useState<number>(4); // April

  // Active view inside assistant
  const [activeSubTab, setActiveSubTab] = useState<
    "overview" | "coretax-form" | "brackets" | "harta" | "guide"
  >("overview");

  // Copy tracker for visual checkmarks
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Recalculate tax
  const taxResult: TaxCalculationResult = useMemo(() => {
    return calculateIndonesianTax({
      monthlyGrossSalary: monthlySalary,
      ptkpStatus,
      annualBonusOrThr: hasThr ? thrAmount : 0,
      thrMonth,
      hasNpwp,
      includeBpjsTk,
      annualZakat,
    });
  }, [
    monthlySalary,
    ptkpStatus,
    hasThr,
    thrAmount,
    thrMonth,
    hasNpwp,
    includeBpjsTk,
    annualZakat,
  ]);

  const copyToClipboard = (text: string, label: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(
      isId
        ? `Tersalin ke clipboard: ${label}`
        : `Copied to clipboard: ${label}`,
      {
        description: text,
      }
    );
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const copyFullCoretaxSummary = () => {
    const text = `
=== RINGKASAN PENGISIAN SPT TAHUNAN CORETAX DJP ===
Tahun Pajak       : ${new Date().getFullYear() - 1} / ${new Date().getFullYear()}
Status PTKP       : ${taxResult.ptkpStatus} (${formatIDR(taxResult.ptkpAmount)} / tahun)
Kategori TER      : Kategori ${taxResult.terCategory} (${taxResult.monthlyTerPercentage})

[DATA FORMULIR SPT / BUKTI POTONG 1721-A1]
1. Penghasilan Bruto (Gaji 12 bln + THR) : ${formatIDR(taxResult.annualGrossIncome)}
2. Pengurang Biaya Jabatan (5%)          : ${formatIDR(taxResult.annualBiayaJabatan)}
3. Pengurang Iuran Pensiun / JHT         : ${formatIDR(taxResult.annualBpjsTk)}
4. Pengurang Zakat / Sumbangan           : ${formatIDR(taxResult.annualZakat)}
5. Total Pengurang                       : ${formatIDR(taxResult.annualTotalDeductions)}
6. Penghasilan Neto Setahun              : ${formatIDR(taxResult.annualNetIncome)}
7. PTKP (${taxResult.ptkpStatus})        : ${formatIDR(taxResult.ptkpAmount)}
8. Penghasilan Kena Pajak (PKP)          : ${formatIDR(taxResult.pkpRounded)}
9. PPh Pasal 21 Terutang Setahun         : ${formatIDR(taxResult.annualTotalTax)}
10. Kredit Pajak (1721-A1 Perusahaan)    : ${formatIDR(taxResult.annualTotalTax)}
11. Status SPT Tahunan                   : Rp 0 (NIHIL)

[PEMOTONGAN SLIP GAJI BULANAN]
- Gaji Bruto Bulanan                     : ${formatIDR(taxResult.monthlyGrossSalary)}
- Tarif Pemotongan TER                   : ${taxResult.monthlyTerPercentage}
- Potongan PPh 21 Bulanan (Jan - Nov)    : ${formatIDR(taxResult.monthlyTaxNormal)}
- Potongan BPJS TK Karyawan              : ${formatIDR(taxResult.monthlyBpjsTk)}
- Take-Home Pay Bersih Bulanan           : ${formatIDR(taxResult.monthlyTakeHomePayNormal)}
- Potongan PPh Masa Desember             : ${formatIDR(Math.max(0, taxResult.decemberTax))}
===================================================
`.trim();

    navigator.clipboard.writeText(text);
    toast.success(
      isId
        ? "Seluruh rincian Coretax berhasil disalin!"
        : "Full Coretax summary copied!"
    );
  };

  // Salary Quick Presets (explicit dot Rupiah formatting)
  const salaryPresets = [
    { label: "5.500.000", sub: "UMR", value: 5_500_000 },
    { label: "8.000.000", sub: "8 Jt", value: 8_000_000 },
    { label: "12.000.000", sub: "12 Jt", value: 12_000_000 },
    { label: "20.000.000", sub: "20 Jt", value: 20_000_000 },
    { label: "35.000.000", sub: "35 Jt", value: 35_000_000 },
    { label: "50.000.000", sub: "50 Jt", value: 50_000_000 },
  ];

  // Visual breakdown percentages
  const thpPercent =
    taxResult.monthlyGrossSalary > 0
      ? (taxResult.monthlyTakeHomePayNormal / taxResult.monthlyGrossSalary) * 100
      : 100;
  const taxPercent =
    taxResult.monthlyGrossSalary > 0
      ? (taxResult.monthlyTaxNormal / taxResult.monthlyGrossSalary) * 100
      : 0;
  const bpjsPercent =
    taxResult.monthlyGrossSalary > 0
      ? (taxResult.monthlyBpjsTk / taxResult.monthlyGrossSalary) * 100
      : 0;

  return (
    <div className="space-y-6">
      {/* ── Header Banner ── */}
      <div className="relative overflow-hidden rounded-2xl border border-border/70 bg-gradient-to-br from-card via-card/90 to-accent/5 p-5 md:p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className="bg-accent/15 text-accent border-accent/30 font-semibold px-2.5 py-0.5 text-xs"
              >
                <Sparkles size={12} className="mr-1 text-accent" />
                Coretax DJP Ready
              </Badge>
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border text-xs font-medium"
              >
                PP 58/2023 & PMK 168/2023 (TER)
              </Badge>
              <Badge
                variant="outline"
                className="bg-muted text-muted-foreground border-border text-xs font-medium"
              >
                UU HPP No. 7/2021 (Pasal 17)
              </Badge>
            </div>
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              🏛️ {isId ? "Kalkulator PPh 21 & Asisten Pengisian Coretax" : "PPh 21 Tax & Coretax Filing Assistant"}
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {isId
                ? "Ketahui potongan pajak bulanan dari slip gaji Anda, simulasikan THR & Masa Desember, serta dapatkan rincian angka yang presisi untuk dicocokkan atau diisi pada portal Coretax DJP."
                : "Calculate monthly salary withholding under official TER rules, simulate THR & December reconciliation, and get ready-to-paste figures for Coretax DJP filing."}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={copyFullCoretaxSummary}
              className="h-9 gap-1.5 font-semibold text-xs border-border/80 hover:bg-muted"
            >
              <Copy size={13} />
              <span>{isId ? "Salin Rincian Coretax" : "Copy Coretax Data"}</span>
            </Button>
            <Button
              size="sm"
              onClick={() => exportCoretaxToPDF(taxResult)}
              className="h-9 gap-1.5 font-semibold text-xs bg-accent text-black hover:bg-accent/90 shadow-xs"
            >
              <Download size={13} />
              <span>{isId ? "Unduh Lembar PDF" : "Download PDF Worksheet"}</span>
            </Button>
          </div>
        </div>

        {/* Sub-tab Navigation */}
        <div className="flex items-center gap-1 mt-6 border-b border-border/50 overflow-x-auto pb-1 scrollbar-none">
          {[
            {
              id: "overview",
              label: isId ? "Slip Gaji & Pajak Bulanan" : "Monthly Slip & Withholding",
              icon: Calculator,
            },
            {
              id: "coretax-form",
              label: isId ? "Formulir SPT Coretax (1721-A1)" : "Coretax Form Companion",
              icon: FileText,
            },
            {
              id: "brackets",
              label: isId ? "Tarif Progresif Ps 17" : "Article 17 Brackets",
              icon: TrendingDown,
            },
            {
              id: "harta",
              label: isId ? "Lampiran Harta & Rekening" : "Assets & Accounts Schedule",
              icon: Landmark,
            },
            {
              id: "guide",
              label: isId ? "Panduan Alur Coretax" : "Filing Guide",
              icon: HelpCircle,
            },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all duration-150 whitespace-nowrap",
                  isActive
                    ? "bg-accent/15 text-accent border border-accent/30 shadow-xs"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Main Input & Controls Card ── */}
      <Card className="p-5 md:p-6 border-border/70 bg-card/70 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/40 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
              <DollarSign size={16} className="text-accent" />
              {isId ? "Parameter Gaji & Profil Pajak Anda" : "Salary & Tax Parameters"}
            </h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isId
                ? "Gaji bruto per bulan dapat diambil otomatis dari transaksi kategori 'Gaji' atau diatur secara fleksibel."
                : "Gross salary can be detected from category 'Salary/Gaji' or adjusted manually."}
            </p>
          </div>

          {/* Salary Category Detection Status Badge */}
          {salaryCategoryData && salaryCategoryData.detectedSalary > 0 && (
            <Badge
              variant="outline"
              className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs font-semibold py-1 px-3 flex items-center gap-1.5"
            >
              <Briefcase size={13} />
              <span>
                {isId ? "Kategori Gaji Terdeteksi:" : "Salary Category Detected:"}{" "}
                <strong>{formatIDR(salaryCategoryData.detectedSalary)}</strong>
              </span>
            </Badge>
          )}
        </div>

        {/* Salary Source Quick Selection Chips */}
        <div className="flex flex-wrap items-center gap-2 p-3 rounded-xl bg-muted/20 border border-border/50 text-xs">
          <span className="text-muted-foreground font-semibold flex items-center gap-1.5 mr-1">
            <Sparkles size={13} className="text-accent" />
            {isId ? "Sumber Gaji:" : "Salary Source:"}
          </span>

          {salaryCategoryData && salaryCategoryData.detectedSalary > 0 && (
            <>
              <button
                type="button"
                onClick={() => {
                  const amt = Math.round(salaryCategoryData.latestSalary);
                  applySalary(amt, "category");
                  if (hasThr) applyThr(amt);
                  toast.success(
                    isId
                      ? `Menggunakan gaji terakhir dari kategori Gaji: ${formatIDR(amt)}`
                      : `Using latest salary from category: ${formatIDR(amt)}`
                  );
                }}
                className={cn(
                  "px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                  salarySourceType === "category" && monthlySalary === salaryCategoryData.latestSalary
                    ? "bg-accent text-black border-accent font-bold shadow-xs"
                    : "bg-background border-border/80 text-foreground hover:border-accent/40"
                )}
              >
                <Briefcase size={12} />
                <span>
                  {isId ? "Gaji Terakhir" : "Latest Salary"}: {formatIDR(salaryCategoryData.latestSalary, { compact: true })}
                </span>
              </button>

              {salaryCategoryData.count > 1 && salaryCategoryData.averageSalary !== salaryCategoryData.latestSalary && (
                <button
                  type="button"
                  onClick={() => {
                    const amt = Math.round(salaryCategoryData.averageSalary);
                    applySalary(amt, "category");
                    if (hasThr) applyThr(amt);
                    toast.success(
                      isId
                        ? `Menggunakan rata-rata kategori Gaji: ${formatIDR(amt)}`
                        : `Using average salary: ${formatIDR(amt)}`
                    );
                  }}
                  className={cn(
                    "px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                    salarySourceType === "category" && monthlySalary === salaryCategoryData.averageSalary
                      ? "bg-accent text-black border-accent font-bold shadow-xs"
                      : "bg-background border-border/80 text-foreground hover:border-accent/40"
                  )}
                >
                  <span>
                    {isId ? "Rata-rata Gaji" : "Average Salary"}: {formatIDR(salaryCategoryData.averageSalary, { compact: true })}
                  </span>
                </button>
              )}
            </>
          )}

          {averageMonthlyIncome > 0 && (
            <button
              type="button"
              onClick={() => {
                const amt = Math.round(averageMonthlyIncome);
                applySalary(amt, "average");
                if (hasThr) applyThr(amt);
                toast.success(
                  isId
                    ? `Menggunakan rata-rata seluruh pemasukan: ${formatIDR(amt)}`
                    : `Using overall monthly average: ${formatIDR(amt)}`
                );
              }}
              className={cn(
                "px-2.5 py-1 rounded-lg border font-semibold transition-all flex items-center gap-1.5",
                salarySourceType === "average"
                  ? "bg-accent text-black border-accent font-bold shadow-xs"
                  : "bg-background border-border/80 text-foreground hover:border-accent/40"
              )}
            >
              <Wallet size={12} />
              <span>
                {isId ? "Rata-rata Pemasukan" : "Average Total Income"}: {formatIDR(averageMonthlyIncome, { compact: true })}
              </span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setSalarySourceType("custom")}
            className={cn(
              "px-2.5 py-1 rounded-lg border font-semibold transition-all",
              salarySourceType === "custom"
                ? "bg-accent/20 border-accent text-accent font-bold"
                : "bg-background border-border/80 text-muted-foreground hover:text-foreground"
            )}
          >
            {isId ? "Input Manual / Kustom" : "Custom Input"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {/* Monthly Gross Salary */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <span>{isId ? "Gaji Bruto Bulanan" : "Monthly Gross Salary"}</span>
                <span className="text-[10px] lowercase font-normal text-accent font-mono">(. rupiah)</span>
              </span>
              <span className="text-xs text-accent font-mono font-semibold lowercase">
                (gross sebelum potongan)
              </span>
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/80 font-mono">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={salaryInput}
                onChange={(e) => {
                  const formatted = formatInputRupiah(e.target.value);
                  setSalaryInput(formatted);
                  const numeric = Number(cleanMoneyString(formatted)) || 0;
                  setMonthlySalary(numeric);
                  setSalarySourceType("custom");
                }}
                placeholder="10.000.000"
                className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
              />
            </div>

            {/* Real-time formatted confirmation & terbilang */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs">
              <div className="flex items-center gap-1 font-mono font-bold text-accent">
                <span>Rp</span>
                <span>{formatInputRupiah(String(monthlySalary || 0))}</span>
                <span className="text-[10px] font-normal text-muted-foreground">/ bulan</span>
              </div>
              <div className="text-[11px] text-muted-foreground font-medium italic truncate" title={terbilangRupiah(monthlySalary, isId)}>
                {terbilangRupiah(monthlySalary, isId)}
              </div>
            </div>

            {/* Quick presets */}
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {salaryPresets.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  onClick={() => {
                    applySalary(preset.value, "custom");
                    if (hasThr && thrAmount === monthlySalary) {
                      applyThr(preset.value);
                    }
                  }}
                  className={cn(
                    "text-xs px-2 py-1 rounded-md font-mono transition-colors border flex items-center gap-1",
                    monthlySalary === preset.value
                      ? "bg-accent/20 border-accent/50 text-accent font-bold"
                      : "bg-muted/40 border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
                  )}
                >
                  <span>{preset.label}</span>
                  {preset.sub && <span className="text-[10px] opacity-70">({preset.sub})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* PTKP Status */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center justify-between">
              <span>{isId ? "Status Tanggungan (PTKP)" : "Tax Relief Status (PTKP)"}</span>
              <span className="text-xs font-mono font-semibold text-accent">
                TER {taxResult.terCategory}
              </span>
            </label>
            <select
              value={ptkpStatus}
              onChange={(e) => setPtkpStatus(e.target.value as PtkpStatus)}
              className="w-full px-3 py-2 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
            >
              {(Object.keys(PTKP_DETAILS) as PtkpStatus[]).map((code) => {
                const info = PTKP_DETAILS[code];
                return (
                  <option key={code} value={code}>
                    {info.code} • {info.description} ({formatIDR(info.amount, { compact: true })})
                  </option>
                );
              })}
            </select>
            <div className="px-2.5 py-1.5 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground leading-tight space-y-1">
              <p>
                {PTKP_DETAILS[ptkpStatus].description}
              </p>
              <p className="font-mono font-semibold text-foreground">
                Nilai PTKP: {formatIDR(PTKP_DETAILS[ptkpStatus].amount)} / tahun
              </p>
            </div>
          </div>

          {/* Bonus / THR */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasThr}
                  onChange={(e) => setHasThr(e.target.checked)}
                  className="rounded border-border text-accent focus:ring-accent"
                />
                <span className="flex items-center gap-1.5">
                  <span>{isId ? "Ada THR / Bonus Tahunan" : "Include Annual Bonus / THR"}</span>
                  <span className="text-[10px] lowercase font-normal text-accent font-mono">(. rupiah)</span>
                </span>
              </label>
              {hasThr && (
                <button
                  type="button"
                  onClick={() => applyThr(monthlySalary)}
                  className="text-xs text-accent hover:underline font-semibold"
                >
                  {isId ? "Set 1x Gaji" : "Match 1x Salary"}
                </button>
              )}
            </div>

            {hasThr ? (
              <div className="space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground/80 font-mono">
                    Rp
                  </span>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={thrInput}
                    onChange={(e) => {
                      const formatted = formatInputRupiah(e.target.value);
                      setThrInput(formatted);
                      const numeric = Number(cleanMoneyString(formatted)) || 0;
                      setThrAmount(numeric);
                    }}
                    placeholder="10.000.000"
                    className="w-full pl-10 pr-3 py-2 rounded-lg border border-border bg-background text-sm font-mono font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent"
                  />
                </div>

                {/* Real-time formatted confirmation & terbilang */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-xs">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-accent">
                    <span>Rp</span>
                    <span>{formatInputRupiah(String(thrAmount || 0))}</span>
                    {thrAmount === monthlySalary && monthlySalary > 0 && (
                      <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-1.5 py-0.2 rounded">
                        1x Gaji
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground font-medium italic truncate" title={terbilangRupiah(thrAmount, isId)}>
                    {terbilangRupiah(thrAmount, isId)}
                  </div>
                </div>

                {/* Quick Presets & Month selector */}
                <div className="flex items-center justify-between gap-2 pt-0.5">
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => applyThr(monthlySalary)}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded border font-mono transition-colors",
                        thrAmount === monthlySalary
                          ? "bg-accent/20 border-accent/50 text-accent font-bold"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      1x Gaji
                    </button>
                    <button
                      type="button"
                      onClick={() => applyThr(Math.round(monthlySalary * 2))}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded border font-mono transition-colors",
                        thrAmount === monthlySalary * 2 && monthlySalary > 0
                          ? "bg-accent/20 border-accent/50 text-accent font-bold"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      2x Gaji
                    </button>
                    <button
                      type="button"
                      onClick={() => applyThr(Math.round(monthlySalary * 0.5))}
                      className={cn(
                        "text-xs px-2 py-0.5 rounded border font-mono transition-colors",
                        thrAmount === Math.round(monthlySalary * 0.5) && monthlySalary > 0
                          ? "bg-accent/20 border-accent/50 text-accent font-bold"
                          : "bg-muted/40 border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      0.5x Gaji
                    </button>
                  </div>

                  {/* Month selector */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">
                      {isId ? "Bulan Cair:" : "Month:"}
                    </span>
                    <select
                      value={thrMonth}
                      onChange={(e) => setThrMonth(Number(e.target.value))}
                      className="px-2 py-1 rounded-md border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                    >
                      {[
                        { m: 3, label: isId ? "Bln 3 (Mar)" : "M3 (Mar)" },
                        { m: 4, label: isId ? "Bln 4 (Apr - THR)" : "M4 (Apr - THR)" },
                        { m: 6, label: isId ? "Bln 6 (Jun)" : "M6 (Jun)" },
                        { m: 12, label: isId ? "Bln 12 (Des - Bonus)" : "M12 (Dec - Bonus)" },
                      ].map((item) => (
                        <option key={item.m} value={item.m}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 border border-dashed border-border rounded-lg text-xs text-muted-foreground text-center">
                {isId ? "Simulasi tanpa bonus/THR tahunan" : "No bonus/THR included in model"}
              </div>
            )}
          </div>
        </div>

        {/* Additional toggles */}
        <div className="flex flex-wrap items-center gap-6 pt-3 border-t border-border/40 text-xs text-muted-foreground">
          <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground">
            <input
              type="checkbox"
              checked={includeBpjsTk}
              onChange={(e) => setIncludeBpjsTk(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span>
              {isId
                ? "Potong Iuran BPJS Ketenagakerjaan Karyawan (JHT 2% + JP 1%)"
                : "Deduct Employee BPJS (JHT 2% + JP 1%)"}
            </span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-medium hover:text-foreground">
            <input
              type="checkbox"
              checked={hasNpwp}
              onChange={(e) => setHasNpwp(e.target.checked)}
              className="rounded border-border text-accent focus:ring-accent"
            />
            <span>
              {isId
                ? "Memiliki NPWP / NIK 16 Digit Terpadan"
                : "Has Valid 16-Digit NIK / NPWP"}
            </span>
          </label>

          <div className="flex flex-wrap items-center gap-2">
            <label className="cursor-pointer font-medium hover:text-foreground">
              {isId ? "Zakat Resmi / Thn:" : "Annual Official Zakat:"}
            </label>
            <div className="relative w-36">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-muted-foreground/80 font-mono">
                Rp
              </span>
              <input
                type="text"
                inputMode="numeric"
                value={zakatInput}
                onChange={(e) => {
                  const formatted = formatInputRupiah(e.target.value);
                  setZakatInput(formatted);
                  const numeric = Number(cleanMoneyString(formatted)) || 0;
                  setAnnualZakat(numeric);
                }}
                placeholder="2.500.000"
                className="w-full pl-8 pr-2 py-1 text-xs rounded border border-border bg-background font-mono font-medium text-foreground focus:outline-none focus:ring-1 focus:ring-accent"
              />
            </div>
            {annualZakat > 0 && (
              <span className="text-[11px] text-muted-foreground font-mono italic">
                ({terbilangRupiah(annualZakat, isId)})
              </span>
            )}
          </div>
        </div>
      </Card>

      {/* ── SUB-TAB 1: OVERVIEW SLIP GAJI & PAJAK BULANAN ── */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          {/* Top KPI Cards for Monthly Withholding */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Take-Home Pay */}
            <Card className="p-5 border-emerald-500/30 bg-emerald-500/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  {isId ? "Take-Home Pay Bulanan" : "Monthly Take-Home Pay"}
                </span>
                <div className="size-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <Wallet size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                {formatIDR(taxResult.monthlyTakeHomePayNormal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isId
                  ? "Uang bersih yang masuk ke rekening tiap bulan (Jan - Nov)."
                  : "Net cash received each month (Jan - Nov)."}
              </p>
              <div className="mt-3 text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                {thpPercent.toFixed(1)}% dari gaji bruto
              </div>
            </Card>

            {/* PPh 21 Bulanan TER */}
            <Card className="p-5 border-amber-500/30 bg-amber-500/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  {isId ? "Potongan PPh 21 Bulanan (TER)" : "Monthly PPh 21 (TER)"}
                </span>
                <div className="size-8 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                  <Landmark size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 tabular-nums">
                {formatIDR(taxResult.monthlyTaxNormal)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
                <span>{isId ? "Tarif Pemotongan:" : "Withholding Rate:"}</span>
                <Badge
                  variant="outline"
                  className="font-mono font-semibold text-xs bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30"
                >
                  TER {taxResult.terCategory} : {taxResult.monthlyTerPercentage}
                </Badge>
              </p>
              <div className="mt-3 text-xs font-mono font-semibold text-amber-600 dark:text-amber-400">
                {taxResult.monthlyTaxNormal === 0
                  ? isId
                    ? "Bebas PPh 21 bulanan (Bruto di bawah ambang TER)"
                    : "0% TER (Below withholding threshold)"
                  : `${taxPercent.toFixed(1)}% dari gaji bruto`}
              </div>
            </Card>

            {/* Total Pajak Setahun & Status */}
            <Card className="p-5 border-blue-500/30 bg-blue-500/5 relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {isId ? "Total PPh 21 Setahun" : "Total Annual PPh 21"}
                </span>
                <div className="size-8 rounded-lg bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <ShieldCheck size={16} />
                </div>
              </div>
              <p className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                {formatIDR(taxResult.annualTotalTax)}
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">
                {isId ? "Status SPT Tahunan Coretax:" : "Coretax Annual Status:"}{" "}
                <strong className="text-emerald-500 font-bold">NIHIL (Rp 0)</strong>
              </p>
              <div className="mt-3 text-xs font-mono font-semibold text-blue-600 dark:text-blue-400">
                Tarif Efektif Tahunan: {taxResult.effectiveAnnualRate.toFixed(2)}%
              </div>
            </Card>
          </div>

          {/* Visual Salary Allocation Bar */}
          <Card className="p-5 border-border/70">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 flex items-center justify-between">
              <span>{isId ? "Komposisi Gaji Bruto Anda per Bulan" : "Gross Salary Composition"}</span>
              <span className="font-mono text-foreground font-bold">
                {formatIDR(taxResult.monthlyGrossSalary)} / {isId ? "bulan" : "month"}
              </span>
            </h4>

            {/* Multi-segment bar */}
            <div className="h-4 w-full bg-border/40 rounded-full overflow-hidden flex shadow-inner">
              <div
                className="bg-emerald-500 transition-all duration-500"
                style={{ width: `${Math.max(2, thpPercent)}%` }}
                title={`Take-Home Pay: ${formatIDR(taxResult.monthlyTakeHomePayNormal)} (${thpPercent.toFixed(1)}%)`}
              />
              <div
                className="bg-amber-500 transition-all duration-500"
                style={{ width: `${taxPercent}%` }}
                title={`PPh 21 TER: ${formatIDR(taxResult.monthlyTaxNormal)} (${taxPercent.toFixed(1)}%)`}
              />
              <div
                className="bg-blue-500 transition-all duration-500"
                style={{ width: `${bpjsPercent}%` }}
                title={`BPJS TK: ${formatIDR(taxResult.monthlyBpjsTk)} (${bpjsPercent.toFixed(1)}%)`}
              />
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center justify-between gap-4 mt-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-emerald-500 shrink-0" />
                <span className="text-muted-foreground">Take-Home Pay:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatIDR(taxResult.monthlyTakeHomePayNormal)} ({thpPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-amber-500 shrink-0" />
                <span className="text-muted-foreground">PPh 21 TER:</span>
                <span className="font-mono font-bold text-foreground">
                  {formatIDR(taxResult.monthlyTaxNormal)} ({taxPercent.toFixed(1)}%)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="size-3 rounded-full bg-blue-500 shrink-0" />
                <span className="text-muted-foreground">BPJS TK (JHT & JP):</span>
                <span className="font-mono font-bold text-foreground">
                  {formatIDR(taxResult.monthlyBpjsTk)} ({bpjsPercent.toFixed(1)}%)
                </span>
              </div>
            </div>
          </Card>

          {/* Special Months Row: Bulan THR vs Bulan Desember Rekonsiliasi */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Bulan THR / Bonus Card */}
            {taxResult.hasThr ? (
              <Card className="p-5 border-amber-500/30 bg-gradient-to-br from-card to-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🎁</span>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                      {isId
                        ? `Bulan Menerima THR (Bulan ke-${taxResult.thrMonth})`
                        : `THR Bonus Month (Month ${taxResult.thrMonth})`}
                    </h4>
                  </div>
                  <Badge className="bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/30 text-xs font-medium">
                    {isId ? "TER Menyesuaikan" : "Adjusted TER"}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground leading-relaxed">
                  {isId
                    ? "Pada bulan saat Anda menerima THR/Bonus, penghasilan bruto melonjak sehingga tarif TER yang dikenakan perusahaan naik sesuai bracket baru PP 58/2023."
                    : "When bonus/THR is paid, your gross income surges into a higher TER bracket for that single month."}
                </p>

                <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isId ? "Bruto Bulan THR:" : "THR Month Gross:"}</span>
                    <span className="font-mono font-semibold text-foreground">
                      {formatIDR(taxResult.thrMonthGross)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isId ? "Tarif TER Bulan THR:" : "THR Month TER Rate:"}</span>
                    <span className="font-mono font-semibold text-amber-600 dark:text-amber-400">
                      TER {taxResult.terCategory} : {(taxResult.thrMonthTerRate * 100).toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">{isId ? "Potongan PPh 21 Bulan THR:" : "THR Month Tax:"}</span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {formatIDR(taxResult.thrMonthTax)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-border/30">
                    <span className="font-bold text-foreground">{isId ? "Take-Home Pay Bersih:" : "Net Take-Home Pay:"}</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                      {formatIDR(taxResult.thrMonthTakeHomePay)}
                    </span>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="p-5 border-dashed border-border flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <AlertTriangle size={24} className="text-muted-foreground/50" />
                <p className="text-xs font-semibold">
                  {isId ? "Tidak Ada Simulasi THR / Bonus" : "No THR Bonus Simulated"}
                </p>
                <p className="text-xs max-w-xs">
                  {isId
                    ? "Centang opsi 'Ada THR / Bonus Tahunan' di parameter atas untuk melihat lonjakan potongan pajak saat THR cair."
                    : "Enable annual bonus in settings above to see withholding adjustment."}
                </p>
              </Card>
            )}

            {/* Masa Desember Rekonsiliasi Card */}
            <Card className="p-5 border-blue-500/30 bg-gradient-to-br from-card to-blue-500/5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-lg">❄️</span>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    {isId ? "Masa Desember (Rekonsiliasi Pajak Tahunan)" : "December Month Reconciliation"}
                  </h4>
                </div>
                <Badge className="bg-blue-500/20 text-blue-600 dark:text-blue-400 border-blue-500/30 text-xs font-medium">
                  Pasal 17 UU HPP
                </Badge>
              </div>

              <p className="text-xs text-muted-foreground leading-relaxed">
                {isId
                  ? "Sesuai regulasi resmi DJP, pada bulan Desember perusahaan TIDAK lagi memotong via TER, melainkan menghitung total pajak setahun (Pasal 17) dikurangi akumulasi pajak yang sudah dipotong dari Januari s.d. November."
                  : "Under DJP rules, December does not use TER. The employer calculates total annual tax under Article 17, deducting what was already withheld from Jan to Nov."}
              </p>

              <div className="space-y-2 pt-2 border-t border-border/40 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isId ? "Akumulasi PPh Jan - Nov:" : "Total Jan - Nov Tax Paid:"}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatIDR(taxResult.totalJanNovTaxPaid)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isId ? "Total PPh Setahun (Ps 17):" : "Full Year Tax (Art 17):"}</span>
                  <span className="font-mono font-semibold text-foreground">
                    {formatIDR(taxResult.annualTotalTax)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{isId ? "Potongan PPh Masa Desember:" : "December Tax Withheld:"}</span>
                  <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                    {formatIDR(Math.max(0, taxResult.decemberTax))}
                  </span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-border/30">
                  <span className="font-bold text-foreground">{isId ? "Take-Home Pay Desember:" : "December Net Pay:"}</span>
                  <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {formatIDR(taxResult.decemberTakeHomePay)}
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* ── SUB-TAB 2: FORMULIR SPT CORETAX (1721-A1 COMPANION) ── */}
      {activeSubTab === "coretax-form" && (
        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/80">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/50">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Building2 size={16} className="text-accent" />
                  {isId
                    ? "Formulir Pelaporan SPT Tahunan di Portal Coretax DJP"
                    : "Coretax DJP Annual SPT Form Schedule"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isId
                    ? "Angka-angka di bawah ini telah diselaraskan dengan Formulir Bukti Potong 1721-A1 dan kolom isian SPT Tahunan Orang Pribadi pada Coretax. Klik 'Salin' untuk menempelkan ke form."
                    : "The figures below match the official 1721-A1 form and Coretax DJP fields. Click 'Copy' to paste into the portal."}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={copyFullCoretaxSummary}
                  className="h-8 gap-1.5 text-xs font-semibold"
                >
                  <Copy size={13} />
                  <span>{isId ? "Salin Semua" : "Copy All"}</span>
                </Button>
              </div>
            </div>

            {/* Coretax Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                    <th className="py-2.5 px-4 text-left">Kode Bagian Coretax</th>
                    <th className="py-2.5 px-4 text-left">Nama Komponen SPT</th>
                    <th className="py-2.5 px-4 text-left hidden sm:table-cell">Dasar Perhitungan</th>
                    <th className="py-2.5 px-4 text-right">Nilai Nominal</th>
                    <th className="py-2.5 px-3 text-center w-20">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {Object.entries(taxResult.coretaxFields).map(([key, item]) => {
                    const isCopied = copiedKey === key;
                    const isSpecialStatus = key === "pphKurangLebihBayar";
                    return (
                      <tr
                        key={key}
                        className={cn(
                          "hover:bg-muted/15 transition-colors duration-150",
                          isSpecialStatus && "bg-emerald-500/5 font-bold"
                        )}
                      >
                        <td className="py-3 px-4 font-mono font-semibold text-accent text-xs">
                          {item.code}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-semibold text-foreground text-xs">{item.name}</p>
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {item.description}
                          </p>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground text-xs hidden sm:table-cell">
                          {item.sourceNote}
                        </td>
                        <td className="py-3 px-4 text-right font-mono font-bold text-foreground text-xs tabular-nums">
                          {item.formattedAmount}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              copyToClipboard(
                                String(item.amount),
                                item.name,
                                key
                              )
                            }
                            className="h-7 w-7 p-0 rounded-md hover:bg-accent/20 hover:text-accent"
                            title={isId ? "Salin angka ini" : "Copy figure"}
                          >
                            {isCopied ? (
                              <Check size={14} className="text-emerald-500" />
                            ) : (
                              <Copy size={13} className="text-muted-foreground" />
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Status SPT Callout */}
            <div className="mt-5 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 flex items-start gap-3">
              <CheckCircle2 size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-emerald-600 dark:text-emerald-400">
                  {isId
                    ? "Status SPT Anda adalah NIHIL (Rp 0)"
                    : "Your SPT Status is NIHIL (Rp 0)"}
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  {isId
                    ? "Bagi pegawai/karyawan tetap dari satu pemberi kerja, seluruh PPh Terutang setahun telah dipotong oleh perusahaan sebagai Kredit Pajak (Bukti Potong 1721-A1). Anda tidak perlu membayar kekurangan pajak lagi saat lapor SPT di Coretax."
                    : "For full-time employees with a single employer, your total annual tax is fully withheld as Tax Credit (Form 1721-A1). No outstanding balance to pay."}
                </p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* ── SUB-TAB 3: TARIF PROGRESIF PASAL 17 UU HPP ── */}
      {activeSubTab === "brackets" && (
        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/80 space-y-5">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <TrendingDown size={16} className="text-accent" />
                {isId
                  ? "Rincian Lapisan Tarif Progresif Pasal 17 UU HPP"
                  : "Article 17 Progressive Tax Brackets Breakdown"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isId
                  ? `Pajak tahunan dihitung dari Penghasilan Kena Pajak (PKP) Anda sebesar ${formatIDR(taxResult.pkpRounded)} yang dialokasikan ke lapisan bracket berikut.`
                  : `Annual tax is computed from your Taxable Income (PKP) of ${formatIDR(taxResult.pkpRounded)}.`}
              </p>
            </div>

            {/* Brackets Cards */}
            <div className="space-y-3">
              {taxResult.taxBrackets.map((b, idx) => {
                const isFilled = b.taxableInBracket > 0;
                return (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-xl border transition-all duration-200",
                      isFilled
                        ? "border-accent/30 bg-accent/5"
                        : "border-border/40 bg-muted/10 opacity-60"
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "font-mono font-semibold text-xs",
                              isFilled
                                ? "bg-accent/20 text-accent border-accent/40"
                                : "bg-muted text-muted-foreground"
                            )}
                          >
                            {(b.rate * 100).toFixed(0)}%
                          </Badge>
                          <span className="font-semibold text-foreground text-xs">{b.label}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {isFilled
                            ? `${isId ? "Penghasilan di lapis ini:" : "Taxable base in tier:"} ${formatIDR(b.taxableInBracket)}`
                            : isId
                            ? "Tidak ada penghasilan masuk di lapisan ini"
                            : "No income reached this tier"}
                        </p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs text-muted-foreground uppercase font-semibold block">
                          {isId ? "Pajak Lapis Ini" : "Tax in Bracket"}
                        </span>
                        <span className="font-mono font-bold text-sm text-foreground tabular-nums">
                          {formatIDR(b.taxAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Total Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-border/50 text-sm">
              <span className="font-semibold text-foreground">
                {isId ? "Total PPh Terutang Setahun:" : "Total Annual Tax:"}
              </span>
              <span className="font-mono font-bold text-lg text-accent">
                {formatIDR(taxResult.annualTotalTax)}
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* ── SUB-TAB 4: LAMPIRAN HARTA KAS & REKENING (CORETAX SCHEDULE) ── */}
      {activeSubTab === "harta" && (
        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/80 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                  <Landmark size={16} className="text-accent" />
                  {isId
                    ? "Daftar Kas & Tabungan untuk Lampiran Harta Coretax"
                    : "Cash & Bank Balances for Coretax Assets Schedule"}
                </h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {isId
                    ? "Pada Coretax DJP, Wajib Pajak diwajibkan mencatat saldo tabungan dan kas pada akhir tahun pajak. Berikut daftar saldo rekening dari akun Anda di Maybe Finance."
                    : "Coretax requires declaring year-end cash and bank balances. Here are your account balances formatted for the tax return."}
                </p>
              </div>

              <Badge variant="outline" className="text-xs font-mono font-semibold">
                {accounts.length} {isId ? "Akun Terdeteksi" : "Accounts Detected"}
              </Badge>
            </div>

            {accounts.length === 0 ? (
              <div className="p-8 text-center border border-dashed border-border rounded-xl space-y-2">
                <p className="text-xs text-muted-foreground">
                  {isId
                    ? "Belum ada akun keuangan yang terdaftar di sistem."
                    : "No financial accounts found in system."}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/50 bg-muted/20 text-muted-foreground font-semibold uppercase tracking-wider text-xs">
                      <th className="py-2.5 px-4 text-left">Kode Harta DJP</th>
                      <th className="py-2.5 px-4 text-left">Nama Akun / Bank</th>
                      <th className="py-2.5 px-4 text-left hidden sm:table-cell">Kategori Akun</th>
                      <th className="py-2.5 px-4 text-right">Saldo Akhir</th>
                      <th className="py-2.5 px-3 text-center w-16">Salin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {accounts.map((acc) => {
                      const djpCode =
                        acc.type === "cash"
                          ? "011 (Uang Tunai)"
                          : acc.type === "bank"
                          ? "012 (Tabungan Bank)"
                          : acc.type === "wallet"
                          ? "019 (Kas / Dompet Elektronik)"
                          : "031 (Investasi / Reksa Dana)";

                      return (
                        <tr key={acc.id} className="hover:bg-muted/15 transition-colors">
                          <td className="py-3 px-4 font-mono font-semibold text-accent text-xs">
                            {djpCode}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-foreground flex items-center gap-2 text-xs">
                              <span>{acc.icon || "🏦"}</span>
                              <span>{acc.name}</span>
                            </span>
                          </td>
                          <td className="py-3 px-4 text-muted-foreground capitalize hidden sm:table-cell text-xs">
                            {acc.type}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-foreground text-xs">
                            {formatIDR(acc.balance)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                copyToClipboard(
                                  String(Math.round(acc.balance)),
                                  acc.name,
                                  acc.id
                                )
                              }
                              className="h-7 w-7 p-0 rounded-md hover:bg-accent/20"
                            >
                              <Copy size={13} className="text-muted-foreground" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* ── SUB-TAB 5: PANDUAN LANGKAH MENGISI CORETAX DJP ── */}
      {activeSubTab === "guide" && (
        <div className="space-y-6">
          <Card className="p-5 md:p-6 border-border/80 space-y-6">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <HelpCircle size={16} className="text-accent" />
                {isId ? "Panduan Alur Pelaporan di Portal Coretax DJP" : "Step-by-Step Coretax DJP Filing Walkthrough"}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isId
                  ? "Ikuti 5 langkah sederhana berikut saat Anda membuka portal resmi Coretax DJP untuk pelaporan SPT Tahunan."
                  : "Follow these 5 steps when logging into the official Coretax DJP portal."}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                {
                  step: "1",
                  title: isId ? "Dapatkan Formulir 1721-A1 dari Kantor" : "Obtain Form 1721-A1 from Employer",
                  desc: isId
                    ? "Mintalah bukti potong 1721-A1 dari HRD/Finance perusahaan tempat Anda bekerja. Bukti potong ini berisi rekapitulasi gaji bruto setahun dan PPh 21 yang sudah dipotong."
                    : "Request form 1721-A1 from HR. This documents your gross salary and withheld tax.",
                },
                {
                  step: "2",
                  title: isId ? "Login ke Portal Coretax DJP" : "Log in to Coretax DJP Portal",
                  desc: isId
                    ? "Akses portal resmi DJP (pajak.go.id / coretax). Masuk menggunakan 16 digit NIK (KTP yang sudah dipadankan jadi NPWP) serta kata sandi akun pajak Anda."
                    : "Log in with your 16-digit national ID (NIK/NPWP) and password.",
                },
                {
                  step: "3",
                  title: isId ? "Buka Menu SPT Tahunan Orang Pribadi" : "Open Annual Return Menu",
                  desc: isId
                    ? "Pilih menu 'Surat Pemberitahuan (SPT)' > 'SPT Tahunan Orang Pribadi'. Coretax telah menyediakan data 'prepopulated' yang otomatis ditarik dari laporan perusahaan."
                    : "Select Annual Individual SPT. Coretax pre-fills withholding records reported by your company.",
                },
                {
                  step: "4",
                  title: isId ? "Cocokkan Angka dengan Asisten Ini" : "Cross-Check with this Assistant",
                  desc: isId
                    ? "Buka tab 'Formulir SPT Coretax' di Maybe Finance ini. Cocokkan kolom Penghasilan Bruto, Pengurang, PTKP, dan PPh Terutang. Angka harus identik dan status akhir menunjukkan NIHIL (Rp 0)."
                    : "Compare gross, deductions, and tax payable with this table. Confirm balance is NIHIL (Rp 0).",
                },
                {
                  step: "5",
                  title: isId ? "Verifikasi & Kirim SPT" : "Verify & Submit",
                  desc: isId
                    ? "Lengkapi daftar Harta (tab Lampiran Harta di atas), minta kode verifikasi OTP (lewat email/SMS), lalu submit. Simpan Bukti Penerimaan Elektronik (BPE) Anda!"
                    : "Fill in asset schedules, request OTP verification, submit, and download your electronic receipt (BPE).",
                },
              ].map((item) => (
                <div
                  key={item.step}
                  className="p-4 rounded-xl border border-border/60 bg-muted/15 flex items-start gap-3.5"
                >
                  <div className="size-7 rounded-lg bg-accent text-black font-bold font-mono text-xs flex items-center justify-center shrink-0">
                    {item.step}
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-semibold text-foreground">{item.title}</h4>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Official Link */}
            <div className="pt-2 flex items-center justify-between border-t border-border/40 text-xs">
              <span className="text-muted-foreground">
                {isId ? "Portal Resmi Direktorat Jenderal Pajak:" : "Official DJP Tax Portal:"}
              </span>
              <a
                href="https://pajak.go.id"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-accent font-semibold hover:underline"
              >
                <span>pajak.go.id</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
