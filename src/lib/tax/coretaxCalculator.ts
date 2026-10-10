/**
 * CoreTax & PPh 21 Indonesian Tax Calculator
 * Based on:
 * - UU Harmonisasi Peraturan Perpajakan (UU HPP No. 7 Tahun 2021) - Tarif Progresif Pasal 17
 * - Peraturan Pemerintah (PP) No. 58 Tahun 2023 - Tarif Efektif Rata-Rata (TER) PPh 21
 * - Peraturan Menteri Keuangan (PMK) No. 168 Tahun 2023
 * - Sistem Inti Administrasi Perpajakan (Coretax DJP) untuk SPT Tahunan Wajib Pajak Orang Pribadi (1770 S / 1770 SS)
 */

export type PtkpStatus =
  | "TK/0"
  | "TK/1"
  | "TK/2"
  | "TK/3"
  | "K/0"
  | "K/1"
  | "K/2"
  | "K/3";

export type TerCategory = "A" | "B" | "C";

export interface PtkpInfo {
  code: PtkpStatus;
  label: string;
  amount: number;
  terCategory: TerCategory;
  description: string;
}

export const PTKP_DETAILS: Record<PtkpStatus, PtkpInfo> = {
  "TK/0": {
    code: "TK/0",
    label: "TK/0 (Tidak Kawin, 0 Tanggungan)",
    amount: 54_000_000,
    terCategory: "A",
    description: "Lajang / sendiri tanpa tanggungan",
  },
  "TK/1": {
    code: "TK/1",
    label: "TK/1 (Tidak Kawin, 1 Tanggungan)",
    amount: 58_500_000,
    terCategory: "A",
    description: "Lajang dengan 1 orang tanggungan",
  },
  "TK/2": {
    code: "TK/2",
    label: "TK/2 (Tidak Kawin, 2 Tanggungan)",
    amount: 63_000_000,
    terCategory: "B",
    description: "Lajang dengan 2 orang tanggungan",
  },
  "TK/3": {
    code: "TK/3",
    label: "TK/3 (Tidak Kawin, 3 Tanggungan)",
    amount: 67_500_000,
    terCategory: "B",
    description: "Lajang dengan 3 orang tanggungan (maks)",
  },
  "K/0": {
    code: "K/0",
    label: "K/0 (Kawin, 0 Tanggungan)",
    amount: 58_500_000,
    terCategory: "A",
    description: "Menikah tanpa tanggungan anak",
  },
  "K/1": {
    code: "K/1",
    label: "K/1 (Kawin, 1 Tanggungan)",
    amount: 63_000_000,
    terCategory: "B",
    description: "Menikah dengan 1 orang anak/tanggungan",
  },
  "K/2": {
    code: "K/2",
    label: "K/2 (Kawin, 2 Tanggungan)",
    amount: 67_500_000,
    terCategory: "B",
    description: "Menikah dengan 2 orang anak/tanggungan",
  },
  "K/3": {
    code: "K/3",
    label: "K/3 (Kawin, 3 Tanggungan)",
    amount: 72_000_000,
    terCategory: "C",
    description: "Menikah dengan 3 orang anak/tanggungan (maks)",
  },
};

// TER Brackets based on PP 58/2023 Lampiran A, B, C
interface TerBracket {
  max: number; // Upper limit of monthly gross income (exclusive of Infinity)
  rate: number; // Decimal percentage (e.g. 0.05 for 5%)
}

const TER_A_BRACKETS: TerBracket[] = [
  { max: 5_400_000, rate: 0.0 },
  { max: 5_650_000, rate: 0.0025 },
  { max: 5_950_000, rate: 0.005 },
  { max: 6_300_000, rate: 0.0075 },
  { max: 6_750_000, rate: 0.01 },
  { max: 7_500_000, rate: 0.0125 },
  { max: 8_550_000, rate: 0.015 },
  { max: 9_650_000, rate: 0.0175 },
  { max: 10_050_000, rate: 0.02 },
  { max: 10_350_000, rate: 0.0225 },
  { max: 10_700_000, rate: 0.025 },
  { max: 12_500_000, rate: 0.03 },
  { max: 13_750_000, rate: 0.04 },
  { max: 15_100_000, rate: 0.05 },
  { max: 16_950_000, rate: 0.06 },
  { max: 19_750_000, rate: 0.07 },
  { max: 24_100_000, rate: 0.08 },
  { max: 26_450_000, rate: 0.09 },
  { max: 28_000_000, rate: 0.1 },
  { max: 30_050_000, rate: 0.11 },
  { max: 32_400_000, rate: 0.12 },
  { max: 35_400_000, rate: 0.13 },
  { max: 39_100_000, rate: 0.14 },
  { max: 43_850_000, rate: 0.15 },
  { max: 47_800_000, rate: 0.16 },
  { max: 51_400_000, rate: 0.17 },
  { max: 56_300_000, rate: 0.18 },
  { max: 62_200_000, rate: 0.19 },
  { max: 68_600_000, rate: 0.2 },
  { max: 77_500_000, rate: 0.21 },
  { max: 89_000_000, rate: 0.22 },
  { max: 103_000_000, rate: 0.23 },
  { max: 125_000_000, rate: 0.24 },
  { max: 157_000_000, rate: 0.25 },
  { max: 206_000_000, rate: 0.26 },
  { max: 337_000_000, rate: 0.27 },
  { max: 454_000_000, rate: 0.28 },
  { max: 550_000_000, rate: 0.29 },
  { max: 695_000_000, rate: 0.3 },
  { max: 910_000_000, rate: 0.31 },
  { max: 1_400_000_000, rate: 0.32 },
  { max: Infinity, rate: 0.34 },
];

const TER_B_BRACKETS: TerBracket[] = [
  { max: 6_200_000, rate: 0.0 },
  { max: 6_500_000, rate: 0.0025 },
  { max: 6_850_000, rate: 0.005 },
  { max: 7_300_000, rate: 0.0075 },
  { max: 9_200_000, rate: 0.01 },
  { max: 10_750_000, rate: 0.015 },
  { max: 11_250_000, rate: 0.02 },
  { max: 11_600_000, rate: 0.025 },
  { max: 12_600_000, rate: 0.03 },
  { max: 13_600_000, rate: 0.04 },
  { max: 14_950_000, rate: 0.05 },
  { max: 16_400_000, rate: 0.06 },
  { max: 18_450_000, rate: 0.07 },
  { max: 21_850_000, rate: 0.08 },
  { max: 26_000_000, rate: 0.09 },
  { max: 27_700_000, rate: 0.1 },
  { max: 29_350_000, rate: 0.11 },
  { max: 31_450_000, rate: 0.12 },
  { max: 33_950_000, rate: 0.13 },
  { max: 37_100_000, rate: 0.14 },
  { max: 41_100_000, rate: 0.15 },
  { max: 45_800_000, rate: 0.16 },
  { max: 49_500_000, rate: 0.17 },
  { max: 53_800_000, rate: 0.18 },
  { max: 58_500_000, rate: 0.19 },
  { max: 64_000_000, rate: 0.2 },
  { max: 71_000_000, rate: 0.21 },
  { max: 80_000_000, rate: 0.22 },
  { max: 93_000_000, rate: 0.23 },
  { max: 109_000_000, rate: 0.24 },
  { max: 129_000_000, rate: 0.25 },
  { max: 163_000_000, rate: 0.26 },
  { max: 211_000_000, rate: 0.27 },
  { max: 374_000_000, rate: 0.28 },
  { max: 459_000_000, rate: 0.29 },
  { max: 555_000_000, rate: 0.3 },
  { max: 704_000_000, rate: 0.31 },
  { max: 957_000_000, rate: 0.32 },
  { max: 1_405_000_000, rate: 0.33 },
  { max: Infinity, rate: 0.34 },
];

const TER_C_BRACKETS: TerBracket[] = [
  { max: 6_600_000, rate: 0.0 },
  { max: 6_950_000, rate: 0.0025 },
  { max: 7_350_000, rate: 0.005 },
  { max: 7_800_000, rate: 0.0075 },
  { max: 8_850_000, rate: 0.01 },
  { max: 9_800_000, rate: 0.0125 },
  { max: 10_950_000, rate: 0.015 },
  { max: 11_200_000, rate: 0.0175 },
  { max: 12_050_000, rate: 0.02 },
  { max: 12_950_000, rate: 0.03 },
  { max: 14_150_000, rate: 0.04 },
  { max: 15_550_000, rate: 0.05 },
  { max: 17_050_000, rate: 0.06 },
  { max: 19_500_000, rate: 0.07 },
  { max: 22_700_000, rate: 0.08 },
  { max: 25_900_000, rate: 0.09 },
  { max: 28_150_000, rate: 0.1 },
  { max: 30_050_000, rate: 0.11 },
  { max: 32_150_000, rate: 0.12 },
  { max: 34_600_000, rate: 0.13 },
  { max: 37_900_000, rate: 0.14 },
  { max: 41_850_000, rate: 0.15 },
  { max: 46_600_000, rate: 0.16 },
  { max: 50_400_000, rate: 0.17 },
  { max: 54_800_000, rate: 0.18 },
  { max: 59_700_000, rate: 0.19 },
  { max: 65_200_000, rate: 0.2 },
  { max: 72_400_000, rate: 0.21 },
  { max: 81_600_000, rate: 0.22 },
  { max: 95_000_000, rate: 0.23 },
  { max: 111_000_000, rate: 0.24 },
  { max: 133_000_000, rate: 0.25 },
  { max: 167_000_000, rate: 0.26 },
  { max: 218_000_000, rate: 0.27 },
  { max: 387_000_000, rate: 0.28 },
  { max: 476_000_000, rate: 0.29 },
  { max: 572_000_000, rate: 0.3 },
  { max: 726_000_000, rate: 0.31 },
  { max: 979_000_000, rate: 0.32 },
  { max: 1_436_000_000, rate: 0.33 },
  { max: Infinity, rate: 0.34 },
];

export function getTerRate(category: TerCategory, grossMonthly: number): number {
  const brackets =
    category === "A"
      ? TER_A_BRACKETS
      : category === "B"
      ? TER_B_BRACKETS
      : TER_C_BRACKETS;

  for (const b of brackets) {
    if (grossMonthly <= b.max) {
      return b.rate;
    }
  }
  return 0.34;
}

export interface TaxBracketResult {
  label: string;
  rate: number;
  taxableInBracket: number;
  taxAmount: number;
}

export interface TaxCalculationParams {
  monthlyGrossSalary: number; // Gaji pokok + tunjangan bruto bulanan
  ptkpStatus: PtkpStatus;
  annualBonusOrThr?: number; // THR / Bonus tahunan
  thrMonth?: number; // 1-12 bulan saat THR dibayarkan (default 4 / April)
  hasNpwp?: boolean; // Default true (NIK terpadan)
  includeBpjsTk?: boolean; // Iuran JHT 2% + JP 1% ditanggung karyawan
  customMonthlyDeductions?: number; // Iuran pensiun lain yang dibayar sendiri
  annualZakat?: number; // Zakat / sumbangan wajib pengurang penghasilan bruto
}

export interface CoretaxFieldItem {
  code: string;
  name: string;
  description: string;
  amount: number;
  formattedAmount: string;
  sourceNote: string;
}

export interface TaxCalculationResult {
  // Input summary
  monthlyGrossSalary: number;
  ptkpStatus: PtkpStatus;
  ptkpAmount: number;
  terCategory: TerCategory;

  // Monthly values (Normal Month: Jan - Nov)
  monthlyTerRate: number;
  monthlyTerPercentage: string;
  monthlyTaxNormal: number;
  monthlyBpjsTk: number;
  monthlyTakeHomePayNormal: number;

  // THR Month values (jika ada THR)
  hasThr: boolean;
  annualBonusOrThr: number;
  thrMonth: number;
  thrMonthGross: number;
  thrMonthTerRate: number;
  thrMonthTax: number;
  thrMonthTakeHomePay: number;

  // December Reconciliation Month
  decemberGross: number;
  decemberTax: number;
  decemberTakeHomePay: number;
  isDecemberRefund: boolean;

  // Annual Totals
  annualGrossIncome: number;
  annualBiayaJabatan: number; // 5% max 6.000.000
  annualBpjsTk: number;
  annualZakat: number;
  annualTotalDeductions: number;
  annualNetIncome: number;
  pkpRaw: number;
  pkpRounded: number;
  taxBrackets: TaxBracketResult[];
  annualTotalTax: number;
  effectiveAnnualRate: number;
  totalJanNovTaxPaid: number;

  // Coretax Prepopulated / SPT Tahunan Companion
  coretaxFields: {
    penghasilanBruto: CoretaxFieldItem;
    pengurangBiayaJabatan: CoretaxFieldItem;
    pengurangIuranPensiun: CoretaxFieldItem;
    pengurangZakat: CoretaxFieldItem;
    totalPengurang: CoretaxFieldItem;
    penghasilanNeto: CoretaxFieldItem;
    ptkp: CoretaxFieldItem;
    pkp: CoretaxFieldItem;
    pphTerutang: CoretaxFieldItem;
    kreditPajakDipungut: CoretaxFieldItem;
    pphKurangLebihBayar: CoretaxFieldItem;
  };
}

export function calculateIndonesianTax(params: TaxCalculationParams): TaxCalculationResult {
  const {
    monthlyGrossSalary,
    ptkpStatus,
    annualBonusOrThr = 0,
    thrMonth = 4,
    hasNpwp = true,
    includeBpjsTk = true,
    customMonthlyDeductions = 0,
    annualZakat = 0,
  } = params;

  const ptkpInfo = PTKP_DETAILS[ptkpStatus] || PTKP_DETAILS["TK/0"];
  const terCategory = ptkpInfo.terCategory;
  const ptkpAmount = ptkpInfo.amount;

  // 1. Monthly normal TER (Jan - Nov without THR)
  let monthlyTerRate = getTerRate(terCategory, monthlyGrossSalary);
  if (!hasNpwp) {
    // Non-NPWP penalty (20% higher) per UU PPh Pasal 21 ayat 5a
    monthlyTerRate = Math.min(1, monthlyTerRate * 1.2);
  }
  const monthlyTaxNormal = Math.round(monthlyGrossSalary * monthlyTerRate);

  // BPJS TK karyawan: JHT 2% + JP 1% (JP cap Rp 10.042.300 di 2024/2025, max ~Rp 100.423)
  const jpWageCap = 10_042_300;
  const jhtRate = 0.02; // 2%
  const jpRate = 0.01; // 1%
  const monthlyJht = includeBpjsTk ? Math.round(monthlyGrossSalary * jhtRate) : 0;
  const monthlyJp = includeBpjsTk
    ? Math.round(Math.min(monthlyGrossSalary, jpWageCap) * jpRate)
    : 0;
  const monthlyBpjsTk = monthlyJht + monthlyJp + customMonthlyDeductions;

  const monthlyTakeHomePayNormal = Math.max(
    0,
    monthlyGrossSalary - monthlyTaxNormal - monthlyBpjsTk
  );

  // 2. THR Month calculation (jika ada)
  const hasThr = annualBonusOrThr > 0;
  const thrMonthGross = monthlyGrossSalary + (hasThr ? annualBonusOrThr : 0);
  let thrMonthTerRate = getTerRate(terCategory, thrMonthGross);
  if (!hasNpwp) {
    thrMonthTerRate = Math.min(1, thrMonthTerRate * 1.2);
  }
  const thrMonthTax = Math.round(thrMonthGross * thrMonthTerRate);
  const thrMonthTakeHomePay = Math.max(0, thrMonthGross - thrMonthTax - monthlyBpjsTk);

  // 3. Annual calculation (Pasal 17 UU HPP)
  const annualGrossIncome = monthlyGrossSalary * 12 + annualBonusOrThr;

  // Biaya jabatan: 5% dari bruto setahun, maks Rp 6.000.000 / tahun (Rp 500.000 / bulan)
  const annualBiayaJabatan = Math.min(6_000_000, Math.round(annualGrossIncome * 0.05));

  // Iuran pensiun / JHT setahun yang dibayar karyawan
  const annualBpjsTk = monthlyBpjsTk * 12;

  const annualTotalDeductions =
    annualBiayaJabatan + annualBpjsTk + Math.max(0, annualZakat);

  // Penghasilan Neto Setahun
  const annualNetIncome = Math.max(0, annualGrossIncome - annualTotalDeductions);

  // PKP (Penghasilan Kena Pajak) = Neto - PTKP
  const pkpRaw = Math.max(0, annualNetIncome - ptkpAmount);
  // PKP dibulatkan ke bawah hingga ribuan penuh
  const pkpRounded = Math.floor(pkpRaw / 1_000) * 1_000;

  // Perhitungan Tarif Progresif Pasal 17 ayat (1) huruf a UU HPP:
  // Lapis 1: s/d 60 jt -> 5%
  // Lapis 2: > 60 jt s/d 250 jt -> 15% (lebar 190 jt)
  // Lapis 3: > 250 jt s/d 500 jt -> 25% (lebar 250 jt)
  // Lapis 4: > 500 jt s/d 5 M -> 30% (lebar 4.5 M)
  // Lapis 5: > 5 M -> 35%
  const taxBrackets: TaxBracketResult[] = [];
  let remainingPkp = pkpRounded;
  let annualTotalTax = 0;

  const layerDefinitions = [
    { label: "Lapis 1 (0 s/d Rp 60 Juta)", cap: 60_000_000, rate: 0.05 },
    { label: "Lapis 2 (> Rp 60 Juta s/d Rp 250 Juta)", cap: 190_000_000, rate: 0.15 },
    { label: "Lapis 3 (> Rp 250 Juta s/d Rp 500 Juta)", cap: 250_000_000, rate: 0.25 },
    { label: "Lapis 4 (> Rp 500 Juta s/d Rp 5 Miliar)", cap: 4_500_000_000, rate: 0.3 },
    { label: "Lapis 5 (> Rp 5 Miliar)", cap: Infinity, rate: 0.35 },
  ];

  for (const def of layerDefinitions) {
    if (remainingPkp <= 0) {
      taxBrackets.push({
        label: def.label,
        rate: def.rate,
        taxableInBracket: 0,
        taxAmount: 0,
      });
      continue;
    }

    const taxableInBracket = Math.min(remainingPkp, def.cap);
    let taxInBracket = taxableInBracket * def.rate;
    if (!hasNpwp) {
      taxInBracket = taxInBracket * 1.2;
    }
    const roundedTaxInBracket = Math.round(taxInBracket);

    taxBrackets.push({
      label: def.label,
      rate: def.rate,
      taxableInBracket,
      taxAmount: roundedTaxInBracket,
    });

    annualTotalTax += roundedTaxInBracket;
    remainingPkp -= taxableInBracket;
  }

  // 4. Perhitungan Akumulasi Pajak Jan-Nov dan Rekonsiliasi Masa Desember
  // Misal ada 11 bulan sebelum Desember:
  // Jika ada THR di salah satu bulan (Jan-Nov): 10 bulan normal + 1 bulan THR
  // Jika THR di Desember: 11 bulan normal
  let totalJanNovTaxPaid = 0;
  if (hasThr && thrMonth >= 1 && thrMonth <= 11) {
    totalJanNovTaxPaid = monthlyTaxNormal * 10 + thrMonthTax;
  } else {
    totalJanNovTaxPaid = monthlyTaxNormal * 11;
  }

  // PPh Masa Desember = PPh Terutang Setahun - Total PPh yang telah dipotong Jan - Nov
  const decemberGross =
    monthlyGrossSalary + (hasThr && thrMonth === 12 ? annualBonusOrThr : 0);
  const decemberTax = annualTotalTax - totalJanNovTaxPaid;
  const isDecemberRefund = decemberTax < 0;
  const decemberTakeHomePay = Math.max(
    0,
    decemberGross - Math.max(0, decemberTax) - monthlyBpjsTk
  );

  const effectiveAnnualRate =
    annualGrossIncome > 0 ? (annualTotalTax / annualGrossIncome) * 100 : 0;

  // Format Helper
  const fmt = (n: number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(n);

  // 5. Coretax SPT 1770 S / Form Baru Mapping Fields
  const coretaxFields = {
    penghasilanBruto: {
      code: "1721-A1 #1",
      name: "Penghasilan Bruto / Gaji Bruto",
      description: "Jumlah seluruh gaji pokok, tunjangan, lembur, dan bonus/THR dalam 1 tahun pajak.",
      amount: annualGrossIncome,
      formattedAmount: fmt(annualGrossIncome),
      sourceNote: "Gaji 12 bulan + Bonus/THR",
    },
    pengurangBiayaJabatan: {
      code: "1721-A1 #8",
      name: "Biaya Jabatan (5%)",
      description: "Pengurang standar karyawan (maksimal Rp 6.000.000 / tahun).",
      amount: annualBiayaJabatan,
      formattedAmount: fmt(annualBiayaJabatan),
      sourceNote: "5% dari Penghasilan Bruto (Maks. Rp 6 Juta/thn)",
    },
    pengurangIuranPensiun: {
      code: "1721-A1 #9",
      name: "Iuran Pensiun / JHT / THT",
      description: "Iuran JHT dan jaminan pensiun yang dipotong dari gaji karyawan.",
      amount: annualBpjsTk,
      formattedAmount: fmt(annualBpjsTk),
      sourceNote: "Iuran BPJS Ketenagakerjaan (JHT 2% + JP 1%) setahun",
    },
    pengurangZakat: {
      code: "1721-A1 #10",
      name: "Zakat / Sumbangan Keagamaan Wajib",
      description: "Sumbangan keagamaan yang disalurkan melalui lembaga amil zakat resmi pemerintah.",
      amount: annualZakat,
      formattedAmount: fmt(annualZakat),
      sourceNote: "Disalurkan lewat badan resmi (BAZNAS/LAZ)",
    },
    totalPengurang: {
      code: "1721-A1 #11",
      name: "Jumlah Pengurang",
      description: "Total akumulasi Biaya Jabatan + Iuran Pensiun + Zakat.",
      amount: annualTotalDeductions,
      formattedAmount: fmt(annualTotalDeductions),
      sourceNote: "Biaya Jabatan + Iuran Pensiun + Zakat",
    },
    penghasilanNeto: {
      code: "1721-A1 #12 / Induk SPT Bagian A #1",
      name: "Penghasilan Neto",
      description: "Penghasilan bruto dikurangi total pengurang yang sah.",
      amount: annualNetIncome,
      formattedAmount: fmt(annualNetIncome),
      sourceNote: "Bruto - Total Pengurang",
    },
    ptkp: {
      code: "Induk SPT Bagian A #3",
      name: `PTKP (${ptkpStatus})`,
      description: `Penghasilan Tidak Kena Pajak untuk kategori status ${ptkpInfo.label}.`,
      amount: ptkpAmount,
      formattedAmount: fmt(ptkpAmount),
      sourceNote: `Kategori TER ${terCategory} (${ptkpStatus})`,
    },
    pkp: {
      code: "Induk SPT Bagian A #4",
      name: "Penghasilan Kena Pajak (PKP)",
      description: "Dasar pengenaan tarif pajak progresif (Neto - PTKP, dibulatkan ke bawah per ribuan).",
      amount: pkpRounded,
      formattedAmount: fmt(pkpRounded),
      sourceNote: "Neto - PTKP (dibulatkan penuh ke ribuan)",
    },
    pphTerutang: {
      code: "Induk SPT Bagian B #6",
      name: "PPh Pasal 21 Terutang Setahun",
      description: "Total pajak tahunan sesuai Tarif Progresif Pasal 17 UU HPP.",
      amount: annualTotalTax,
      formattedAmount: fmt(annualTotalTax),
      sourceNote: "Hasil perhitungan Tarif Pasal 17 ayat (1) huruf a",
    },
    kreditPajakDipungut: {
      code: "Induk SPT Bagian C #7 / Bukti Potong 1721-A1",
      name: "Kredit Pajak (PPh Dipotong Pihak Lain)",
      description: "PPh 21 yang telah dipotong oleh perusahaan/pemberi kerja selama 12 bulan.",
      amount: annualTotalTax, // Untuk 1 pemberi kerja nilai potong = terutang
      formattedAmount: fmt(annualTotalTax),
      sourceNote: "Dicocokkan dengan Bukti Potong Formulir 1721-A1",
    },
    pphKurangLebihBayar: {
      code: "Induk SPT Bagian D #11",
      name: "Status SPT Tahunan",
      description: "Karyawan tetap dengan satu pemberi kerja umumnya berstatus NIHIL (Rp 0).",
      amount: 0,
      formattedAmount: "Rp 0 (NIHIL)",
      sourceNote: "PPh Terutang = Kredit Pajak (Status NIHIL)",
    },
  };

  return {
    monthlyGrossSalary,
    ptkpStatus,
    ptkpAmount,
    terCategory,

    monthlyTerRate,
    monthlyTerPercentage: (monthlyTerRate * 100).toFixed(2) + "%",
    monthlyTaxNormal,
    monthlyBpjsTk,
    monthlyTakeHomePayNormal,

    hasThr,
    annualBonusOrThr,
    thrMonth,
    thrMonthGross,
    thrMonthTerRate,
    thrMonthTax,
    thrMonthTakeHomePay,

    decemberGross,
    decemberTax,
    decemberTakeHomePay,
    isDecemberRefund,

    annualGrossIncome,
    annualBiayaJabatan,
    annualBpjsTk,
    annualZakat,
    annualTotalDeductions,
    annualNetIncome,
    pkpRaw,
    pkpRounded,
    taxBrackets,
    annualTotalTax,
    effectiveAnnualRate,
    totalJanNovTaxPaid,

    coretaxFields,
  };
}
