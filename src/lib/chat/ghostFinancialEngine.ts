import type {
  SummaryApiResponse,
  Account,
  User,
  TransactionApiItem,
  BudgetApiItem,
  AssetHolding,
} from "@/types";
import { formatIDR } from "@/lib/utils/formatters";
import type { GhostMood } from "@/components/chat/GhostAvatar";

export type GhostDataCardType =
  | "expense"
  | "income"
  | "capabilities"
  | "balance"
  | "cashflow"
  | "coffee"
  | "food"
  | "shopping"
  | "transport"
  | "bills"
  | "subscription"
  | "debt"
  | "top_expense"
  | "comparison"
  | "budget"
  | "investment"
  | "health_score"
  | "latte_factor"
  | "goal_simulation"
  | "rule_50_30_20"
  | "anomaly"
  | "yesterday_expense"
  | "today_expense"
  | "week_expense"
  | "burn_rate"
  | "entertainment"
  | "health"
  | "charity"
  | "personal_care"
  | "education"
  | "pet_care"
  | "emergency_runway"
  | "projection"
  | "spending_pattern"
  | "admin_fees"
  | "tips"
  | "quick_add"
  | "merchant_search"
  | "account_audit"
  | "affordability"
  | "tax_audit"
  | "saving_rate"
  | "fire_retirement"
  | "lifestyle_creep"
  | "zombie_subscriptions"
  | "delivery_fees"
  | "biggest_purchase"
  | "windfall_planner"
  | "expense_cut_sim"
  | "debt_payoff"
  | "cash_buffer";

export interface GhostDataCardItem {
  label: string;
  value: number | string;
  formattedValue?: string;
  percent?: number;
  color?: string;
}

export interface GhostDataCardAction {
  label: string;
  type: "quick_create_tx" | "open_quick_add" | "filter_transactions";
  payload?: any;
}

export interface GhostDataCard {
  type: GhostDataCardType;
  title: string;
  subtitle?: string;
  totalAmount?: number;
  formattedTotal?: string;
  items?: GhostDataCardItem[];
  statusBadge?: {
    label: string;
    isPositive: boolean;
  };
  tip?: string;
  action?: GhostDataCardAction;
}

export interface GhostResponse {
  text: string;
  mood: GhostMood;
  dataCard?: GhostDataCard;
  suggestedPrompts: string[];
}

export interface FinancialContext {
  summary?: SummaryApiResponse | null;
  accounts: Account[];
  user?: User | null;
  transactions?: TransactionApiItem[];
  budgets?: BudgetApiItem[];
  investments?: AssetHolding[];
}

const MONTH_NAMES_ID = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
];

/** Helper to parse time window from query (default: current month) */
function parseTimeRange(q: string) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  let rangeLabel = `Bulan Ini (${MONTH_NAMES_ID[currentMonth]} ${currentYear})`;
  let isMonth = true;
  let isLastMonth = false;
  let isToday = false;
  let isYesterday = false;
  let isThisWeek = false;
  let isAllTime = false;

  if (q.includes("bulan lalu") || q.includes("last month") || q.includes("kemarin bulan")) {
    isLastMonth = true;
    isMonth = false;
    const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    rangeLabel = `Bulan Lalu (${MONTH_NAMES_ID[targetMonth]} ${targetYear})`;
  } else if (q.includes("kemarin") || q.includes("yesterday")) {
    isYesterday = true;
    isMonth = false;
    rangeLabel = "Kemarin";
  } else if (q.includes("hari ini") || q.includes("today")) {
    isToday = true;
    isMonth = false;
    rangeLabel = "Hari Ini";
  } else if (
    q.includes("minggu ini") ||
    q.includes("pekan ini") ||
    q.includes("this week") ||
    q.includes("seminggu") ||
    q.includes("7 hari")
  ) {
    isThisWeek = true;
    isMonth = false;
    rangeLabel = "Minggu Ini (7 Hari Terakhir)";
  } else if (
    q.includes("semua") ||
    q.includes("sepanjang waktu") ||
    q.includes("all time") ||
    (q.includes("total") && !q.includes("bulan ini") && !q.includes("bulan"))
  ) {
    isAllTime = true;
    isMonth = false;
    rangeLabel = "Sepanjang Waktu";
  }

  const matchesDate = (dateStr?: string | null) => {
    if (!dateStr) return false;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return false;
    if (isMonth) return d.getFullYear() === currentYear && d.getMonth() === currentMonth;
    if (isLastMonth) {
      const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
      return d.getFullYear() === targetYear && d.getMonth() === targetMonth;
    }
    if (isYesterday) {
      const yDate = new Date(now);
      yDate.setDate(now.getDate() - 1);
      return (
        d.getFullYear() === yDate.getFullYear() &&
        d.getMonth() === yDate.getMonth() &&
        d.getDate() === yDate.getDate()
      );
    }
    if (isToday) {
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === now.getDate()
      );
    }
    if (isThisWeek) {
      const sevenDaysAgo = new Date(now);
      sevenDaysAgo.setDate(now.getDate() - 7);
      return d >= sevenDaysAgo && d <= now;
    }
    return true;
  };

  return {
    rangeLabel,
    isMonth,
    isLastMonth,
    isToday,
    isYesterday,
    isAllTime,
    matchesDate,
    currentMonthName: MONTH_NAMES_ID[currentMonth],
    currentYear,
  };
}

/** Formats ISO date to short Indonesian format (e.g. "10 Okt") */
function formatShortDate(dateStr?: string | null): string {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
}

/** Robust Indonesian currency & amount parser */
function parseAmount(text: string): { amount: number; matchedText: string } | null {
  const lower = text.toLowerCase();

  // Pattern 1: Jutaan (e.g. 15jt, 1.5 jt, 2,5 juta, 10juta)
  const jtRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:jt|juta)\b/i;
  const jtMatch = lower.match(jtRegex);
  if (jtMatch) {
    const rawNum = jtMatch[1].replace(",", ".");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) {
      return { amount: Math.round(val * 1_000_000), matchedText: jtMatch[0] };
    }
  }

  // Pattern 2: Ribuan (e.g. 35rb, 50k, 25 ribu, 1.5k, 100 rb)
  const rbRegex = /(?:rp\.?\s*)?(\d+(?:[.,]\d+)?)\s*(?:rb|k|ribu)\b/i;
  const rbMatch = lower.match(rbRegex);
  if (rbMatch) {
    const rawNum = rbMatch[1].replace(",", ".");
    const val = parseFloat(rawNum);
    if (!isNaN(val) && val > 0) {
      return { amount: Math.round(val * 1_000), matchedText: rbMatch[0] };
    }
  }

  // Pattern 3: Explicit Rp with standard formatting (e.g. Rp 50.000, Rp. 1.500.000, Rp 25000)
  const rpRegex = /rp\.?\s*(\d{1,3}(?:\.\d{3})+|\d{4,})\b/i;
  const rpMatch = lower.match(rpRegex);
  if (rpMatch) {
    const cleanNum = rpMatch[1].replace(/\./g, "");
    const val = parseInt(cleanNum, 10);
    if (!isNaN(val) && val > 0) {
      return { amount: val, matchedText: rpMatch[0] };
    }
  }

  // Pattern 4: Dot formatted number without Rp (e.g. "50.000", "1.500.000")
  const dotRegex = /\b(\d{1,3}(?:\.\d{3})+)\b/;
  const dotMatch = lower.match(dotRegex);
  if (dotMatch) {
    const cleanNum = dotMatch[1].replace(/\./g, "");
    const val = parseInt(cleanNum, 10);
    if (!isNaN(val) && val > 0) {
      return { amount: val, matchedText: dotMatch[0] };
    }
  }

  // Pattern 5: Plain number of 4+ digits (e.g. 35000, 50000, 150000)
  const plainRegex = /(?<!(?:tahun|thn)\s*)\b(\d{4,9})\b/;
  const plainMatch = lower.match(plainRegex);
  if (plainMatch) {
    const val = parseInt(plainMatch[1], 10);
    if (val >= 2020 && val <= 2030 && !lower.includes("rp")) {
      // Ignore isolated calendar years
    } else if (!isNaN(val) && val > 0) {
      return { amount: val, matchedText: plainMatch[0] };
    }
  }

  return null;
}

/** 1. Natural Language Quick Add with 1-click transaction creation */
function parseQuickAddTransaction(
  rawQuery: string,
  q: string,
  ctx: FinancialContext,
  userName: string
): GhostResponse | null {
  const isQuestion =
    q.includes("berapa") ||
    q.includes("apakah") ||
    q.includes("bagaimana") ||
    q.includes("bisa gak") ||
    q.includes("boleh beli") ||
    q.includes("mampu gak") ||
    q.includes("aman gak") ||
    q.startsWith("cari ") ||
    q.startsWith("cek ");

  if (isQuestion) return null;

  const parsedAmt = parseAmount(rawQuery);
  if (!parsedAmt) return null;

  // Determine intent trigger
  const triggers = [
    "catat", "tambah", "tambahkan", "masukkan", "input", "simpan", "beli", "jajan",
    "bayar", "transfer", "kirim", "isi", "topup", "top up", "gaji", "bonus", "masuk",
    "kopi", "makan", "bensin", "wifi", "pulsa", "listrik", "sepatu", "baju", "snack"
  ];
  const hasTrigger = triggers.some((t) => q.includes(t));
  if (!hasTrigger) return null;

  // Determine transaction type
  let type: "expense" | "income" | "transfer" = "expense";
  if (
    q.includes("gaji") ||
    q.includes("bonus") ||
    q.includes("pemasukan") ||
    q.includes("masuk") ||
    q.includes("terima") ||
    q.includes("dapat duit") ||
    q.includes("dapat uang") ||
    q.includes("penjualan") ||
    q.includes("thr") ||
    q.includes("dividen")
  ) {
    type = "income";
  } else if (
    q.includes("transfer ke") ||
    q.includes("pindah saldo") ||
    q.includes("pindah dana") ||
    q.includes("kirim saldo")
  ) {
    type = "transfer";
  }

  // Account matching
  let targetAccount = ctx.accounts.find((a) => {
    if (!a.isActive) return false;
    return q.includes(a.name.toLowerCase());
  });

  if (!targetAccount) {
    const aliases: Record<string, string[]> = {
      bca: ["bca", "bank bca", "debit bca"],
      mandiri: ["mandiri", "bank mandiri", "livin"],
      bri: ["bri", "bank bri", "brimo"],
      bni: ["bni", "bank bni"],
      cimb: ["cimb", "niaga", "octo"],
      jago: ["jago", "bank jago"],
      seabank: ["seabank", "sea bank"],
      gopay: ["gopay", "go-pay", "go pay"],
      ovo: ["ovo"],
      dana: ["dana"],
      shopeepay: ["shopeepay", "spay", "shopee pay"],
      tunai: ["tunai", "cash", "dompet", "uang fisik"],
    };

    for (const [key, aliasList] of Object.entries(aliases)) {
      if (aliasList.some((alias) => q.includes(alias))) {
        targetAccount = ctx.accounts.find(
          (a) =>
            a.name.toLowerCase().includes(key) ||
            aliasList.some((alias) => a.name.toLowerCase().includes(alias))
        );
        if (targetAccount) break;
      }
    }
  }

  if (!targetAccount) {
    targetAccount = ctx.accounts.find((a) => a.isActive) || ctx.accounts[0];
  }

  // Description extraction & cleanup
  let desc = rawQuery;
  desc = desc.replace(new RegExp(parsedAmt.matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  const removeWords = [
    "catat", "tambah", "tambahkan", "masukkan", "input", "simpan", "transaksi", "pengeluaran",
    "pemasukan", "sebesar", "senilai", "dari", "ke", "pakai", "pake", "lewat", "via", "di",
    "rekening", "akun", "saldo", "dong", "tolong", "buat", "untuk"
  ];
  if (targetAccount) {
    removeWords.push(targetAccount.name.toLowerCase());
  }
  for (const w of removeWords) {
    desc = desc.replace(new RegExp(`\\b${w}\\b`, "gi"), " ");
  }
  desc = desc.replace(/\s+/g, " ").trim();

  if (desc.length > 0) {
    desc = desc
      .split(" ")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  } else {
    desc = type === "income" ? "Pemasukan Baru" : type === "transfer" ? "Transfer Saldo" : "Pengeluaran Baru";
  }

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const day = now.getDate();
  const monthName = MONTH_NAMES_ID[now.getMonth()];
  const year = now.getFullYear();

  return {
    text: `Boo! 👻 Siap catat! Aku mendeteksi rencana pencatatan transaksi berikut. Klik tombol **Simpan Transaksi Ini** di bawah untuk langsung membukukannya ke akun **${targetAccount?.name || "Utama"}**!`,
    mood: "happy",
    dataCard: {
      type: "quick_add",
      title: "📝 Catat Transaksi Cepat",
      subtitle: "Tinjau detail sebelum disimpan ke buku kas",
      totalAmount: parsedAmt.amount,
      formattedTotal: formatIDR(parsedAmt.amount),
      items: [
        { label: "Tipe Transaksi", value: type === "income" ? "Pemasukan 💰" : type === "transfer" ? "Transfer Saldo 🔄" : "Pengeluaran 💸" },
        { label: "Keterangan", value: desc },
        { label: "Nominal", value: formatIDR(parsedAmt.amount) },
        { label: "Rekening Tujuan", value: targetAccount?.name || "Akun Utama" },
        { label: "Tanggal", value: `Hari Ini (${day} ${monthName} ${year})` },
      ],
      statusBadge: {
        label: "Draft Siap Simpan ✨",
        isPositive: true,
      },
      action: {
        label: "💾 Simpan Transaksi Ini",
        type: "quick_create_tx",
        payload: {
          type,
          accountId: targetAccount ? targetAccount.id : (ctx.accounts[0]?.id || ""),
          amount: parsedAmt.amount,
          date: todayStr,
          description: desc,
          note: "Dicatat otomatis via Racks AI Chat",
        },
      },
      tip: "Setelah kamu mengklik simpan, saldo rekening akan langsung di-update secara otomatis tanpa perlu membuka form tambah transaksi!",
    },
    suggestedPrompts: [
      "Hari ini habis berapa?",
      "Berapa total pengeluaranku?",
      "Bagaimana arus kasku (cash flow)?",
    ],
  };
}

/** 2. Merchant & Keyword Transaction Search */
function handleMerchantSearch(
  q: string,
  allTx: any[],
  userName: string
): GhostResponse | null {
  const isSearchIntent =
    q.startsWith("cari ") ||
    q.includes("riwayat ") ||
    q.includes("cek transaksi ") ||
    q.includes("belanja di ") ||
    q.includes("transaksi di ") ||
    q.includes("pernah belanja ");

  if (!isSearchIntent) return null;

  let cleanKw = q;
  const prefixes = [
    "cari transaksi",
    "riwayat belanja",
    "riwayat transaksi",
    "riwayat",
    "pernah belanja apa di",
    "pernah belanja di",
    "belanja di",
    "transaksi di",
    "cek transaksi",
    "cari pengeluaran",
    "cari",
  ];
  for (const p of prefixes) {
    if (cleanKw.startsWith(p)) {
      cleanKw = cleanKw.slice(p.length).trim();
      break;
    }
  }

  cleanKw = cleanKw.replace(/[?!.,]/g, "").trim();
  if (!cleanKw || cleanKw.length < 2) return null;

  const matches = allTx.filter((t) => {
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    return combined.includes(cleanKw);
  });

  const total = matches.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const count = matches.length;
  const avg = count > 0 ? Math.round(total / count) : 0;

  if (count === 0) {
    return {
      text: `Boo! 👻 Aku sudah menggeledah seluruh buku kasmu, tapi belum menemukan transaksi dengan kata kunci **"${cleanKw}"**, ${userName}. Coba periksa ejaannya atau cari merchant lainnya!`,
      mood: "idle",
      dataCard: {
        type: "merchant_search",
        title: `🔍 Riwayat: "${cleanKw.toUpperCase()}"`,
        subtitle: "0 transaksi ditemukan",
        totalAmount: 0,
        formattedTotal: formatIDR(0),
        items: [],
        statusBadge: {
          label: "Tidak Ditemukan 🔍",
          isPositive: false,
        },
        tip: "Kamu bisa menambahkan transaksi baru kapan saja lewat prompt seperti 'catat jajan indomaret 35rb'.",
      },
      suggestedPrompts: [
        "Berapa total pengeluaranku?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  const items: GhostDataCardItem[] = matches.slice(0, 5).map((t) => {
    const dStr = formatShortDate(t.date);
    return {
      label: `${t.description || cleanKw}${dStr ? ` (${dStr})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#3b82f6",
    };
  });

  return {
    text: `Ketemu! 🕵️‍♂️👻 Ditemukan **${count} transaksi** terkait **"${cleanKw}"** dengan total akumulasi **${formatIDR(
      total
    )}** (rata-rata **${formatIDR(avg)}** per transaksi).`,
    mood: "happy",
    dataCard: {
      type: "merchant_search",
      title: `🔍 Riwayat: "${cleanKw.toUpperCase()}"`,
      subtitle: `${count} transaksi tercatat • Rata-rata ${formatIDR(avg)}`,
      totalAmount: total,
      formattedTotal: formatIDR(total),
      items,
      statusBadge: {
        label: `${count} Transaksi Ditemukan ✨`,
        isPositive: true,
      },
      tip: `Total belanjamu pada kata kunci ini sebesar ${formatIDR(total)}. Selalu periksa apakah pengeluaran ini sudah sesuai anggaran!`,
    },
    suggestedPrompts: [
      "Kategori apa yang paling boros?",
      "Hari ini habis berapa?",
      "Bagaimana arus kasku (cash flow)?",
    ],
  };
}

/** 3. Account Balance Audit & Specific Account Inquiries */
function handleAccountAudit(
  q: string,
  ctx: FinancialContext,
  allTx: any[],
  userName: string
): GhostResponse | null {
  const isAuditIntent =
    q.includes("saldo") ||
    q.includes("rekening") ||
    q.includes("uangku di") ||
    q.includes("audit akun") ||
    q.includes("cek saldo");

  if (!isAuditIntent) return null;
  if (q.includes("catat") || q.includes("tambah") || q.includes("transfer ke")) return null;

  const activeAccounts = ctx.accounts.filter((a) => a.isActive);

  const isAllAccounts =
    q.includes("semua") ||
    q.includes("seluruh") ||
    q.includes("daftar") ||
    q.includes("total saldo") ||
    q === "saldo" ||
    q === "cek saldo";

  if (isAllAccounts) {
    const totalBalance = activeAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    const items: GhostDataCardItem[] = activeAccounts.map((a) => ({
      label: a.name,
      value: a.balance,
      formattedValue: formatIDR(a.balance),
      color: "#10b981",
    }));

    return {
      text: `Boo! 🏦👻 Berikut status seluruh saldo akun aktifmu, ${userName}. Total simpanan likuidmu adalah **${formatIDR(
        totalBalance
      )}** tersebar di **${activeAccounts.length} rekening**!`,
      mood: "happy",
      dataCard: {
        type: "account_audit",
        title: "🏦 Ringkasan Seluruh Rekening",
        subtitle: `${activeAccounts.length} rekening aktif dipantau`,
        totalAmount: totalBalance,
        formattedTotal: formatIDR(totalBalance),
        items,
        statusBadge: {
          label: "Status Kas Likuid 💵",
          isPositive: true,
        },
        tip: "Pastikan dana operasional dan dana darurat dipisahkan pada rekening yang berbeda agar tidak tercampur untuk belanja impulsif.",
      },
      suggestedPrompts: [
        "Berapa bulan dana daruratku bisa bertahan?",
        "Bagaimana arus kasku (cash flow)?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  let targetAccount = activeAccounts.find((a) => q.includes(a.name.toLowerCase()));
  if (!targetAccount) {
    const nicknames: Record<string, string[]> = {
      bca: ["bca", "bank bca"],
      mandiri: ["mandiri", "bank mandiri", "livin"],
      bri: ["bri", "bank bri", "brimo"],
      bni: ["bni", "bank bni"],
      cimb: ["cimb", "niaga"],
      jago: ["jago", "bank jago"],
      seabank: ["seabank", "sea bank"],
      gopay: ["gopay", "go-pay", "go pay"],
      ovo: ["ovo"],
      dana: ["dana"],
      shopeepay: ["shopeepay", "spay"],
      tunai: ["tunai", "cash", "dompet"],
    };
    for (const [key, aliasList] of Object.entries(nicknames)) {
      if (aliasList.some((alias) => q.includes(alias))) {
        targetAccount = activeAccounts.find(
          (a) =>
            a.name.toLowerCase().includes(key) ||
            aliasList.some((alias) => a.name.toLowerCase().includes(alias))
        );
        if (targetAccount) break;
      }
    }
  }

  if (!targetAccount) return null;

  const accTx = allTx.filter(
    (t) => (t as any).accountId === targetAccount!.id || (t as any).account_id === targetAccount!.id
  );

  const items: GhostDataCardItem[] = accTx.slice(0, 5).map((t) => {
    const dStr = formatShortDate(t.date);
    const isInc = t.type === "income";
    return {
      label: `${t.description || "Transaksi"}${dStr ? ` (${dStr})` : ""}`,
      value: t.amount,
      formattedValue: `${isInc ? "+" : "-"}${formatIDR(t.amount)}`,
      color: isInc ? "#10b981" : "#ef4444",
    };
  });

  return {
    text: `Boo! 💳👻 Saldo terkini di akun **${targetAccount.name}** adalah **${formatIDR(
      targetAccount.balance
    )}**. Ada ${accTx.length} mutasi yang tercatat di akun ini.`,
    mood: "happy",
    dataCard: {
      type: "account_audit",
      title: `💳 Audit Rekening: ${targetAccount.name}`,
      subtitle: `Tipe: ${targetAccount.type || "Bank"} • Saldo Aktif`,
      totalAmount: targetAccount.balance,
      formattedTotal: formatIDR(targetAccount.balance),
      items,
      statusBadge: {
        label: targetAccount.balance > 0 ? "Saldo Positif ✅" : "Saldo Kosong / Minus ⚠️",
        isPositive: targetAccount.balance > 0,
      },
      tip: "Gunakan rekening ini secara konsisten agar tracking pengeluaran bulanan tetap akurat.",
    },
    suggestedPrompts: [
      "Berapa total pengeluaranku?",
      "Cek saldo semua rekening",
      "Kondisi keuanganku sehat gak?",
    ],
  };
}

/** 4. Affordability Simulation ("Boleh beli X Rp Y gak?") */
function handleAffordabilitySimulation(
  rawQuery: string,
  q: string,
  ctx: FinancialContext,
  userName: string,
  totalBalance: number,
  netSurplus: number
): GhostResponse | null {
  const isAffordIntent =
    (q.includes("boleh beli") ||
      q.includes("bisa beli") ||
      q.includes("bisa gak beli") ||
      q.includes("mampu gak beli") ||
      q.includes("aman gak beli") ||
      q.includes("mau beli") ||
      q.includes("cukup gak beli")) &&
    (q.includes("gak") || q.includes("nggak") || q.includes("apakah") || q.includes("bisa") || q.includes("boleh") || q.includes("cukup"));

  if (!isAffordIntent) return null;

  const parsed = parseAmount(rawQuery);
  if (!parsed) return null;

  const price = parsed.amount;

  let item = rawQuery;
  item = item.replace(new RegExp(parsed.matchedText.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi"), "");
  const cleanPhrases = [
    "boleh beli", "bisa gak beli", "bisa beli", "mampu gak beli", "mampu beli",
    "aman gak beli", "aman beli", "mau beli", "cukup gak beli", "cukup beli",
    "apakah saya bisa", "apakah boleh", "apakah bisa", "duitku cukup gak",
    "uangku cukup gak", "gak ya", "nggak ya", "gak", "nggak", "ya", "dong",
  ];
  for (const phrase of cleanPhrases) {
    item = item.replace(new RegExp(phrase, "gi"), " ");
  }
  item = item.replace(/\s+/g, " ").trim();
  if (item.length > 0) {
    item = item.split(" ").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
  } else {
    item = "Barang Impian";
  }

  let statusLabel = "";
  let isPositive = false;
  let text = "";
  let mood: GhostMood = "happy";
  let tip = "";

  const balanceRatio = totalBalance > 0 ? (price / totalBalance) * 100 : 999;

  if (price > totalBalance) {
    statusLabel = "⛔ Saldo Tidak Mencukupi";
    isPositive = false;
    mood = "spooky";
    text = `Waduh! 👻 Harganya **${formatIDR(price)}**, sedangkan total seluruh saldomu saat ini adalah **${formatIDR(
      totalBalance
    )}**. Kasmu masih kurang **${formatIDR(price - totalBalance)}**. Jangan memaksakan diri berutang konsumtif ya, ${userName}!`;
    tip = "Fokus kumpulkan tabungan terlebih dahulu dan hindari paylater atau pinjol berbunga tinggi.";
  } else if (balanceRatio > 50) {
    statusLabel = "⚠️ Berisiko Tinggi (>50% Saldo)";
    isPositive = false;
    mood = "thinking";
    text = `Peringatan dari roh keuangan! 👻 Saldomu (${formatIDR(
      totalBalance
    )}) memang cukup, TAPI pembelian **${item}** seharga **${formatIDR(
      price
    )}** akan memangkas **${balanceRatio.toFixed(1)}%** dari seluruh uang likuidmu. Ini bisa melumpuhkan dana daruratmu!`;
    tip = "Jika bukan kebutuhan mendesak, lebih aman menyisihkan surplus bulanan bertahap ketimbang menguras tabungan pokok.";
  } else if (netSurplus > 0 && price <= netSurplus) {
    statusLabel = "✅ Sangat Aman (Tertutup Surplus)";
    isPositive = true;
    mood = "happy";
    text = `Kabar gembira! 🎉 Kamu **sangat mampu** membeli **${item}** seharga **${formatIDR(
      price
    )}**! Surplus kas bersihmu bulan ini (${formatIDR(
      netSurplus
    )}) sanggup menutupnya secara lunas tanpa mengganggu tabungan dana daruratmu.`;
    tip = "Tetap prioritaskan kewajiban bulanan dan tabungan investasi sebelum eksekusi pembelian.";
  } else {
    const monthlySaving = netSurplus > 0 ? netSurplus : Math.max(Math.round(totalBalance * 0.1), 500000);
    const months = Math.ceil(price / monthlySaving);
    statusLabel = `💡 Disarankan Nabung ${months} Bulan`;
    isPositive = true;
    mood = "idle";
    text = `Boo! 👻 Pembelian **${item}** seharga **${formatIDR(
      price
    )}** bisa diwujudkan dengan aman jika kamu menyisihkan sekitar **${formatIDR(
      monthlySaving
    )} / bulan** selama **${months} bulan** ke depan. Cash flow harianmu akan tetap aman!`;
    tip = `Nabung ${months} bulan melatih disiplin finansial dan memastikan pembelian ini benar-benar membawa kebahagiaan jangka panjang.`;
  }

  return {
    text,
    mood,
    dataCard: {
      type: "affordability",
      title: `🛍️ Simulasi Daya Beli: ${item}`,
      subtitle: "Evaluasi dampak terhadap stabilitas finansial",
      totalAmount: price,
      formattedTotal: formatIDR(price),
      items: [
        { label: "Harga Barang", value: formatIDR(price) },
        { label: "Total Saldo Likuid", value: formatIDR(totalBalance) },
        { label: "Surplus Kas Bulan Ini", value: formatIDR(netSurplus) },
        {
          label: "Dampak Terhadap Saldo",
          value: totalBalance > 0 ? `${balanceRatio.toFixed(1)}% kas likuid` : "-",
          color: balanceRatio > 50 ? "#ef4444" : "#10b981",
        },
      ],
      statusBadge: {
        label: statusLabel,
        isPositive,
      },
      tip,
    },
    suggestedPrompts: [
      "Berapa bulan dana daruratku bisa bertahan?",
      "Bagaimana arus kasku (cash flow)?",
      "Kondisi keuanganku sehat gak?",
    ],
  };
}

/** 5. Tax Deductible & Coretax Audit */
function handleTaxAndCoretaxAudit(
  q: string,
  allTx: any[],
  timeFilter: any,
  userName: string
): GhostResponse | null {
  const isTaxIntent =
    q.includes("pajak") ||
    q.includes("tax") ||
    q.includes("coretax") ||
    q.includes("spt") ||
    q.includes("deductible") ||
    q.includes("biaya fiskal") ||
    q.includes("klaim pajak") ||
    q.includes("pengurang pajak");

  if (!isTaxIntent) return null;

  const taxKeywords = [
    "zakat", "infak", "infaq", "sedekah", "donasi", "kitabisa", "wakaf",
    "bpjs", "asuransi", "pelatihan", "kursus", "sertifikasi",
    "server", "domain", "hosting", "software", "lisensi", "atk", "operasional",
  ];

  const deductibleTx = allTx.filter((t) => {
    if (t.type !== "expense") return false;
    if (t.taxDeductible === true || (t as any).tax_deductible === true) return true;
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    return taxKeywords.some((kw) => combined.includes(kw));
  });

  const total = deductibleTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const count = deductibleTx.length;

  const items: GhostDataCardItem[] = deductibleTx.slice(0, 5).map((t) => {
    const dStr = formatShortDate(t.date);
    return {
      label: `${t.description || "Biaya Usaha/Zakat"}${dStr ? ` (${dStr})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#06b6d4",
    };
  });

  return {
    text:
      total > 0
        ? `Boo! 🏛️👻 Aku menemukan **${count} transaksi** senilai **${formatIDR(
            total
          )}** yang berpotensi menjadi **biaya pengurang pajak (tax deductible)** untuk pelaporan SPT Tahunan di portal Coretax DJP!`
        : `Boo! 🏛️ Belum ada transaksi yang terdeteksi sebagai biaya pengurang pajak (deductible) di pembukuanmu, ${userName}.`,
    mood: "happy",
    dataCard: {
      type: "tax_audit",
      title: "🏛️ Audit Pengurang Pajak (Coretax Ready)",
      subtitle: `${count} transaksi berpotensi sebagai pengurang PPh`,
      totalAmount: total,
      formattedTotal: formatIDR(total),
      items,
      statusBadge: {
        label: total > 0 ? "Coretax Deductible Ready 📁" : "Belum Ada Catatan Pajak 📄",
        isPositive: total > 0,
      },
      tip: "Simpan kuitansi resmi, faktur pajak, atau bukti transfer zakat/biaya usaha ke instansi berwenang agar dapat divalidasi saat pelaporan SPT Coretax.",
    },
    suggestedPrompts: [
      "Berapa pemasukanku bulan ini?",
      "Bagaimana arus kasku (cash flow)?",
      "Kondisi keuanganku sehat gak?",
    ],
  };
}

/** 6. Weekend vs Weekday Spending Analysis */
function handleWeekendVsWeekdayAnalysis(
  q: string,
  allTx: any[],
  timeFilter: any,
  userName: string
): GhostResponse | null {
  const isWeekendIntent =
    q.includes("weekend") ||
    q.includes("akhir pekan") ||
    q.includes("hari kerja") ||
    q.includes("weekday") ||
    q.includes("sabtu minggu");

  if (!isWeekendIntent) return null;

  const expenses = allTx.filter((t) => t.type === "expense" && timeFilter.matchesDate(t.date));

  let weekendTotal = 0;
  let weekendCount = 0;
  let weekdayTotal = 0;
  let weekdayCount = 0;

  for (const t of expenses) {
    if (!t.date) continue;
    const day = new Date(t.date).getDay();
    const amt = Number(t.amount || 0);
    if (day === 0 || day === 6) {
      weekendTotal += amt;
      weekendCount++;
    } else {
      weekdayTotal += amt;
      weekdayCount++;
    }
  }

  const isWeekendHeavier = weekendTotal > weekdayTotal;

  const items: GhostDataCardItem[] = [
    {
      label: `Akhir Pekan (Sabtu & Minggu: ${weekendCount} tx)`,
      value: weekendTotal,
      formattedValue: formatIDR(weekendTotal),
      color: "#ec4899",
    },
    {
      label: `Hari Kerja (Senin - Jumat: ${weekdayCount} tx)`,
      value: weekdayTotal,
      formattedValue: formatIDR(weekdayTotal),
      color: "#3b82f6",
    },
  ];

  return {
    text: isWeekendHeavier
      ? `Boo! 🏖️👻 Kamu terbukti **jauh lebih boros di akhir pekan**! Total belanja weekend mencapai **${formatIDR(
          weekendTotal
        )}** (${weekendCount} transaksi) dibanding hari kerja sebesar **${formatIDR(weekdayTotal)}**.`
      : `Boo! 💼👻 Pengeluaranmu lebih banyak terjadi di **hari kerja** (**${formatIDR(
          weekdayTotal
        )}** vs **${formatIDR(weekendTotal)}** di akhir pekan). Akhir pekanmu relatif terkendali!`,
    mood: isWeekendHeavier ? "thinking" : "happy",
    dataCard: {
      type: "spending_pattern",
      title: "⚖️ Komparasi Belanja Weekend vs Hari Kerja",
      subtitle: `Analisis kebiasaan belanja pada ${timeFilter.rangeLabel}`,
      totalAmount: weekendTotal + weekdayTotal,
      formattedTotal: formatIDR(weekendTotal + weekdayTotal),
      items,
      statusBadge: {
        label: isWeekendHeavier ? "Weekend Lebih Boros 🏖️" : "Weekday Lebih Tinggi 💼",
        isPositive: !isWeekendHeavier,
      },
      tip: isWeekendHeavier
        ? "Tentukan budget nongkrong weekend khusus di awal minggu agar belanja impulsif tidak membobol tabunganmu."
        : "Pertahankan kendali pengeluaran akhir pekan yang sehat ini!",
    },
    suggestedPrompts: [
      "Kapan hari paling boros saya?",
      "Berapa pengeluaran kopi saya bulan ini?",
      "Kategori apa yang paling boros?",
    ],
  };
}

/** 7. Saving Rate & Investment Ratio Audit */
function handleSavingRateAudit(
  q: string,
  totalInflow: number,
  totalOutflow: number,
  netSurplus: number,
  userName: string
): GhostResponse | null {
  const isSavingRateIntent =
    q.includes("saving rate") ||
    q.includes("rasio tabungan") ||
    q.includes("rasio menabung") ||
    q.includes("persen gajiku ditabung") ||
    q.includes("persen uang yang kutabung") ||
    q.includes("cukup menabung") ||
    q.includes("tabunganku cukup");

  if (!isSavingRateIntent) return null;

  const rate = totalInflow > 0 ? (netSurplus / totalInflow) * 100 : 0;
  let status = "";
  let isPositive = false;
  let mood: GhostMood = "happy";
  let tip = "";

  if (rate < 0) {
    status = "Defisit / Boncos ⚠️";
    isPositive = false;
    mood = "spooky";
    tip = "Kamu mengalami defisit kas (belanja melebihi pemasukan). Segera evaluasi pos pengeluaran terbesar untuk menutup kebocoran!";
  } else if (rate < 10) {
    status = "Kurang Sehat (<10%) ⚠️";
    isPositive = false;
    mood = "thinking";
    tip = "Rasio tabungan di bawah 10% rentan saat terjadi guncangan ekonomi. Coba naikkan 1% setiap bulan secara bertahap.";
  } else if (rate < 20) {
    status = "Standar Sehat (10% - 20%) 👍";
    isPositive = true;
    mood = "happy";
    tip = "Rasio menabungmu sudah berada di jalur yang baik! Target berikutnya adalah menembus 20% ke atas demi mempercepat kebebasan finansial.";
  } else if (rate < 50) {
    status = "Sangat Ideal (>20%) 🏆";
    isPositive = true;
    mood = "happy";
    tip = "Luar biasa! Rasio menabung di atas 20% merupakan fondasi kokoh untuk mengakumulasi kekayaan dan investasi masa depan.";
  } else {
    status = "FIRE Champion (>50%) 🔥";
    isPositive = true;
    mood = "happy";
    tip = "Gaya hidupmu sangat efisien! Kamu berada di jalur express menuju Financial Independence, Retire Early (FIRE).";
  }

  const items: GhostDataCardItem[] = [
    { label: "Pemasukan Bulanan", value: totalInflow, formattedValue: formatIDR(totalInflow), color: "#10b981" },
    { label: "Pengeluaran Bulanan", value: totalOutflow, formattedValue: formatIDR(totalOutflow), color: "#ef4444" },
    { label: "Sisa Surplus Bersih", value: netSurplus, formattedValue: formatIDR(netSurplus), color: "#3b82f6" },
    { label: "Saving Rate Saat Ini", value: `${rate.toFixed(1)}%`, formattedValue: `${rate.toFixed(1)}%`, color: rate >= 20 ? "#10b981" : "#f59e0b" },
    { label: "Benchmark Ideal", value: "Minimal 20%", formattedValue: "20% - 30%", color: "#8b5cf6" },
  ];

  return {
    text: `Boo! 📊👻 Rasio menabungmu (*Saving Rate*) saat ini berada di angka **${rate.toFixed(
      1
    )}%** dari total pemasukanmu, ${userName}. Dari total inflow **${formatIDR(
      totalInflow
    )}**, kamu berhasil menyisihkan **${formatIDR(netSurplus)}**!`,
    mood,
    dataCard: {
      type: "saving_rate",
      title: "📊 Audit Saving Rate (Rasio Menabung)",
      subtitle: "Tingkat efisiensi penyimpanan kas bulan ini",
      totalAmount: netSurplus,
      formattedTotal: `${rate.toFixed(1)}%`,
      items,
      statusBadge: {
        label: status,
        isPositive,
      },
      tip,
    },
    suggestedPrompts: [
      "Bagaimana arus kasku (cash flow)?",
      "Apakah pembagian gajiku 50/30/20 ideal?",
      "Kapan saya bisa pensiun?",
    ],
  };
}

/** 8. FIRE & Retirement Readiness Calculator */
function handleFireRetirementCalculator(
  q: string,
  totalOutflow: number,
  totalBalance: number,
  netSurplus: number,
  userName: string
): GhostResponse | null {
  const isFireIntent =
    q.includes("pensiun") ||
    q.includes("dana pensiun") ||
    q.includes("fire number") ||
    q.includes("kapan bisa pensiun") ||
    q.includes("simulasi pensiun") ||
    q.includes("retire early");

  if (!isFireIntent) return null;

  const monthlyBurn = totalOutflow > 0 ? totalOutflow : 6000000;
  const annualExpense = monthlyBurn * 12;
  const fireNumber = annualExpense * 25; // 4% Rule
  const progressPct = fireNumber > 0 ? Math.min((totalBalance / fireNumber) * 100, 100) : 0;

  const annualSaving = netSurplus > 0 ? netSurplus * 12 : Math.max(totalBalance * 0.1, 12000000);
  const shortfall = Math.max(fireNumber - totalBalance, 0);
  const estYears = annualSaving > 0 ? Math.max(Math.ceil(shortfall / (annualSaving * 1.4)), 1) : 30;

  const items: GhostDataCardItem[] = [
    { label: "Pengeluaran Tahunan", value: annualExpense, formattedValue: formatIDR(annualExpense) },
    { label: "Target FIRE (25x Pengeluaran)", value: fireNumber, formattedValue: formatIDR(fireNumber), color: "#8b5cf6" },
    { label: "Aset Likuid Saat Ini", value: totalBalance, formattedValue: formatIDR(totalBalance), color: "#10b981" },
    { label: "Kekurangan Dana", value: shortfall, formattedValue: formatIDR(shortfall), color: "#f59e0b" },
    { label: "Progres Terkumpul", value: `${progressPct.toFixed(1)}%`, formattedValue: `${progressPct.toFixed(1)}%` },
  ];

  return {
    text: `Boo! 🏖️👻 Menurut prinsip **FIRE (Financial Independence, Retire Early)** dengan aturan 4% (*Safe Withdrawal Rate*), kamu butuh aset produktif sekitar **${formatIDR(
      fireNumber
    )}** untuk pensiun nyaman dengan gaya hidupmu saat ini! Progresmu saat ini sudah mencapai **${progressPct.toFixed(
      1
    )}%**.`,
    mood: "happy",
    dataCard: {
      type: "fire_retirement",
      title: "🏖️ Kalkulator FIRE & Dana Pensiun",
      subtitle: "Target kebebasan finansial berdasarkan 25x pengeluaran tahunan",
      totalAmount: fireNumber,
      formattedTotal: formatIDR(fireNumber),
      items,
      statusBadge: {
        label: `Progres: ${progressPct.toFixed(1)}% Menuju FIRE 🎯`,
        isPositive: progressPct >= 10,
      },
      tip: `Jika kamu menginvestasikan surplus kas secara rutin di instrumen produktif (imbal hasil ~6-8% per tahun), target ini diproyeksikan tercapai dalam waktu ~${estYears} tahun.`,
    },
    suggestedPrompts: [
      "Berapa rasio tabunganku?",
      "Berapa bulan dana daruratku bisa bertahan?",
      "Bagaimana arus kasku (cash flow)?",
    ],
  };
}

/** 9. Zombie Subscriptions & Recurring SaaS Audit */
function handleZombieSubscriptions(
  q: string,
  allTx: any[],
  userName: string
): GhostResponse | null {
  const isSubIntent =
    q.includes("langganan zombie") ||
    q.includes("audit langganan") ||
    q.includes("langganan terlupakan") ||
    q.includes("langganan yang jarang") ||
    q.includes("cek saas") ||
    q.includes("subscription audit") ||
    q.includes("langganan digital");

  if (!isSubIntent) return null;

  const subKeywords = [
    "netflix", "spotify", "youtube", "chatgpt", "openai", "icloud", "google storage",
    "adobe", "canva", "disney", "vidio", "prime video", "midjourney", "gym", "fitness",
    "duolingo", "playstation", "xbox", "apple.com", "subscri", "langganan"
  ];

  const matched = allTx.filter((t) => {
    if (t.type !== "expense") return false;
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    return subKeywords.some((kw) => combined.includes(kw));
  });

  const totalMonthly = matched.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const totalAnnual = totalMonthly * 12;

  const items: GhostDataCardItem[] = matched.slice(0, 6).map((t) => ({
    label: `${t.description || "Langganan"} (${formatShortDate(t.date)})`,
    value: t.amount,
    formattedValue: `${formatIDR(t.amount)}/bln`,
    color: "#a855f7",
  }));

  return {
    text:
      totalMonthly > 0
        ? `Boo! 📺👻 Terdeteksi **${matched.length} layanan langganan aktif** dengan total pengeluaran **${formatIDR(
            totalMonthly
          )} / bulan**. Jika dihitung setahun, kamu mengeluarkan **${formatIDR(totalAnnual)}**!`
        : `Boo! 📺 Tidak terdeteksi transaksi langganan digital yang mencurigakan di pembukuanmu, ${userName}.`,
    mood: totalMonthly > 300000 ? "thinking" : "happy",
    dataCard: {
      type: "zombie_subscriptions",
      title: "📺 Audit Langganan Digital & Zombie SaaS",
      subtitle: `${matched.length} layanan terdeteksi • Estimasi ${formatIDR(totalAnnual)} / tahun`,
      totalAmount: totalMonthly,
      formattedTotal: `${formatIDR(totalMonthly)} / bln`,
      items,
      statusBadge: {
        label: totalMonthly > 300000 ? "Beban Langganan Tinggi ⚠️" : "Terkendali ✨",
        isPositive: totalMonthly <= 300000,
      },
      tip: "Batalkan setidaknya 1 layanan yang jarang kamu tonton atau pakai bulan ini. Kamu bisa menghemat ratusan ribu per tahun tanpa mengubah kualitas hidup!",
    },
    suggestedPrompts: [
      "Pengeluaran receh apa yang numpuk?",
      "Kategori apa yang paling boros?",
      "Berapa total pengeluaranku?",
    ],
  };
}

/** 10. Food Delivery & Shipping Surcharge Audit */
function handleDeliveryFeeAudit(
  q: string,
  allTx: any[],
  timeFilter: any,
  userName: string
): GhostResponse | null {
  const isDeliveryIntent =
    q.includes("ongkir") ||
    q.includes("gofood") ||
    q.includes("grabfood") ||
    q.includes("shopeefood") ||
    q.includes("biaya delivery") ||
    q.includes("ongkos kirim") ||
    q.includes("pesan antar");

  if (!isDeliveryIntent) return null;

  const deliveryKeywords = [
    "gofood", "grabfood", "shopeefood", "ongkir", "jnt", "jne", "sicepat",
    "delivery", "lalamove", "paxel", "antar"
  ];

  const matched = allTx.filter((t) => {
    if (t.type !== "expense") return false;
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    return deliveryKeywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
  });

  const total = matched.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const count = matched.length;
  const avg = count > 0 ? Math.round(total / count) : 0;
  const estimatedMarkup = Math.round(total * 0.20);

  const items: GhostDataCardItem[] = matched.slice(0, 5).map((t) => ({
    label: `${t.description || "Delivery"} (${formatShortDate(t.date)})`,
    value: t.amount,
    formattedValue: formatIDR(t.amount),
    color: "#f97316",
  }));

  return {
    text:
      total > 0
        ? `Nyam! 🛵👻 Untuk **${timeFilter.rangeLabel}**, kamu telah memesan pesan antar makanan / ekspedisi sebanyak **${count} kali** dengan total **${formatIDR(
            total
          )}** (rata-rata **${formatIDR(avg)}** per transaksi). Diperkirakan sekitar **${formatIDR(
            estimatedMarkup
          )}** merupakan biaya ongkir & markup aplikasi!`
        : `Boo! 🛵 Tidak ada riwayat GoFood, ShopeeFood, atau ongkir yang tercatat untuk **${timeFilter.rangeLabel}**, ${userName}.`,
    mood: total > 500000 ? "thinking" : "happy",
    dataCard: {
      type: "delivery_fees",
      title: "🛵 Audit Pesan Antar & Biaya Ongkir",
      subtitle: `${count} pesanan pada ${timeFilter.rangeLabel}`,
      totalAmount: total,
      formattedTotal: formatIDR(total),
      items,
      statusBadge: {
        label: total > 500000 ? "Delivery Sering 🛵🔥" : "Porsi Wajar ✨",
        isPositive: total <= 500000,
      },
      tip: "Memasak di rumah atau membeli makan langsung saat perjalanan pulang bisa menghemat hingga 20% biaya layanan dan ongkir aplikasi setiap bulannya.",
    },
    suggestedPrompts: [
      "Berapa pengeluaran makan di luar?",
      "Pengeluaran receh apa yang numpuk?",
      "Kategori apa yang paling boros?",
    ],
  };
}

/** 11. Single Biggest Purchase Analysis */
function handleBiggestPurchaseAnalysis(
  q: string,
  allExpenses: any[],
  totalOutflow: number,
  timeFilter: any,
  userName: string
): GhostResponse | null {
  const isBiggestIntent =
    q.includes("transaksi termahal") ||
    q.includes("belanjaan paling mahal") ||
    q.includes("pengeluaran paling besar") ||
    q.includes("transaksi terbesar bulan ini") ||
    q.includes("paling mahal") ||
    q.includes("single purchase");

  if (!isBiggestIntent) return null;

  const currentExpenses = allExpenses.filter((t) => timeFilter.matchesDate(t.date));
  if (currentExpenses.length === 0) return null;

  const maxTx = currentExpenses.reduce(
    (max, t) => (Number(t.amount || 0) > Number(max?.amount || 0) ? t : max),
    currentExpenses[0]
  );

  const pct = totalOutflow > 0 ? ((Number(maxTx.amount || 0) / totalOutflow) * 100).toFixed(1) : "0";

  const items: GhostDataCardItem[] = [
    { label: "Keterangan", value: maxTx.description || "Transaksi Puncak" },
    { label: "Nominal", value: maxTx.amount, formattedValue: formatIDR(maxTx.amount), color: "#ef4444" },
    { label: "Kategori", value: maxTx.category?.name || "Lainnya" },
    { label: "Tanggal Transaksi", value: formatShortDate(maxTx.date) },
    { label: "Porsi dari Total Belanja", value: `${pct}%`, formattedValue: `${pct}% dari kas keluar`, color: "#f59e0b" },
  ];

  return {
    text: `Boo! 💎👻 Transaksi termahalmu pada **${timeFilter.rangeLabel}** adalah **"${
      maxTx.description || "Transaksi"
    }"** senilai **${formatIDR(maxTx.amount)}** (menyumbang **${pct}%** dari total seluruh pengeluaranmu bulan ini).`,
    mood: "happy",
    dataCard: {
      type: "biggest_purchase",
      title: "💎 Transaksi Termahal Periode Ini",
      subtitle: "Satu transaksi puncak pemakan porsi kas terbesar",
      totalAmount: maxTx.amount,
      formattedTotal: formatIDR(maxTx.amount),
      items,
      statusBadge: {
        label: `Puncak Belanja: ${pct}% Total 💸`,
        isPositive: Number(pct) <= 30,
      },
      tip: "Terapkan aturan '72-Hour Rule' (tunggu 3 hari sebelum membeli barang non-esensial berharga di atas 1 juta) untuk meminimalkan penyesalan belanja impulsif.",
    },
    suggestedPrompts: [
      "Kategori apa yang paling boros?",
      "Hari apa saya paling boros?",
      "Berapa total pengeluaranku?",
    ],
  };
}

/** 12. Windfall, Bonus & THR Allocation Planner */
function handleWindfallPlanner(
  rawQuery: string,
  q: string,
  userName: string
): GhostResponse | null {
  const isWindfallIntent =
    q.includes("thr") ||
    q.includes("bonus tahunan") ||
    q.includes("alokasi bonus") ||
    q.includes("uang kaget") ||
    q.includes("rezeki nomplok") ||
    q.includes("windfall");

  if (!isWindfallIntent) return null;

  const parsed = parseAmount(rawQuery);
  const amount = parsed ? parsed.amount : 10000000;

  const invShare = Math.round(amount * 0.40);
  const emergencyShare = Math.round(amount * 0.30);
  const charityShare = Math.round(amount * 0.20);
  const funShare = Math.round(amount * 0.10);

  const items: GhostDataCardItem[] = [
    { label: "1. Investasi & Bayar Utang (40%)", value: invShare, formattedValue: formatIDR(invShare), color: "#10b981" },
    { label: "2. Penguat Dana Darurat (30%)", value: emergencyShare, formattedValue: formatIDR(emergencyShare), color: "#3b82f6" },
    { label: "3. Zakat, Sedekah & Keluarga (20%)", value: charityShare, formattedValue: formatIDR(charityShare), color: "#06b6d4" },
    { label: "4. Self-Reward Bebas Rasa Bersalah (10%)", value: funShare, formattedValue: formatIDR(funShare), color: "#ec4899" },
  ];

  return {
    text: `Alhamdulillah / Selamat! 🎉👻 Mendapat rezeki atau bonus sebesar **${formatIDR(
      amount
    )}** adalah kesempatan emas untuk melompatkan kesehatan finansialmu, ${userName}. Berikut formula alokasi bijak anti-boncos:`,
    mood: "happy",
    dataCard: {
      type: "windfall_planner",
      title: "🎁 Panduan Alokasi Bonus / THR Cerdas",
      subtitle: `Simulasi pembagian dana ${formatIDR(amount)}`,
      totalAmount: amount,
      formattedTotal: formatIDR(amount),
      items,
      statusBadge: {
        label: "Formula Emas 40-30-20-10 🏆",
        isPositive: true,
      },
      tip: "Kunci mengelola uang kaget adalah menetapkan porsi self-reward secara sadar (10%) di awal. Kamu tetap bisa bersenang-senang tanpa membuat bonus menguap tanpa jejak!",
    },
    suggestedPrompts: [
      "Berapa bulan dana daruratku bisa bertahan?",
      "Apakah pembagian gajiku 50/30/20 ideal?",
      "Kondisi keuanganku sehat gak?",
    ],
  };
}

/** 13. What-if Expense Cut & Compound Growth Simulator */
function handleExpenseCutSimulation(
  rawQuery: string,
  q: string,
  totalOutflow: number,
  userName: string
): GhostResponse | null {
  const isCutIntent =
    q.includes("kalau hemat") ||
    q.includes("kalau kurangi") ||
    q.includes("simulasi hemat") ||
    q.includes("stop jajan") ||
    q.includes("potong pengeluaran") ||
    q.includes("kalau stop");

  if (!isCutIntent) return null;

  const parsed = parseAmount(rawQuery);
  const monthlyCut = parsed ? parsed.amount : Math.max(Math.round(totalOutflow * 0.15), 500000);

  const oneYear = monthlyCut * 12;
  const r3 = 0.06 / 12;
  const n3 = 36;
  const threeYearVal = Math.round(monthlyCut * ((Math.pow(1 + r3, n3) - 1) / r3));

  const r5 = 0.07 / 12;
  const n5 = 60;
  const fiveYearVal = Math.round(monthlyCut * ((Math.pow(1 + r5, n5) - 1) / r5));

  const items: GhostDataCardItem[] = [
    { label: "Penghematan per Bulan", value: monthlyCut, formattedValue: formatIDR(monthlyCut), color: "#f59e0b" },
    { label: "Terkumpul dalam 1 Tahun (Tunai)", value: oneYear, formattedValue: formatIDR(oneYear), color: "#3b82f6" },
    { label: "Investasi 3 Tahun (Imbal hasil 6%)", value: threeYearVal, formattedValue: formatIDR(threeYearVal), color: "#10b981" },
    { label: "Potensi Dana 5 Tahun (Imbal hasil 7%)", value: fiveYearVal, formattedValue: formatIDR(fiveYearVal), color: "#8b5cf6" },
  ];

  return {
    text: `Boo! 🪄👻 Ini keajaiban matematika finansial, ${userName}! Jika kamu memangkas pengeluaran sebesar **${formatIDR(
      monthlyCut
    )} / bulan**, dalam 1 tahun kamu menghemat **${formatIDR(
      oneYear
    )}**. Bila diinvestasikan, nilainya bisa menjadi **${formatIDR(fiveYearVal)}** dalam 5 tahun!`,
    mood: "happy",
    dataCard: {
      type: "expense_cut_sim",
      title: "🪄 Simulasi Hemat & Compound Growth",
      subtitle: `Dampak pemangkasan ${formatIDR(monthlyCut)} / bulan`,
      totalAmount: fiveYearVal,
      formattedTotal: `+${formatIDR(fiveYearVal)}`,
      items,
      statusBadge: {
        label: "Keajaiban Bunga Berbunga ✨",
        isPositive: true,
      },
      tip: "Pengorbanan kecil harian seperti mengurangi kafe atau jajan impulsif bertransformasi menjadi modal usaha atau DP rumah jika dipupuk secara konsisten.",
    },
    suggestedPrompts: [
      "Berapa pengeluaran kopi saya bulan ini?",
      "Pengeluaran receh apa yang numpuk?",
      "Kapan saya bisa pensiun?",
    ],
  };
}

/** 14. Debt Payoff Strategies (Snowball vs Avalanche) */
function handleDebtPayoffStrategy(
  q: string,
  allTx: any[],
  ctx: FinancialContext,
  totalInflow: number,
  userName: string
): GhostResponse | null {
  const isDebtIntent =
    q.includes("lunasi utang") ||
    q.includes("strategi cicilan") ||
    q.includes("debt snowball") ||
    q.includes("debt avalanche") ||
    q.includes("kapan cicilanku lunas") ||
    q.includes("bayar hutang") ||
    q.includes("cara cepat lunas cicilan");

  if (!isDebtIntent) return null;

  const debtKeywords = ["cicilan", "paylater", "kartu kredit", "kpr", "angsuran", "pinjaman", "kredivo", "spaylater"];
  const debtTx = allTx.filter((t) => {
    if (t.type !== "expense") return false;
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    return debtKeywords.some((kw) => combined.includes(kw));
  });

  const totalMonthlyDebt = debtTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
  const dti = totalInflow > 0 ? (totalMonthlyDebt / totalInflow) * 100 : 0;

  const items: GhostDataCardItem[] = [
    { label: "Total Beban Cicilan Bulanan", value: totalMonthlyDebt, formattedValue: formatIDR(totalMonthlyDebt), color: "#ef4444" },
    { label: "Rasio Beban Utang (DTI)", value: `${dti.toFixed(1)}%`, formattedValue: `${dti.toFixed(1)}% (Batas aman <30%)`, color: dti <= 30 ? "#10b981" : "#ef4444" },
    { label: "Strategi 1: Debt Snowball", value: "Lunasi saldo terkecil lebih dulu untuk dorongan psikologis cepat", formattedValue: "Fokus Nominal Kecil", color: "#3b82f6" },
    { label: "Strategi 2: Debt Avalanche", value: "Lunasi bunga/bunga paylater tertinggi dulu untuk hemat matematis", formattedValue: "Fokus Bunga Tinggi", color: "#8b5cf6" },
  ];

  return {
    text: `Boo! 🛡️👻 Beban cicilan bulananmu saat ini tercatat sebesar **${formatIDR(
      totalMonthlyDebt
    )}** (*Debt-to-Income Ratio*: **${dti.toFixed(
      1
    )}%**). Batas aman sehat rasio utang adalah di bawah **30%** dari total pemasukanmu!`,
    mood: dti > 30 ? "thinking" : "happy",
    dataCard: {
      type: "debt_payoff",
      title: "🛡️ Strategi & Akselerasi Pelunasan Cicilan",
      subtitle: "Evaluasi beban cicilan bulanan",
      totalAmount: totalMonthlyDebt,
      formattedTotal: `${dti.toFixed(1)}% DTI`,
      items,
      statusBadge: {
        label: dti <= 30 ? "Rasio Utang Terkendali (<30%) ✅" : "Rasio Utang Tinggi (>30%) ⚠️",
        isPositive: dti <= 30,
      },
      tip: "Pilih metode Snowball jika kamu butuh kepuasan instan melihat jumlah utang berkurang satu per satu, atau Avalanche jika ingin menghemat pengeluaran bunga semaksimal mungkin.",
    },
    suggestedPrompts: [
      "Bagaimana arus kasku (cash flow)?",
      "Kondisi keuanganku sehat gak?",
      "Berapa total pengeluaranku?",
    ],
  };
}

/** 15. Lifestyle Creep Detection */
function handleLifestyleCreepAudit(
  q: string,
  allTx: any[],
  userName: string
): GhostResponse | null {
  const isCreepIntent =
    q.includes("lifestyle creep") ||
    q.includes("inflasi gaya hidup") ||
    q.includes("gaya hidup naik") ||
    q.includes("borosan mana") ||
    q.includes("makin boros") ||
    q.includes("cek pola hidup");

  if (!isCreepIntent) return null;

  const now = new Date();
  const curMonth = now.getMonth();
  const curYear = now.getFullYear();
  const prevMonth = curMonth === 0 ? 11 : curMonth - 1;
  const prevYear = curMonth === 0 ? curYear - 1 : curYear;

  const lifestyleKeywords = ["kopi", "cafe", "makan", "resto", "shopee", "tokped", "belanja", "bioskop", "game", "skincare", "salon"];

  let curLifestyle = 0;
  let prevLifestyle = 0;

  for (const t of allTx) {
    if (t.type !== "expense" || !t.date) continue;
    const d = new Date(t.date);
    const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
    const isLifestyle = lifestyleKeywords.some((kw) => combined.includes(kw));
    if (!isLifestyle) continue;

    if (d.getFullYear() === curYear && d.getMonth() === curMonth) {
      curLifestyle += Number(t.amount || 0);
    } else if (d.getFullYear() === prevYear && d.getMonth() === prevMonth) {
      prevLifestyle += Number(t.amount || 0);
    }
  }

  const diffPct = prevLifestyle > 0 ? ((curLifestyle - prevLifestyle) / prevLifestyle) * 100 : 0;
  const isCreeping = diffPct > 15;

  const items: GhostDataCardItem[] = [
    { label: "Belanja Gaya Hidup Bulan Ini", value: curLifestyle, formattedValue: formatIDR(curLifestyle), color: "#ec4899" },
    { label: "Belanja Gaya Hidup Bulan Lalu", value: prevLifestyle, formattedValue: formatIDR(prevLifestyle), color: "#3b82f6" },
    { label: "Perubahan Pengeluaran", value: `${diffPct.toFixed(1)}%`, formattedValue: `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%`, color: isCreeping ? "#ef4444" : "#10b981" },
  ];

  return {
    text: isCreeping
      ? `Awas! 📈👻 Terdeteksi gejala **Lifestyle Creep** (inflasi gaya hidup) sebesar **+${diffPct.toFixed(
          1
        )}%** dibanding bulan lalu (${formatIDR(curLifestyle)} vs ${formatIDR(
          prevLifestyle
        )}). Pastikan tabunganmu ikut bertumbuh!`
      : `Bagus! 🧘👻 Gaya hidup konsumtifmu stabil dan terkendali (${diffPct > 0 ? "+" : ""}${diffPct.toFixed(
          1
        )}% vs bulan lalu). Kamu menjaga standar hidup tetap proporsional, ${userName}!`,
    mood: isCreeping ? "thinking" : "happy",
    dataCard: {
      type: "lifestyle_creep",
      title: "📈 Audit Inflasi Gaya Hidup (Lifestyle Creep)",
      subtitle: "Perbandingan pos konsumtif Wants bulan ini vs bulan lalu",
      totalAmount: curLifestyle,
      formattedTotal: `${diffPct > 0 ? "+" : ""}${diffPct.toFixed(1)}%`,
      items,
      statusBadge: {
        label: isCreeping ? "Terdeteksi Inflasi Gaya Hidup ⚠️" : "Gaya Hidup Stabil ✅",
        isPositive: !isCreeping,
      },
      tip: "Lifestyle Creep terjadi tanpa disadari saat kenaikan gaji diiringi peningkatan standar jajan/gadget. Pertahankan prinsip 'tingkatkan tabungan sebelum menaikkan gaya hidup'.",
    },
    suggestedPrompts: [
      "Berapa rasio tabunganku?",
      "Kategori apa yang paling boros?",
      "Bagaimana arus kasku (cash flow)?",
    ],
  };
}

/** 16. Cash Buffer & Liquidity Ratio Audit */
function handleCashBufferAudit(
  q: string,
  totalBalance: number,
  totalOutflow: number,
  userName: string
): GhostResponse | null {
  const isBufferIntent =
    q.includes("bantalan kas") ||
    q.includes("uang kasku cukup") ||
    q.includes("likuiditas") ||
    q.includes("cash buffer") ||
    q.includes("uang mengendap") ||
    q.includes("saldo kas aman");

  if (!isBufferIntent) return null;

  const monthlyBurn = totalOutflow > 0 ? totalOutflow : 5000000;
  const bufferMonths = totalBalance / monthlyBurn;

  let status = "";
  let isPositive = false;
  let tip = "";

  if (bufferMonths < 1) {
    status = "Kas Terlalu Tipis (<1 Bulan) ⚠️";
    isPositive = false;
    tip = "Uang kasmu kurang dari 1 bulan pengeluaran. Sangat rawan jika terjadi penundaan gajian atau biaya darurat tak terduga!";
  } else if (bufferMonths <= 3) {
    status = "Bantalan Kas Ideal (1-3 Bulan) ✅";
    isPositive = true;
    tip = "Likuiditas kas harianmu sangat sehat! Rekening operasional memiliki cadangan cukup untuk kelancaran transaksi bulanan.";
  } else if (bufferMonths <= 6) {
    status = "Kas Sangat Kuat (3-6 Bulan) 🛡️";
    isPositive = true;
    tip = "Kas likuidmu sudah mencakup dana darurat penuh. Posisi keamanan finansialmu sangat terlindungi!";
  } else {
    status = "Cash Drag / Uang Mengendap (>6 Bulan) 💡";
    isPositive = true;
    tip = "Uang kas likuidmu terlalu banyak mengendap di rekening biasa dengan bunga rendah. Pertimbangkan mengalihkan sebagian ke RDPU (Reksadana Pasar Uang) atau Deposito agar tidak tergerus inflasi.";
  }

  const items: GhostDataCardItem[] = [
    { label: "Total Kas Likuid", value: totalBalance, formattedValue: formatIDR(totalBalance), color: "#10b981" },
    { label: "Pengeluaran Bulanan", value: monthlyBurn, formattedValue: formatIDR(monthlyBurn), color: "#ef4444" },
    { label: "Ketahanan Kas", value: `${bufferMonths.toFixed(1)} Bulan`, formattedValue: `${bufferMonths.toFixed(1)} Bulan Pengeluaran`, color: bufferMonths >= 1 ? "#10b981" : "#ef4444" },
    { label: "Bantalan Rekomendasi", value: "1.5 - 3 Bulan", formattedValue: "1.5 - 3 Bulan Pengeluaran" },
  ];

  return {
    text: `Boo! 🏦👻 Saldo kas likuidmu saat ini (**${formatIDR(
      totalBalance
    )}**) sanggup menopang **${bufferMonths.toFixed(
      1
    )} bulan** pengeluaran operasionalmu tanpa pemasukan baru, ${userName}!`,
    mood: bufferMonths < 1 ? "spooky" : "happy",
    dataCard: {
      type: "cash_buffer",
      title: "🏦 Audit Bantalan Kas Likuid (Cash Buffer)",
      subtitle: "Rasio ketahanan uang tunai terhadap belanja bulanan",
      totalAmount: totalBalance,
      formattedTotal: `${bufferMonths.toFixed(1)} Bulan`,
      items,
      statusBadge: {
        label: status,
        isPositive,
      },
      tip,
    },
    suggestedPrompts: [
      "Berapa bulan dana daruratku bisa bertahan?",
      "Cek saldo semua rekening",
      "Kondisi keuanganku sehat gak?",
    ],
  };
}

/**
 * Core engine answering comprehensive financial cases with Racks persona.
 */
export function processGhostQuery(
  rawQuery: string,
  ctx: FinancialContext
): GhostResponse {
  const q = rawQuery.toLowerCase().trim();
  const userName =
    ctx.user?.name?.trim().split(" ")[0] ||
    ctx.user?.email?.split("@")?.[0] ||
    "Sobat";

  const allTx = ctx.transactions || ctx.summary?.recent || [];
  const inflowItems = ctx.summary?.cashflow?.inflow || [];
  const outflowItems = ctx.summary?.cashflow?.outflow || [];
  const totalInflow = inflowItems.reduce((acc, i) => acc + (i.value || 0), 0);
  const totalOutflow = outflowItems.reduce((acc, i) => acc + (i.value || 0), 0);
  const netSurplus = totalInflow - totalOutflow;

  const totalBalance = ctx.accounts
    .filter((a) => a.isActive)
    .reduce((sum, a) => sum + Number(a.balance || 0), 0);

  const timeFilter = parseTimeRange(q);
  const allExpenses = allTx.filter((t) => t.type === "expense");

  // =========================================================================
  // PILAR 0: INTERAKTIF CEPAT & ANALISIS SPESIFIK (PRIORITY HANDLERS)
  // =========================================================================

  // 0.1. CATAT TRANSAKSI CEPAT (NATURAL LANGUAGE QUICK ADD WITH 1-CLICK SAVE)
  const quickAddRes = parseQuickAddTransaction(rawQuery, q, ctx, userName);
  if (quickAddRes) return quickAddRes;

  // 0.2. CARI TRANSAKSI / RIWAYAT BELANJA MERCHANT
  const searchRes = handleMerchantSearch(q, allTx, userName);
  if (searchRes) return searchRes;

  // 0.3. AUDIT REKENING & CEK SALDO TERTENTU
  const accountAuditRes = handleAccountAudit(q, ctx, allTx, userName);
  if (accountAuditRes) return accountAuditRes;

  // 0.4. SIMULASI DAYA BELI / BOLEH BELI GAK? (AFFORDABILITY)
  const affordRes = handleAffordabilitySimulation(rawQuery, q, ctx, userName, totalBalance, netSurplus);
  if (affordRes) return affordRes;

  // 0.5. AUDIT TRANSAKSI PAJAK & CORETAX DEDUCTIBLE
  const taxRes = handleTaxAndCoretaxAudit(q, allTx, timeFilter, userName);
  if (taxRes) return taxRes;

  // 0.6. ANALISIS AKHIR PEKAN VS HARI KERJA (WEEKEND VS WEEKDAY)
  const weekendRes = handleWeekendVsWeekdayAnalysis(q, allTx, timeFilter, userName);
  if (weekendRes) return weekendRes;

  // 0.7. AUDIT RASIO MENABUNG (SAVING RATE)
  const savingRateRes = handleSavingRateAudit(q, totalInflow, totalOutflow, netSurplus, userName);
  if (savingRateRes) return savingRateRes;

  // 0.8. KALKULATOR FIRE & DANA PENSIUN DINI
  const fireRes = handleFireRetirementCalculator(q, totalOutflow, totalBalance, netSurplus, userName);
  if (fireRes) return fireRes;

  // 0.9. AUDIT LANGGANAN ZOMBIE / DIGITAL SAAS
  const zombieRes = handleZombieSubscriptions(q, allTx, userName);
  if (zombieRes) return zombieRes;

  // 0.10. AUDIT BIAYA ONGKIR & PESAN ANTAR (DELIVERY FEES)
  const deliveryRes = handleDeliveryFeeAudit(q, allTx, timeFilter, userName);
  if (deliveryRes) return deliveryRes;

  // 0.11. TRANSAKSI TERMAHAL BULAN INI (BIGGEST PURCHASE)
  const biggestRes = handleBiggestPurchaseAnalysis(q, allExpenses, totalOutflow, timeFilter, userName);
  if (biggestRes) return biggestRes;

  // 0.12. ALOKASI UANG KAGET, BONUS & THR
  const windfallRes = handleWindfallPlanner(rawQuery, q, userName);
  if (windfallRes) return windfallRes;

  // 0.13. SIMULASI PEMANGKASAN PENGELUARAN (WHAT-IF EXPENSE CUT & COMPOUNDING)
  const expenseCutRes = handleExpenseCutSimulation(rawQuery, q, totalOutflow, userName);
  if (expenseCutRes) return expenseCutRes;

  // 0.14. STRATEGI PELUNASAN CICILAN (DEBT SNOWBALL VS AVALANCHE)
  const debtPayoffRes = handleDebtPayoffStrategy(q, allTx, ctx, totalInflow, userName);
  if (debtPayoffRes) return debtPayoffRes;

  // 0.15. AUDIT INFLASI GAYA HIDUP (LIFESTYLE CREEP)
  const lifestyleRes = handleLifestyleCreepAudit(q, allTx, userName);
  if (lifestyleRes) return lifestyleRes;

  // 0.16. CEK LIKUIDITAS & BANTALAN KAS (CASH BUFFER)
  const cashBufferRes = handleCashBufferAudit(q, totalBalance, totalOutflow, userName);
  if (cashBufferRes) return cashBufferRes;

  // =========================================================================
  // PILAR 1: GAYA HIDUP & HARIAN (DAILY LIFESTYLE)
  // =========================================================================

  // CASE 1: KOPI & KAFE
  if (
    q.includes("kopi") ||
    q.includes("coffee") ||
    q.includes("ngopi") ||
    q.includes("starbucks") ||
    q.includes("fore") ||
    q.includes("kenangan") ||
    q.includes("espresso") ||
    q.includes("latte")
  ) {
    const keywords = [
      "kopi", "coffee", "ngopi", "kafe", "cafe", "starbucks", "fore",
      "kenangan", "janji jiwa", "janjijiwa", "tomoro", "point coffee",
      "espresso", "cappuccino", "americano", "latte", "kopisusu",
    ];

    const coffeeTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = coffeeTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = coffeeTx.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    const pct = totalOutflow > 0 ? ((total / totalOutflow) * 100).toFixed(1) : "0";

    const items: GhostDataCardItem[] = coffeeTx.slice(0, 5).map((t) => {
      const dStr = formatShortDate(t.date);
      return {
        label: `${t.description || t.category?.name || "Kopi"}${dStr ? ` (${dStr})` : ""}`,
        value: t.amount,
        formattedValue: formatIDR(t.amount),
        color: "#f59e0b",
      };
    });

    let mood: GhostMood = total > 400000 ? "spooky" : total > 0 ? "happy" : "idle";
    let tip =
      total > 400000
        ? `🔥 Pengeluaran kopimu mencapai ${pct}% dari seluruh belanja bulanan. Kurangi frekuensi kafe dan seduh kopi manual di rumah bisa hemat Rp 200rb-an!`
        : total > 0
        ? `✨ Pengeluaran kopi (${pct}% dari total belanja) masih dalam batas wajar. Selamat menikmati kopimu agar tetap produktif! ☕`
        : `Belum ada catatan kopi untuk ${timeFilter.rangeLabel}. Catat segera saat jajan kopi berikutnya lewat tombol '+ Catat'!`;

    const text =
      total > 0
        ? `Sluuurp! ☕👻 Aroma kafein tercium di catatanmu, ${userName}! Untuk **${timeFilter.rangeLabel}**, kamu telah mengeluarkan **${formatIDR(
            total
          )}** untuk ngopi (${count} kali jajan, rata-rata **${formatIDR(avg)}** per cangkir).`
        : `Boo! 👻 Bersih dari kafein! Aku belum menemukan transaksi bertema **kopi** atau kafe untuk **${timeFilter.rangeLabel}**, ${userName}.`;

    return {
      text,
      mood,
      dataCard: {
        type: "coffee",
        title: `☕ Rekap Jajan Kopi (${timeFilter.rangeLabel})`,
        subtitle: total > 0 ? `${count} kali ngopi • Rata-rata ${formatIDR(avg)} / cangkir` : "Belum ada pengeluaran kopi",
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: total > 400000 ? "Kafein Tinggi ☕🔥" : total > 0 ? "Porsi Wajar ☕✨" : "Bebas Kopi ☕✅",
          isPositive: total <= 400000,
        },
        tip,
      },
      suggestedPrompts: [
        "Berapa pengeluaran makan di luar bulan ini?",
        "Berapa total pengeluaranku?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 2: MAKAN DI LUAR & PESAN ANTAR (FOOD & DELIVERY)
  if (
    q.includes("makan") ||
    q.includes("kuliner") ||
    q.includes("gofood") ||
    q.includes("grabfood") ||
    q.includes("shopeefood") ||
    q.includes("restoran") ||
    q.includes("resto") ||
    q.includes("mcd") ||
    q.includes("kfc") ||
    q.includes("warung") ||
    q.includes("bakso") ||
    q.includes("mie") ||
    q.includes("dinner") ||
    q.includes("lunch")
  ) {
    const keywords = [
      "makan", "food", "kuliner", "gofood", "grabfood", "shopeefood",
      "restoran", "resto", "mcd", "kfc", "hokben", "warung", "bakso",
      "mie", "nasi", "ayam", "dinner", "lunch", "sarapan", "jajan",
    ];

    const foodTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = foodTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = foodTx.length;
    const avg = count > 0 ? Math.round(total / count) : 0;
    const pct = totalOutflow > 0 ? ((total / totalOutflow) * 100).toFixed(1) : "0";

    const items: GhostDataCardItem[] = foodTx.slice(0, 5).map((t) => {
      const dStr = formatShortDate(t.date);
      return {
        label: `${t.description || t.category?.name || "Makan"}${dStr ? ` (${dStr})` : ""}`,
        value: t.amount,
        formattedValue: formatIDR(t.amount),
        color: "#f97316",
      };
    });

    let mood: GhostMood = total > 1500000 ? "spooky" : "happy";
    let tip =
      total > 1500000
        ? `🍔 Pos makan menyerap ${pct}% dari seluruh pengeluaran. Masak di rumah 2-3 kali seminggu bisa menekan biaya makan hingga 35%! 🍳`
        : `🥗 Porsi biaya makan terkendali dengan baik (${pct}% dari total pengeluaran). Jaga terus pola makan sehat & hemat!`;

    const text =
      total > 0
        ? `Nyam! 🍔👻 Catatan perutmu sudah kuinspeksi, ${userName}! Untuk **${timeFilter.rangeLabel}**, total pengeluaran makan & pesan antarmu adalah **${formatIDR(
            total
          )}** (${count} kali transaksi, rata-rata **${formatIDR(avg)}** per makan).`
        : `Boo! 👻 Belum ada transaksi kuliner/makan yang tercatat untuk **${timeFilter.rangeLabel}**, ${userName}.`;

    return {
      text,
      mood,
      dataCard: {
        type: "food",
        title: `🍔 Rekap Makan & Kuliner (${timeFilter.rangeLabel})`,
        subtitle: total > 0 ? `${count} transaksi • Rata-rata ${formatIDR(avg)}` : "Belum ada transaksi makan",
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: total > 1500000 ? "Porsi Besar 🍔" : "Porsi Sehat 🥗",
          isPositive: total <= 1500000,
        },
        tip,
      },
      suggestedPrompts: [
        "Berapa belanja online bulan ini?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 3: BELANJA ONLINE & E-COMMERCE (SHOPPING)
  if (
    q.includes("shopee") ||
    q.includes("tokopedia") ||
    q.includes("tokped") ||
    q.includes("tiktok shop") ||
    q.includes("tiktokshop") ||
    q.includes("blibli") ||
    q.includes("lazada") ||
    q.includes("checkout") ||
    q.includes("shopping") ||
    (q.includes("belanja") && !q.includes("bensin"))
  ) {
    const keywords = [
      "shopee", "tokopedia", "tokped", "tiktok shop", "tiktokshop",
      "blibli", "lazada", "checkout", "belanja", "shopping", "mall",
      "fashion", "baju", "pakaian", "sepatu", "gadget",
    ];

    const shopTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = shopTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = shopTx.length;
    const pct = totalOutflow > 0 ? ((total / totalOutflow) * 100).toFixed(1) : "0";

    const items: GhostDataCardItem[] = shopTx.slice(0, 5).map((t) => ({
      label: `${t.description || "Belanja Online"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#ec4899",
    }));

    let mood: GhostMood = total > 1000000 ? "spooky" : "idle";
    let tip =
      total > 1000000
        ? `🛍️ Keranjang belanjamu cukup ramai (${pct}% dari total belanja). Terapkan 'Aturan 48 Jam' sebelum checkout barang non-primer!`
        : `✨ Belanja onlinemu terjaga disiplin. Terus tahan godaan flash sale yang tidak perlu!`;

    return {
      text:
        total > 0
          ? `Paket datang! 🛍️👻 Untuk **${timeFilter.rangeLabel}**, kamu telah checkout belanja sebesar **${formatIDR(
              total
            )}** melalui ${count} kali transaksi.`
          : `Boo! 👻 Tidak ada transaksi belanja e-commerce yang tercatat untuk **${timeFilter.rangeLabel}**, ${userName}. Dompetmu aman!`,
      mood,
      dataCard: {
        type: "shopping",
        title: `🛍️ Rekap Belanja Online (${timeFilter.rangeLabel})`,
        subtitle: total > 0 ? `${count} kali checkout keranjang` : "Tidak ada transaksi belanja",
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: total > 1000000 ? "Impulsif Tinggi 🛍️⚠️" : "Belanja Hemat 🛍️✨",
          isPositive: total <= 1000000,
        },
        tip,
      },
      suggestedPrompts: [
        "Berapa ongkos bensin dan transport?",
        "Berapa total pengeluaranku?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 4: TRANSPORTASI & BAHAN BAKAR (MOBILITY)
  if (
    q.includes("bensin") ||
    q.includes("pertamina") ||
    q.includes("shell") ||
    q.includes("bbm") ||
    q.includes("spbu") ||
    q.includes("transport") ||
    q.includes("gojek") ||
    q.includes("grab") ||
    q.includes("maxim") ||
    q.includes("ojol") ||
    q.includes("tol") ||
    q.includes("parkir") ||
    q.includes("kereta") ||
    q.includes("mrt")
  ) {
    const keywords = [
      "bensin", "pertamina", "shell", "bbm", "spbu", "transport", "transportasi",
      "gojek", "grab", "maxim", "ojol", "goride", "gocar", "grabride", "grabcar",
      "tol", "parkir", "kereta", "krl", "mrt", "lrt", "busway", "transjakarta",
    ];

    const transportTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = transportTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = transportTx.length;

    const items: GhostDataCardItem[] = transportTx.slice(0, 5).map((t) => ({
      label: `${t.description || "Transport"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#6366f1",
    }));

    return {
      text:
        total > 0
          ? `Brumm! 🚗👻 Mobilitasmu terpantau! Untuk **${timeFilter.rangeLabel}**, total biaya bensin & transportasimu mencapai **${formatIDR(
              total
            )}** (${count} kali perjalanan).`
          : `Boo! 👻 Tidak ada catatan pengeluaran transport atau bensin untuk **${timeFilter.rangeLabel}**.`,
      mood: "idle",
      dataCard: {
        type: "transport",
        title: `🚗 Mobilitas & Transportasi (${timeFilter.rangeLabel})`,
        subtitle: total > 0 ? `${count} kali perjalanan / isi BBM` : "Belum ada catatan transport",
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Mobilitas Lancar 🚗",
          isPositive: true,
        },
        tip: "Isi BBM saat promo cashback e-wallet atau manfaatkan transportasi umum untuk menghemat ongkos harian!",
      },
      suggestedPrompts: [
        "Berapa tagihan listrik dan air bulan ini?",
        "Berapa total pengeluaranku?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // =========================================================================
  // PILAR 2: TAGIHAN RUTIN & LANGGANAN (FIXED COSTS & BILLS)
  // =========================================================================

  // CASE 5: TAGIHAN RUTIN RUMAH TANGGA (UTILITIES)
  if (
    q.includes("listrik") ||
    q.includes("pln") ||
    q.includes("token") ||
    q.includes("air") ||
    q.includes("pdam") ||
    q.includes("wifi") ||
    q.includes("internet") ||
    q.includes("indihome") ||
    q.includes("biznet") ||
    q.includes("pulsa") ||
    q.includes("paket data") ||
    q.includes("utilitas") ||
    q.includes("tagihan")
  ) {
    const keywords = [
      "listrik", "pln", "token", "air", "pdam", "wifi", "internet",
      "indihome", "biznet", "first media", "myrepublic", "pulsa",
      "kuota", "paket data", "telkomsel", "indosat", "xl", "bpjs",
      "ipl", "iuran", "kebersihan", "tagihan",
    ];

    const billTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = billTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = billTx.length;

    const items: GhostDataCardItem[] = billTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Tagihan"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#06b6d4",
    }));

    return {
      text:
        total > 0
          ? `Bzzzt! ⚡👻 Seluruh pos kebutuhan wajib sudah kurangkum! Untuk **${timeFilter.rangeLabel}**, total tagihan rumah tangga & utilitas adalah **${formatIDR(
              total
            )}**.`
          : `Boo! 👻 Belum ada pencatatan tagihan listrik, air, atau internet untuk **${timeFilter.rangeLabel}**.`,
      mood: "happy",
      dataCard: {
        type: "bills",
        title: `⚡ Tagihan & Utilitas Rutin (${timeFilter.rangeLabel})`,
        subtitle: `${count} tagihan terbayar`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Tagihan Beres ⚡✅",
          isPositive: true,
        },
        tip: "Selalu prioritaskan pelunasan tagihan listrik & internet di awal bulan setelah gajian agar bebas denda keterlambatan!",
      },
      suggestedPrompts: [
        "Berapa biaya langganan digital bulanan saya?",
        "Berapa cicilan atau paylater saya?",
        "Berapa total pengeluaranku?",
      ],
    };
  }

  // CASE 6: BIAYA LANGGANAN DIGITAL (SUBSCRIPTION)
  if (
    q.includes("langganan") ||
    q.includes("subscription") ||
    q.includes("subscribe") ||
    q.includes("netflix") ||
    q.includes("spotify") ||
    q.includes("youtube") ||
    q.includes("disney") ||
    q.includes("icloud") ||
    q.includes("google one") ||
    q.includes("chatgpt") ||
    q.includes("canva")
  ) {
    const keywords = [
      "netflix", "spotify", "youtube", "premium", "disney", "hbo",
      "prime", "icloud", "apple", "google one", "google storage",
      "chatgpt", "openai", "canva", "github", "midjourney", "subscription",
    ];

    const subTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = subTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = subTx.length;

    const items: GhostDataCardItem[] = subTx.slice(0, 6).map((t) => ({
      label: `${t.description || "Langganan"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#a855f7",
    }));

    return {
      text:
        total > 0
          ? `Layar menyala! 📺👻 Layanan digital berbayarmu tercatat sebesar **${formatIDR(
              total
            )}** untuk **${timeFilter.rangeLabel}** (${count} layanan aktif).`
          : `Boo! 👻 Belum ada transaksi langganan streaming/software yang terdeteksi untuk **${timeFilter.rangeLabel}**.`,
      mood: "idle",
      dataCard: {
        type: "subscription",
        title: `📺 Biaya Langganan Digital (${timeFilter.rangeLabel})`,
        subtitle: `${count} platform berbayar`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Langganan Aktif 📺",
          isPositive: true,
        },
        tip: "Audit aplikasi langganan tiap 3 bulan. Jika ada platform streaming yang jarang ditonton, batalkan untuk hemat biaya!",
      },
      suggestedPrompts: [
        "Berapa cicilan atau paylater saya?",
        "Berapa tagihan listrik dan air bulan ini?",
        "Berapa total pengeluaranku?",
      ],
    };
  }

  // CASE 7: CICILAN, PAYLATER & UTANG (DEBT & LOANS)
  if (
    q.includes("cicilan") ||
    q.includes("paylater") ||
    q.includes("spaylater") ||
    q.includes("gopaylater") ||
    q.includes("kredivo") ||
    q.includes("akulaku") ||
    q.includes("kartu kredit") ||
    q.includes("credit card") ||
    q.includes("angsuran") ||
    q.includes("kpr") ||
    q.includes("utang") ||
    q.includes("pinjaman")
  ) {
    const keywords = [
      "cicilan", "paylater", "spaylater", "gopaylater", "kredivo",
      "akulaku", "kartu kredit", "credit card", "angsuran", "kpr",
      "utang", "pinjaman", "bunga", "leasing", "kredit",
    ];

    const debtTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = debtTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = debtTx.length;
    const debtRatio = totalInflow > 0 ? ((total / totalInflow) * 100).toFixed(1) : "0";

    const items: GhostDataCardItem[] = debtTx.slice(0, 5).map((t) => ({
      label: `${t.description || "Cicilan"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#ef4444",
    }));

    const isHighDebt = Number(debtRatio) > 30;

    return {
      text:
        total > 0
          ? `Perhatian ekstra! 💳👻 Untuk **${timeFilter.rangeLabel}**, pos cicilan & kewajibanmu tercatat **${formatIDR(
              total
            )}** (${debtRatio}% dari total pemasukanmu).`
          : `Alhamdulillah! 💳👻 Bebas utang! Belum ada catatan cicilan atau paylater yang tercatat di periode **${timeFilter.rangeLabel}**.`,
      mood: isHighDebt ? "spooky" : "happy",
      dataCard: {
        type: "debt",
        title: `💳 Cicilan & Kewajiban (${timeFilter.rangeLabel})`,
        subtitle: total > 0 ? `${count} cicilan berjalan • Rasio utang: ${debtRatio}%` : "Bebas cicilan!",
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: isHighDebt ? "Rasio Utang Tinggi ⚠️" : "Rasio Sehat (<30%) ✅",
          isPositive: !isHighDebt,
        },
        tip: isHighDebt
          ? "Rasio cicilan melebihi batas aman 30% pendapatan. Tahan dulu mengambil cicilan baru sampai angsuran lama lunas!"
          : "Rasio cicilan berada di zona aman. Pertahankan agar tidak membebani cash flow bulanan!",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Bagaimana arus kasku (cash flow)?",
        "Berapa total saldoku?",
      ],
    };
  }

  // =========================================================================
  // PILAR 3: ANALISIS & AUDIT PEMBOROSAN (ANALYTICS & INSIGHTS)
  // =========================================================================

  // CASE 8: KATEGORI PALING BOROS (TOP SPENDING CATEGORY)
  if (
    q.includes("paling boros") ||
    q.includes("terboros") ||
    q.includes("boros apa") ||
    q.includes("pos terbesar") ||
    q.includes("kategori terbesar") ||
    q.includes("paling banyak lari ke mana") ||
    q.includes("pengeluaran terbanyak") ||
    q.includes("habis paling banyak")
  ) {
    const sortedOutflow = [...outflowItems].sort((a, b) => b.value - a.value);
    const top = sortedOutflow[0];

    const items: GhostDataCardItem[] = sortedOutflow.slice(0, 5).map((i) => {
      const pct = totalOutflow > 0 ? Math.round((i.value / totalOutflow) * 100) : 0;
      return {
        label: i.name,
        value: i.value,
        formattedValue: formatIDR(i.value),
        percent: pct,
        color: i.color || "#f43f5e",
      };
    });

    return {
      text: top
        ? `Jawara pemborosan terdeteksi! 🚨👻 Pengeluaran terbesarmu bulan ini adalah kategori **${top.name}** sebesar **${formatIDR(
            top.value
          )}** (${totalOutflow > 0 ? Math.round((top.value / totalOutflow) * 100) : 0}% dari seluruh pengeluaran).`
        : `Boo! 👻 Belum ada data pengeluaran yang cukup untuk menentukan pos terboros.`,
      mood: "thinking",
      dataCard: {
        type: "top_expense",
        title: "🚨 Peringkat Pos Pengeluaran Terboros",
        subtitle: top ? `Kategori #1: ${top.name}` : "Menunggu data transaksi",
        totalAmount: top?.value || 0,
        formattedTotal: top ? formatIDR(top.value) : "Rp 0",
        items,
        statusBadge: {
          label: top ? `Fokus Penghematan: ${top.name}` : "Data Kosong",
          isPositive: false,
        },
        tip: top
          ? `Jika kamu bisa memangkas 15% saja dari kategori ${top.name}, kamu bisa menyimpan ekstra ${formatIDR(
              Math.round(top.value * 0.15)
            )} per bulan!`
          : "Catat setiap transaksi belanja harian agar audit pengeluaran semakin akurat.",
      },
      suggestedPrompts: [
        "Apa transaksi terbesar bulan ini?",
        "Bandingkan dengan bulan lalu",
        "Arus kasku surplus atau defisit?",
      ],
    };
  }

  // CASE 9: TRANSAKSI TERBESAR TUNGGAL (SINGLE BIGGEST EXPENSE)
  if (
    q.includes("transaksi terbesar") ||
    q.includes("transaksi paling besar") ||
    q.includes("pengeluaran paling mahal") ||
    q.includes("belanja paling mahal") ||
    q.includes("nominal terbesar")
  ) {
    const monthExpenses = allTx.filter((t) => t.type === "expense" && timeFilter.matchesDate(t.date));
    const sorted = [...monthExpenses].sort((a, b) => Number(b.amount || 0) - Number(a.amount || 0));
    const biggest = sorted[0];

    const items: GhostDataCardItem[] = sorted.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Pengeluaran"}${t.date ? ` (${formatShortDate(t.date)})` : ""}`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#e11d48",
    }));

    return {
      text: biggest
        ? `Gubrak! 💥👻 Transaksi tunggal paling besar di periode **${timeFilter.rangeLabel}** adalah **"${biggest.description || biggest.category?.name || "Pengeluaran"}"** dengan nominal fantastis **${formatIDR(
            biggest.amount
          )}**${biggest.date ? ` pada tanggal ${formatShortDate(biggest.date)}` : ""}.`
        : `Boo! 👻 Belum ada transaksi pengeluaran yang tercatat untuk periode **${timeFilter.rangeLabel}**.`,
      mood: biggest ? "spooky" : "idle",
      dataCard: {
        type: "top_expense",
        title: `💥 Transaksi Tunggal Terbesar (${timeFilter.rangeLabel})`,
        subtitle: biggest ? `Tertinggi: ${biggest.description || "Transaksi"}` : "Tidak ada transaksi",
        totalAmount: biggest?.amount || 0,
        formattedTotal: biggest ? formatIDR(biggest.amount) : "Rp 0",
        items,
        statusBadge: {
          label: biggest ? "Pengeluaran Puncak 💥" : "Kosong",
          isPositive: false,
        },
        tip: "Untuk pembelian bernilai besar, selalu rencanakan minimal 1-2 bulan sebelumnya menggunakan tabungan khusus!",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Bandingkan dengan bulan lalu",
        "Berapa total pengeluaranku?",
      ],
    };
  }

  // CASE 10: PERBANDINGAN BULAN INI VS BULAN LALU (MONTH-OVER-MONTH)
  if (
    q.includes("bandingkan") ||
    q.includes("vs bulan lalu") ||
    q.includes("lebih boros mana") ||
    q.includes("perbandingan bulan") ||
    q.includes("dibanding bulan lalu") ||
    q.includes("kenaikan pengeluaran")
  ) {
    const prevNetWorth = ctx.summary?.netWorthPrevious || 0;
    const currNetWorth = ctx.summary?.netWorthCurrent || totalBalance;
    const diffNet = currNetWorth - prevNetWorth;
    const isGrowing = diffNet >= 0;

    return {
      text: `Mesin waktu finansial siap! 📈👻 Kekayaan bersihmu saat ini adalah **${formatIDR(
        currNetWorth
      )}**, ${
        isGrowing
          ? `mengalami kenaikan **+${formatIDR(diffNet)}** dibanding periode sebelumnya! Pertumbuhan yang manis! ✨`
          : `turun **${formatIDR(Math.abs(diffNet))}** dibanding periode sebelumnya. Waktunya evaluasi pos belanja! ⚠️`
      }`,
      mood: isGrowing ? "happy" : "spooky",
      dataCard: {
        type: "comparison",
        title: "📈 Perbandingan Pertumbuhan Finansial",
        subtitle: isGrowing ? "Tren kekayaan bersih meningkat" : "Tren pengeluaran lebih tinggi",
        totalAmount: diffNet,
        formattedTotal: (isGrowing ? "+ " : "- ") + formatIDR(Math.abs(diffNet)),
        items: [
          {
            label: "Kekayaan Bersih Sekarang",
            value: currNetWorth,
            formattedValue: formatIDR(currNetWorth),
            color: "#10b981",
          },
          {
            label: "Kekayaan Bersih Sebelumnya",
            value: prevNetWorth,
            formattedValue: formatIDR(prevNetWorth),
            color: "#6b7280",
          },
          {
            label: "Selisih Pertumbuhan",
            value: diffNet,
            formattedValue: (isGrowing ? "+" : "-") + formatIDR(Math.abs(diffNet)),
            color: isGrowing ? "#38bdf8" : "#f43f5e",
          },
        ],
        statusBadge: {
          label: isGrowing ? "Bertumbuh Positif 🚀" : "Mengalami Penurunan 📉",
          isPositive: isGrowing,
        },
        tip: isGrowing
          ? "Konsistensi adalah kuncinya! Terus pertahankan surplus dan tanam ke aset produktif."
          : "Cek kategori terboros bulan ini dan pasang limit anggaran yang lebih ketat.",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Berapa total saldoku?",
        "Bagaimana arus kasku (cash flow)?",
      ],
    };
  }

  // =========================================================================
  // PILAR 4: PEMASUKAN, ARUS KAS & SALDO REKENING (WEALTH)
  // =========================================================================

  // CASE 11: AUDIT PEMASUKAN & GAJI
  if (
    q.includes("pemasukan") ||
    q.includes("gaji") ||
    q.includes("pendapatan") ||
    q.includes("penghasilan") ||
    q.includes("inflow") ||
    q.includes("salary") ||
    q.includes("cuan") ||
    q.includes("uang masuk") ||
    q.includes("omset") ||
    q.includes("omzet")
  ) {
    const hasInflows = inflowItems.length > 0;
    const sortedInflow = [...inflowItems].sort((a, b) => b.value - a.value);
    const topInflow = sortedInflow[0];

    const items: GhostDataCardItem[] = sortedInflow.slice(0, 5).map((item) => {
      const pct = totalInflow > 0 ? (item.value / totalInflow) * 100 : 0;
      return {
        label: item.name || "Sumber Lainnya",
        value: item.value,
        formattedValue: formatIDR(item.value),
        percent: Math.round(pct),
        color: item.color || "#10b981",
      };
    });

    let mood: GhostMood = totalInflow > 0 ? "happy" : "thinking";
    let tip =
      totalInflow > totalOutflow && totalOutflow > 0
        ? `Kabar gembira! Pemasukanmu surplus ${formatIDR(netSurplus)} dibanding belanja. Tabung minimal 20% ke portofolio! ✨`
        : "Pastikan seluruh aliran gaji atau invoice bisnis langsung dicatat agar grafik arus kas tetap hijau!";

    return {
      text: `Yay! 💰👻 Aura rezeki terdeteksi! Total pemasukanmu pada periode ini mencapai **${formatIDR(
        totalInflow
      )}**${topInflow ? ` dengan kontributor utama dari **${topInflow.name}**` : ""}.`,
      mood,
      dataCard: {
        type: "income",
        title: "💰 Rekapitulasi Pemasukan (Inflow)",
        subtitle: hasInflows ? `Tercatat dari ${inflowItems.length} aliran dana` : "Belum ada riwayat pemasukan",
        totalAmount: totalInflow,
        formattedTotal: formatIDR(totalInflow),
        items,
        statusBadge: {
          label: totalInflow > 0 ? "Arus Masuk Aktif 💰" : "Menunggu Pemasukan",
          isPositive: totalInflow > 0,
        },
        tip,
      },
      suggestedPrompts: [
        "Berapa total pengeluaranku?",
        "Bagaimana arus kasku (cash flow)?",
        "Berapa total saldoku?",
      ],
    };
  }

  // CASE 12: EVALUASI ARUS KAS & SAVING RATE (NET CASH FLOW)
  if (
    q.includes("arus kas") ||
    q.includes("cash flow") ||
    q.includes("cashflow") ||
    q.includes("surplus") ||
    q.includes("defisit") ||
    q.includes("saving rate") ||
    q.includes("sisa uang") ||
    q.includes("bisa nabung berapa")
  ) {
    const isSurplus = netSurplus >= 0;
    const savingRate = totalInflow > 0 ? ((netSurplus / totalInflow) * 100).toFixed(1) : "0";

    return {
      text: `Audit arus kas tuntas! ⚖️🔮 Pemasukanmu **${formatIDR(totalInflow)}** dan belanja **${formatIDR(
        totalOutflow
      )}**, menghasilkan arus kas bersih **${isSurplus ? "SURPLUS" : "DEFISIT"} ${formatIDR(
        Math.abs(netSurplus)
      )}** (Saving Rate: **${savingRate}%**).`,
      mood: isSurplus ? "happy" : "spooky",
      dataCard: {
        type: "cashflow",
        title: "⚖️ Evaluasi Arus Kas (Cash Flow)",
        subtitle: isSurplus ? `Surplus dana aman • Saving Rate: ${savingRate}%` : "Pengeluaran melebihi total pemasukan",
        totalAmount: netSurplus,
        formattedTotal: (isSurplus ? "+ " : "- ") + formatIDR(Math.abs(netSurplus)),
        items: [
          {
            label: "Total Pemasukan (Inflow)",
            value: totalInflow,
            formattedValue: formatIDR(totalInflow),
            color: "#10b981",
          },
          {
            label: "Total Pengeluaran (Outflow)",
            value: totalOutflow,
            formattedValue: formatIDR(totalOutflow),
            color: "#f43f5e",
          },
          {
            label: "Sisa Bersih (Net)",
            value: netSurplus,
            formattedValue: (isSurplus ? "+" : "-") + formatIDR(Math.abs(netSurplus)),
            color: isSurplus ? "#38bdf8" : "#fb7185",
          },
        ],
        statusBadge: {
          label: isSurplus ? `Surplus Sehat (${savingRate}%) 🚀` : "Defisit (Waspada) ⚠️",
          isPositive: isSurplus,
        },
        tip: isSurplus
          ? "Saving rate di atas 20% adalah standar emas kesehatan keuangan. Sisihkan surplus ini ke reksa dana pasar uang!"
          : "Pangkas jajan di luar dan belanja impulsif untuk mengembalikan arus kas ke teritori positif.",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Berapa total saldoku?",
        "Berapa pengeluaran kopi saya bulan ini?",
      ],
    };
  }

  // CASE 13: CEK SALDO SPESIFIK / TOTAL SALDO (BANK & WALLET)
  if (
    q.includes("saldo") ||
    q.includes("rekening") ||
    q.includes("tabungan") ||
    q.includes("aset") ||
    q.includes("total uang") ||
    q.includes("kekayaan") ||
    q.includes("net worth") ||
    q.includes("dompet") ||
    q.includes("bca") ||
    q.includes("mandiri") ||
    q.includes("bri") ||
    q.includes("bni") ||
    q.includes("gopay") ||
    q.includes("ovo") ||
    q.includes("dana") ||
    q.includes("shopeepay") ||
    q.includes("jago")
  ) {
    const activeAccs = ctx.accounts.filter((a) => a.isActive);

    // Check if user asks for specific bank (e.g. "saldo BCA", "saldo Mandiri")
    const specificAcc = activeAccs.find((a) => q.includes(a.name.toLowerCase()));

    if (specificAcc) {
      return {
        text: `Ding! 🏦👻 Saldo untuk akun **${specificAcc.name}** adalah **${formatIDR(
          Number(specificAcc.balance || 0)
        )}**.`,
        mood: "happy",
        dataCard: {
          type: "balance",
          title: `🏦 Saldo Akun: ${specificAcc.name}`,
          subtitle: `Tipe Akun: ${specificAcc.type.toUpperCase()}`,
          totalAmount: Number(specificAcc.balance || 0),
          formattedTotal: formatIDR(Number(specificAcc.balance || 0)),
          items: [
            {
              label: "Saldo Tersedia",
              value: Number(specificAcc.balance || 0),
              formattedValue: formatIDR(Number(specificAcc.balance || 0)),
              color: specificAcc.color || "#a855f7",
            },
          ],
          statusBadge: {
            label: "Akun Aktif ✅",
            isPositive: true,
          },
          tip: "Gunakan akun ini dengan bijak untuk pembayaran tagihan atau tabungan harian.",
        },
        suggestedPrompts: [
          "Berapa total seluruh saldoku?",
          "Berapa total pengeluaranku?",
          "Bagaimana arus kasku (cash flow)?",
        ],
      };
    }

    // Default: Total Net Worth across all active accounts
    const items: GhostDataCardItem[] = activeAccs.slice(0, 6).map((acc) => ({
      label: acc.name,
      value: Number(acc.balance || 0),
      formattedValue: formatIDR(Number(acc.balance || 0)),
      color: acc.color || "#a855f7",
    }));

    return {
      text: `Boo! 🏦👻 Aku telah menghitung seluruh kantong rekeningmu! Total kekayaan bersih (*Net Worth*) adalah **${formatIDR(
        totalBalance
      )}** yang tersebar di **${activeAccs.length} akun aktif**.`,
      mood: "idle",
      dataCard: {
        type: "balance",
        title: "🏦 Saldo & Rekening Terdaftar",
        subtitle: `Terdiri dari ${activeAccs.length} akun aktif`,
        totalAmount: totalBalance,
        formattedTotal: formatIDR(totalBalance),
        items,
        statusBadge: {
          label: "Aset Likuid Aman 🏦",
          isPositive: true,
        },
        tip: "Pastikan dana darurat minimal setara 3-6 kali pengeluaran bulanan tersimpan di akun likuid!",
      },
      suggestedPrompts: [
        "Berapa total pengeluaranku?",
        "Berapa pemasukanku bulan ini?",
        "Bagaimana arus kasku (cash flow)?",
      ],
    };
  }

  // =========================================================================
  // PILAR 5: BUDGET & INVESTASI (PLANNING & PORTFOLIO)
  // =========================================================================

  // CASE 14: CEK SISA BUDGET & PERINGATAN OVERBUDGET
  if (
    q.includes("budget") ||
    q.includes("anggaran") ||
    q.includes("sisa budget") ||
    q.includes("overbudget") ||
    q.includes("hampir habis") ||
    q.includes("limit")
  ) {
    const budgets = ctx.budgets || [];
    const items: GhostDataCardItem[] = budgets.slice(0, 5).map((b) => ({
      label: `Limit Anggaran`,
      value: b.limit,
      formattedValue: formatIDR(b.limit),
      color: "#f59e0b",
    }));

    return {
      text:
        budgets.length > 0
          ? `Mata gaibku memantau anggaranmu! 🎯👻 Kamu memiliki **${budgets.length} kategori budget** yang aktif. Pastikan pos pengeluaran harian tidak menembus batas merah!`
          : `Boo! 🎯👻 Kamu belum memasang limit budget bulanan. Memasang budget di menu **Budget** akan membantumu menahan pengeluaran berlebih!`,
      mood: budgets.length > 0 ? "thinking" : "idle",
      dataCard: {
        type: "budget",
        title: "🎯 Pemantau Anggaran & Budget",
        subtitle: `${budgets.length} kategori dengan limit aktif`,
        totalAmount: budgets.reduce((sum, b) => sum + Number(b.limit || 0), 0),
        formattedTotal: formatIDR(budgets.reduce((sum, b) => sum + Number(b.limit || 0), 0)),
        items,
        statusBadge: {
          label: budgets.length > 0 ? "Budget Terpantau 🎯" : "Belum Ada Budget",
          isPositive: budgets.length > 0,
        },
        tip: "Gunakan aturan 50/30/20: 50% untuk kebutuhan pokok, 30% untuk keinginan, dan 20% untuk tabungan/investasi.",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Berapa total pengeluaranku?",
        "Berapa nilai investasiku?",
      ],
    };
  }

  // CASE 15: RINGKASAN INVESTASI (PORTFOLIO)
  if (
    q.includes("investasi") ||
    q.includes("portofolio") ||
    q.includes("saham") ||
    q.includes("reksa dana") ||
    q.includes("reksadana") ||
    q.includes("ihsg") ||
    q.includes("crypto") ||
    q.includes("kripto") ||
    q.includes("emas") ||
    q.includes("holding")
  ) {
    const holdings = ctx.investments || [];
    const totalInvest = holdings.reduce(
      (sum, h) => sum + Number(h.currentPrice || h.buyPrice || 0) * Number(h.quantity || 0),
      0
    );

    const items: GhostDataCardItem[] = holdings.slice(0, 5).map((h) => ({
      label: `${h.symbol} (${h.name})`,
      value: (h.currentPrice || h.buyPrice) * h.quantity,
      formattedValue: formatIDR((h.currentPrice || h.buyPrice) * h.quantity),
      color: "#10b981",
    }));

    return {
      text:
        holdings.length > 0
          ? `Cuan masa depan terdeteksi! 📈👻 Kamu memiliki **${holdings.length} aset investasi** aktif dengan total estimasi nilai **${formatIDR(
              totalInvest
            )}**.`
          : `Boo! 📈👻 Belum ada aset saham, reksa dana, atau emas yang tercatat di portofoliomu. Kunjungi tab **Investasi** untuk mulai membangun kekayaan jangka panjang!`,
      mood: holdings.length > 0 ? "happy" : "idle",
      dataCard: {
        type: "investment",
        title: "📈 Portofolio Investasi & Pasar",
        subtitle: `${holdings.length} aset terdaftar`,
        totalAmount: totalInvest,
        formattedTotal: formatIDR(totalInvest),
        items,
        statusBadge: {
          label: holdings.length > 0 ? "Aset Bertumbuh 🚀" : "Mulai Berinvestasi 🌱",
          isPositive: holdings.length > 0,
        },
        tip: "Diversifikasikan aset ke reksa dana pasar uang untuk keamanan, dan saham IHSG/AS untuk pertumbuhan jangka panjang!",
      },
      suggestedPrompts: [
        "Berapa total saldoku?",
        "Bagaimana arus kasku (cash flow)?",
        "Berapa total pengeluaranku?",
      ],
    };
  }

  // CASE 16: SKOR KESEHATAN FINANSIAL & CHECKUP DOMPET (FINANCIAL HEALTH SCORE)
  if (
    q.includes("sehat") ||
    q.includes("kesehatan") ||
    q.includes("skor") ||
    q.includes("nilai dompet") ||
    q.includes("checkup") ||
    q.includes("financial health") ||
    q.includes("kondisi keuangan")
  ) {
    const savingRate = totalInflow > 0 ? Math.round(((totalInflow - totalOutflow) / totalInflow) * 100) : 0;
    const expenseRatio = totalInflow > 0 ? Math.round((totalOutflow / totalInflow) * 100) : 100;
    const netCashflow = totalInflow - totalOutflow;
    const holdings = ctx.investments || [];
    const accounts = ctx.accounts || [];

    // Hitung Skor (0 - 100)
    let score = 50;
    if (savingRate >= 25) score += 25;
    else if (savingRate >= 15) score += 18;
    else if (savingRate >= 5) score += 10;
    else if (savingRate < 0) score -= 20;

    if (netCashflow > 0) score += 10;
    if (holdings.length > 0) score += 10;
    if (accounts.length >= 2) score += 5;
    score = Math.max(15, Math.min(score, 98));

    let grade = "B (Sehat & Stabil)";
    let badgeLabel = "Kondisi Sehat ✅";
    let isPositive = true;
    let mood: GhostMood = "happy";

    if (score >= 85) {
      grade = "A+ (Sangat Sehat 🌟)";
      badgeLabel = "Finansial Prima 🌟";
    } else if (score >= 70) {
      grade = "A- (Bagus & Kuat 💪)";
      badgeLabel = "Stabil & Kuat 💪";
    } else if (score >= 50) {
      grade = "B- (Cukup Waspada ⚠️)";
      badgeLabel = "Perlu Pengendalian ⚠️";
      isPositive = false;
      mood = "thinking";
    } else {
      grade = "C (Kritis / Defisit 🚨)";
      badgeLabel = "Peringatan Defisit 🚨";
      isPositive = false;
      mood = "spooky";
    }

    const items: GhostDataCardItem[] = [
      {
        label: "Skor Kesehatan",
        value: `${score} / 100 (${grade})`,
        formattedValue: `${score}/100`,
        percent: score,
        color: score >= 70 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444",
      },
      {
        label: "Saving Rate (Rasio Tabungan)",
        value: `${savingRate}% dari pemasukan`,
        formattedValue: `${savingRate}%`,
        percent: Math.max(0, Math.min(savingRate, 100)),
        color: "#3b82f6",
      },
      {
        label: "Rasio Pengeluaran",
        value: `${expenseRatio}% dari pemasukan`,
        formattedValue: `${expenseRatio}%`,
        percent: Math.min(expenseRatio, 100),
        color: expenseRatio > 90 ? "#ef4444" : "#a855f7",
      },
      {
        label: "Arus Kas Bersih Bulanan",
        value: formatIDR(netCashflow),
        formattedValue: formatIDR(netCashflow),
        color: netCashflow >= 0 ? "#10b981" : "#ef4444",
      },
      {
        label: "Aset Investasi Aktif",
        value: `${holdings.length} instrumen`,
        formattedValue: `${holdings.length} aset`,
        color: "#06b6d4",
      },
    ];

    let tip =
      score >= 80
        ? "Luar biasa! Rasio tabunganmu sehat. Pertahankan disiplin dan tingkatkan alokasi ke instrumen investasi!"
        : score >= 50
        ? "Keuanganmu cukup stabil, namun tekan pos jajan dan keinginan agar saving rate bisa menembus di atas 20%."
        : "Alarm merah! Pengeluaranmu melampaui pemasukan. Stop belanja sekunder dan prioritaskan kebutuhan esensial!";

    return {
      text: `Boo! 🩺👻 Hasil checkup mata gaibku: Skor kesehatan dompetmu adalah **${score}/100** dengan predikat **${grade}**! ${
        netCashflow >= 0
          ? `Bulan ini kamu berhasil menyisihkan **${savingRate}%** pemasukan sebagai surplus.`
          : `Bulan ini kamu mengalami defisit kas sebesar **${formatIDR(Math.abs(netCashflow))}**!`
      }`,
      mood,
      dataCard: {
        type: "health_score",
        title: "🩺 Medical Checkup Finansial",
        subtitle: `Audit kesehatan dompet ${userName}`,
        totalAmount: score,
        formattedTotal: `${score}/100`,
        items,
        statusBadge: {
          label: badgeLabel,
          isPositive,
        },
        tip,
      },
      suggestedPrompts: [
        "Pengeluaran receh apa yang numpuk?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 17: LATTE FACTOR & DETEKSI BOCOR HALUS (Micro-expenses <= Rp 50.000)
  if (
    q.includes("latte factor") ||
    q.includes("bocor halus") ||
    q.includes("kebocoran") ||
    q.includes("receh") ||
    q.includes("transaksi kecil") ||
    q.includes("pengeluaran kecil")
  ) {
    const smallExpenses = allExpenses.filter(
      (t) => Math.abs(t.amount) <= 50000 && timeFilter.matchesDate(t.date)
    );
    const totalSmall = smallExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const countSmall = smallExpenses.length;
    const projectedAnnual = totalSmall * 12;
    const pctOfTotal = totalOutflow > 0 ? Math.round((totalSmall / totalOutflow) * 100) : 0;

    const items: GhostDataCardItem[] = smallExpenses.slice(0, 5).map((t) => ({
      label: `${t.description || "Transaksi kecil"} (${formatShortDate(t.date)})`,
      value: Math.abs(t.amount),
      formattedValue: formatIDR(Math.abs(t.amount)),
      color: "#f59e0b",
    }));

    return {
      text:
        countSmall > 0
          ? `Mata gaibku mencium bocor halus! ☕🔍 Ditemukan **${countSmall} transaksi receh** (≤ Rp 50.000) dengan total **${formatIDR(
              totalSmall
            )}** pada periode ini (${pctOfTotal}% dari total pengeluaran). Jika dibiarkan, setahun bisa tembus **${formatIDR(
              projectedAnnual
            )}**!`
          : `Boo! 👻 Bersih! Tidak ditemukan transaksi receh yang menumpuk pada periode ini. Pengeluaranmu terfokus pada transaksi terencana.`,
      mood: countSmall > 8 ? "spooky" : "thinking",
      dataCard: {
        type: "latte_factor",
        title: "☕ Deteksi Latte Factor (Bocor Halus)",
        subtitle: `${countSmall} transaksi receh di bawah Rp 50.000`,
        totalAmount: totalSmall,
        formattedTotal: formatIDR(totalSmall),
        items: [
          {
            label: "Estimasi Bocor per Tahun",
            value: projectedAnnual,
            formattedValue: formatIDR(projectedAnnual),
            color: "#ef4444",
          },
          ...items,
        ],
        statusBadge: {
          label: countSmall > 8 ? "Bocor Halus Terdeteksi ⚠️" : "Terkendali ✅",
          isPositive: countSmall <= 8,
        },
        tip: "Transaksi kecil seperti kopi sachet, parkir, jajan mini, dan biaya admin bank sering tidak disadari. Alihkan Rp 20.000/hari ke reksa dana bisa menjadi jutaan rupiah!",
      },
      suggestedPrompts: [
        "Kondisi keuanganku sehat gak?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Berapa pengeluaran makan di luar?",
      ],
    };
  }

  // CASE 18: SIMULASI TARGET & GOALS IMPIAN
  if (
    q.includes("target") ||
    q.includes("goals") ||
    q.includes("impian") ||
    q.includes("kapan bisa beli") ||
    q.includes("nabung berapa") ||
    q.includes("simulasi tabungan") ||
    q.includes("beli iphone") ||
    q.includes("beli motor") ||
    q.includes("beli mobil") ||
    q.includes("beli laptop")
  ) {
    const monthlySurplus = Math.max(0, totalInflow - totalOutflow);
    let targetAmount = 20000000;
    const matchJuta = q.match(/(\d+)\s*(juta|jt)/i);
    const matchNumber = q.match(/(\d{6,12})/);
    if (matchJuta && matchJuta[1]) {
      targetAmount = parseInt(matchJuta[1], 10) * 1000000;
    } else if (matchNumber && matchNumber[1]) {
      targetAmount = parseInt(matchNumber[1], 10);
    }

    const monthsNeeded = monthlySurplus > 0 ? Math.ceil(targetAmount / monthlySurplus) : 0;

    const items: GhostDataCardItem[] = [
      {
        label: "Target Nominal",
        value: targetAmount,
        formattedValue: formatIDR(targetAmount),
        color: "#a855f7",
      },
      {
        label: "Surplus Kas Bulananmu",
        value: monthlySurplus,
        formattedValue: formatIDR(monthlySurplus),
        color: monthlySurplus > 0 ? "#10b981" : "#ef4444",
      },
      {
        label: "Estimasi Waktu Tercapai",
        value: monthlySurplus > 0 ? `${monthsNeeded} Bulan (${(monthsNeeded / 12).toFixed(1)} Tahun)` : "Belum ada surplus",
        formattedValue: monthlySurplus > 0 ? `${monthsNeeded} Bulan` : "Defisit",
        color: "#38bdf8",
      },
      {
        label: "Jika Tabungan Dinaikkan +20%",
        value: monthlySurplus > 0 ? `${Math.ceil(targetAmount / (monthlySurplus * 1.2))} Bulan` : "-",
        formattedValue: monthlySurplus > 0 ? `${Math.ceil(targetAmount / (monthlySurplus * 1.2))} Bulan` : "-",
        color: "#f59e0b",
      },
    ];

    return {
      text:
        monthlySurplus > 0
          ? `Mata gaibku memproyeksikan impianmu! 🎯👻 Dengan surplus kas saat ini **${formatIDR(
              monthlySurplus
            )}/bulan**, kamu membutuhkan sekitar **${monthsNeeded} bulan** untuk mengumpulkan target **${formatIDR(
              targetAmount
            )}**.`
          : `Boo! 🎯👻 Saat ini arus kasku belum memiliki surplus (pemasukan habis terpakai). Kamu perlu memotong pos jajan atau menambah pemasukan agar simulasi tabungan target impian bisa berjalan!`,
      mood: monthlySurplus > 0 ? "happy" : "thinking",
      dataCard: {
        type: "goal_simulation",
        title: "🎯 Simulasi Tabungan & Target Impian",
        subtitle: `Proyeksi target ${formatIDR(targetAmount)}`,
        totalAmount: targetAmount,
        formattedTotal: formatIDR(targetAmount),
        items,
        statusBadge: {
          label: monthlySurplus > 0 ? `Target Realistis (~${monthsNeeded} Bln) 🚀` : "Perlu Surplus Kas ⚠️",
          isPositive: monthlySurplus > 0,
        },
        tip: "Ingin target tercapai lebih cepat? Simpan dana tabungan di awal gajian (Pay Yourself First) sebelum mulai belanja kebutuhan!",
      },
      suggestedPrompts: [
        "Kondisi keuanganku sehat gak?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
        "Bagaimana arus kasku (cash flow)?",
      ],
    };
  }

  // CASE 19: EVALUASI ATURAN BUDGET 50/30/20 (NEEDS / WANTS / SAVINGS)
  if (
    q.includes("50/30/20") ||
    q.includes("50 30 20") ||
    q.includes("aturan 50") ||
    q.includes("alokasi gaji") ||
    q.includes("pembagian gaji") ||
    q.includes("rasio ideal") ||
    q.includes("kebutuhan keinginan")
  ) {
    const monthlyIncome = totalInflow > 0 ? totalInflow : totalOutflow;
    let needsTotal = 0;
    let wantsTotal = 0;

    for (const t of allExpenses) {
      if (!timeFilter.matchesDate(t.date)) continue;
      const amt = Math.abs(t.amount);
      const text = `${t.description || ""} ${t.category?.name || ""}`.toLowerCase();
      if (
        text.includes("listrik") || text.includes("pln") || text.includes("air") ||
        text.includes("wifi") || text.includes("bensin") || text.includes("sewa") ||
        text.includes("transport") || text.includes("beras") || text.includes("pasar") ||
        text.includes("bpjs") || text.includes("asuransi") || text.includes("cicilan")
      ) {
        needsTotal += amt;
      } else {
        wantsTotal += amt;
      }
    }

    const savingsTotal = Math.max(0, totalInflow - totalOutflow);
    const needsPct = monthlyIncome > 0 ? Math.round((needsTotal / monthlyIncome) * 100) : 0;
    const wantsPct = monthlyIncome > 0 ? Math.round((wantsTotal / monthlyIncome) * 100) : 0;
    const savingsPct = monthlyIncome > 0 ? Math.round((savingsTotal / monthlyIncome) * 100) : 0;

    const items: GhostDataCardItem[] = [
      {
        label: "Kebutuhan Pokok (Target: 50%)",
        value: `${formatIDR(needsTotal)} (${needsPct}%)`,
        formattedValue: `${needsPct}% (Ideal: ≤50%)`,
        percent: Math.min(needsPct, 100),
        color: needsPct <= 55 ? "#10b981" : "#ef4444",
      },
      {
        label: "Keinginan & Lifestyle (Target: 30%)",
        value: `${formatIDR(wantsTotal)} (${wantsPct}%)`,
        formattedValue: `${wantsPct}% (Ideal: ≤30%)`,
        percent: Math.min(wantsPct, 100),
        color: wantsPct <= 35 ? "#3b82f6" : "#f59e0b",
      },
      {
        label: "Tabungan & Investasi (Target: 20%)",
        value: `${formatIDR(savingsTotal)} (${savingsPct}%)`,
        formattedValue: `${savingsPct}% (Ideal: ≥20%)`,
        percent: Math.min(savingsPct, 100),
        color: savingsPct >= 20 ? "#10b981" : "#ef4444",
      },
    ];

    const isHealthy = needsPct <= 60 && wantsPct <= 40 && savingsPct >= 15;

    return {
      text: `Boo! ⚖️👻 Menurut pedoman piramida 50/30/20: Alokasi uangmu adalah **${needsPct}% Kebutuhan**, **${wantsPct}% Keinginan**, dan **${savingsPct}% Tabungan**. ${
        isHealthy
          ? "Komposisimu sangat rapi dan mendekati rasio emas finansial!"
          : "Ada pos yang melebihi standar ideal. Cek bagian keinginan atau tingkatkan porsi tabunganmu!"
      }`,
      mood: isHealthy ? "happy" : "thinking",
      dataCard: {
        type: "rule_50_30_20",
        title: "⚖️ Evaluasi Rasio Gaji 50/30/20",
        subtitle: `Komposisi alokasi keuangan ${timeFilter.rangeLabel}`,
        totalAmount: monthlyIncome,
        formattedTotal: formatIDR(monthlyIncome),
        items,
        statusBadge: {
          label: isHealthy ? "Rasio Ideal Tercapai ✅" : "Perlu Kalibrasi Ulang ⚠️",
          isPositive: isHealthy,
        },
        tip: "Rumus 50/30/20: 50% untuk kebutuhan dasar hidup, 30% untuk rekreasi & gaya hidup, dan 20% wajib diamankan untuk dana darurat / investasi.",
      },
      suggestedPrompts: [
        "Kondisi keuanganku sehat gak?",
        "Pengeluaran receh apa yang numpuk?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 20: DETEKSI TRANSAKSI DUPLIKAT & ANOMALI
  if (
    q.includes("mencurigakan") ||
    q.includes("duplikat") ||
    q.includes("ganda") ||
    q.includes("anomali") ||
    q.includes("aneh") ||
    q.includes("double") ||
    q.includes("transaksi kembar") ||
    q.includes("cek transaksi")
  ) {
    const duplicatePairs: TransactionApiItem[] = [];
    const seen = new Map<string, TransactionApiItem>();

    for (const t of allExpenses) {
      if (!timeFilter.matchesDate(t.date)) continue;
      const key = `${Math.abs(t.amount)}_${t.date ? t.date.slice(0, 10) : ""}`;
      if (seen.has(key)) {
        duplicatePairs.push(seen.get(key)!);
        duplicatePairs.push(t);
      } else {
        seen.set(key, t);
      }
    }

    const avgExpense = allExpenses.length > 0 ? totalOutflow / allExpenses.length : 0;
    const outliers = allExpenses.filter(
      (t) => timeFilter.matchesDate(t.date) && Math.abs(t.amount) > avgExpense * 3 && Math.abs(t.amount) > 500000
    );

    const hasIssue = duplicatePairs.length > 0 || outliers.length > 0;

    const items: GhostDataCardItem[] = [];
    if (duplicatePairs.length > 0) {
      items.push({
        label: "Potensi Transaksi Kembar / Ganda",
        value: `${duplicatePairs.length / 2} pasangan terdeteksi`,
        formattedValue: `${duplicatePairs.length} transaksi`,
        color: "#ef4444",
      });
      duplicatePairs.slice(0, 4).forEach((d) => {
        items.push({
          label: `${d.description || "Transaksi"} (${formatShortDate(d.date)})`,
          value: Math.abs(d.amount),
          formattedValue: formatIDR(Math.abs(d.amount)),
          color: "#f59e0b",
        });
      });
    }

    if (outliers.length > 0) {
      items.push({
        label: "Lonjakan Ekstrem (>3x Rata-rata)",
        value: `${outliers.length} transaksi`,
        formattedValue: `${outliers.length} lonjakan`,
        color: "#e11d48",
      });
      outliers.slice(0, 2).forEach((o) => {
        items.push({
          label: `${o.description || "Lonjakan"} (${formatShortDate(o.date)})`,
          value: Math.abs(o.amount),
          formattedValue: formatIDR(Math.abs(o.amount)),
          color: "#ec4899",
        });
      });
    }

    return {
      text: hasIssue
        ? `Mata gaibku menangkap anomali! 🕵️👻 Terdeteksi **${
            duplicatePairs.length > 0 ? `${duplicatePairs.length / 2} transaksi kembar/ganda` : ""
          }${duplicatePairs.length > 0 && outliers.length > 0 ? " dan " : ""}${
            outliers.length > 0 ? `${outliers.length} lonjakan transaksi tidak wajar` : ""
          }. Pastikan tidak ada pembayaran terpotong dua kali!`
        : `Boo! 🛡️👻 Semua aman terkendali! Tidak terdeteksi transaksi kembar, tagihan duplikat, atau anomali mencurigakan pada catatan ${timeFilter.rangeLabel}.`,
      mood: hasIssue ? "spooky" : "happy",
      dataCard: {
        type: "anomaly",
        title: "🕵️ Sensor Anomali & Transaksi Duplikat",
        subtitle: hasIssue ? "Ditemukan transaksi yang perlu dicek ulang" : "Catatan transaksi normal & aman",
        totalAmount: duplicatePairs.length + outliers.length,
        formattedTotal: hasIssue ? `${duplicatePairs.length / 2} Kembar / ${outliers.length} Anomali` : "Aman 100%",
        items: items.length > 0 ? items : [
          { label: "Transaksi Ganda", value: "0", formattedValue: "Nihil ✅", color: "#10b981" },
          { label: "Lonjakan Ekstrem", value: "0", formattedValue: "Nihil ✅", color: "#10b981" },
          { label: "Status Rekonsiliasi", value: "Aman", formattedValue: "Sinkron", color: "#38bdf8" },
        ],
        statusBadge: {
          label: hasIssue ? "Perlu Verifikasi ⚠️" : "Bebas Anomali ✅",
          isPositive: !hasIssue,
        },
        tip: "Periksa bukti mutasi rekening bank atau struk jika ada merchant yang menarik saldo dua kali untuk belanjaan yang sama.",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Transaksi terbesar bulan ini apa?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // CASE 21: PENGELUARAN KEMARIN (YESTERDAY EXPENSE)
  if (q.includes("kemarin") || q.includes("yesterday")) {
    const yesterdayExpenses = allExpenses.filter((t) => timeFilter.matchesDate(t.date));
    const totalYesterday = yesterdayExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const items: GhostDataCardItem[] = yesterdayExpenses.slice(0, 5).map((t) => ({
      label: t.description || t.category?.name || "Pengeluaran",
      value: Math.abs(t.amount),
      formattedValue: formatIDR(Math.abs(t.amount)),
      color: "#ec4899",
    }));

    return {
      text:
        totalYesterday > 0
          ? `Boo! 📅👻 Pengeluaranmu **kemarin** tercatat sebesar **${formatIDR(
              totalYesterday
            )}** dari **${yesterdayExpenses.length} transaksi**.`
          : `Boo! 📅👻 Kemarin kamu tidak mencatat pengeluaran sama sekali (Rp 0). Hari yang sangat hemat!`,
      mood: totalYesterday > 0 ? "thinking" : "happy",
      dataCard: {
        type: "yesterday_expense",
        title: "📅 Pengeluaran Kemarin",
        subtitle: `${yesterdayExpenses.length} transaksi tercatat kemarin`,
        totalAmount: totalYesterday,
        formattedTotal: formatIDR(totalYesterday),
        items,
        statusBadge: {
          label: totalYesterday > 0 ? "Catatan Kemarin 📅" : "Hari Tanpa Pengeluaran 🌟",
          isPositive: totalYesterday === 0,
        },
        tip: "Mencatat pengeluaran harian secara disiplin membantu mengontrol ritme cashflow sebelum akhir bulan!",
      },
      suggestedPrompts: [
        "Berapa total pengeluaranku?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // =========================================================================
  // PILAR 6: KASUS WAKTU & RITME PENGELUARAN (TEMPORAL CADENCE)
  // =========================================================================

  // CASE 22: PENGELUARAN HARI INI (TODAY'S EXPENSES)
  if (q.includes("hari ini") || q.includes("today") || (q.includes("belanja apa") && !q.includes("kemarin"))) {
    const todayExpenses = allExpenses.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      const now = new Date();
      return (
        d.getFullYear() === now.getFullYear() &&
        d.getMonth() === now.getMonth() &&
        d.getDate() === now.getDate()
      );
    });
    const totalToday = todayExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);

    const items: GhostDataCardItem[] = todayExpenses.slice(0, 6).map((t) => ({
      label: t.description || t.category?.name || "Pengeluaran",
      value: Math.abs(t.amount),
      formattedValue: formatIDR(Math.abs(t.amount)),
      color: "#10b981",
    }));

    return {
      text:
        totalToday > 0
          ? `Boo! ☀️👻 Pengeluaranmu **hari ini** tercatat sebesar **${formatIDR(
              totalToday
            )}** dari **${todayExpenses.length} transaksi**.`
          : `Boo! ☀️👻 Kamu belum mencatat pengeluaran apa pun hari ini (Rp 0). Dompetmu masih aman terkendali!`,
      mood: totalToday > 0 ? "thinking" : "happy",
      dataCard: {
        type: "today_expense",
        title: "☀️ Pengeluaran Hari Ini",
        subtitle: `${todayExpenses.length} transaksi tercatat hari ini`,
        totalAmount: totalToday,
        formattedTotal: formatIDR(totalToday),
        items,
        statusBadge: {
          label: totalToday > 0 ? "Aktivitas Hari Ini ☀️" : "Belum Ada Pengeluaran 🛡️",
          isPositive: totalToday === 0,
        },
        tip: "Mencatat transaksi seketika setelah membeli membantu mencegah lupa dan menjaga akurasi laporan keuanganmu!",
      },
      suggestedPrompts: [
        "Kemarin saya habis berapa?",
        "Berapa rata-rata pengeluaranku sehari?",
        "Berapa total pengeluaran bulan ini?",
      ],
    };
  }

  // CASE 23: PENGELUARAN MINGGU INI (THIS WEEK'S EXPENSES)
  if (
    q.includes("minggu ini") ||
    q.includes("pekan ini") ||
    q.includes("this week") ||
    q.includes("seminggu") ||
    q.includes("7 hari")
  ) {
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    const weekExpenses = allExpenses.filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d >= sevenDaysAgo && d <= now;
    });
    const totalWeek = weekExpenses.reduce((sum, t) => sum + Math.abs(t.amount), 0);
    const avgDailyWeek = Math.round(totalWeek / 7);

    const items: GhostDataCardItem[] = weekExpenses.slice(0, 6).map((t) => ({
      label: `${t.description || t.category?.name || "Belanja"} (${formatShortDate(t.date)})`,
      value: Math.abs(t.amount),
      formattedValue: formatIDR(Math.abs(t.amount)),
      color: "#8b5cf6",
    }));

    return {
      text: `Boo! 📆👻 Dalam **7 hari terakhir**, kamu telah membelanjakan **${formatIDR(
        totalWeek
      )}** (${weekExpenses.length} transaksi, rata-rata **${formatIDR(avgDailyWeek)}/hari**).`,
      mood: totalWeek > 0 ? "thinking" : "happy",
      dataCard: {
        type: "week_expense",
        title: "📆 Pengeluaran 7 Hari Terakhir",
        subtitle: `Rata-rata belanja harian: ${formatIDR(avgDailyWeek)}/hari`,
        totalAmount: totalWeek,
        formattedTotal: formatIDR(totalWeek),
        items,
        statusBadge: {
          label: "Audit Mingguan 📊",
          isPositive: true,
        },
        tip: "Jika rata-rata mingguan melampaui 1/4 jatah budget bulanan, rem pengeluaran impulsif di akhir pekan!",
      },
      suggestedPrompts: [
        "Hari apa saya paling boros?",
        "Berapa rata-rata pengeluaranku sehari?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 24: BURN RATE & RATA-RATA HARIAN (DAILY BURN RATE & FORECAST)
  if (
    q.includes("burn rate") ||
    q.includes("rata-rata sehari") ||
    q.includes("sehari habis") ||
    q.includes("rata rata harian") ||
    q.includes("pengeluaran per hari") ||
    q.includes("sehari berapa") ||
    q.includes("burnrate")
  ) {
    const now = new Date();
    const daysPassed = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyRate = Math.round(totalOutflow / daysPassed);
    const projectedTotal = dailyRate * daysInMonth;

    return {
      text: `Boo! ⚡👻 Kecepatan belanja (*burn rate*) kamu saat ini adalah rata-rata **${formatIDR(
        dailyRate
      )} per hari** (${daysPassed} hari berjalan). Jika ritme ini berlanjut, estimasi total belanja akhir bulanmu akan mencapai **${formatIDR(
        projectedTotal
      )}**.`,
      mood: dailyRate > 250000 ? "spooky" : "thinking",
      dataCard: {
        type: "burn_rate",
        title: "⚡ Burn Rate & Laju Belanja Harian",
        subtitle: `Berdasarkan ${daysPassed} hari berjalan di bulan ini`,
        totalAmount: dailyRate,
        formattedTotal: `${formatIDR(dailyRate)} / hari`,
        items: [
          { label: "Rata-Rata Terpakai / Hari", value: dailyRate, formattedValue: formatIDR(dailyRate), color: "#f59e0b" },
          { label: "Proyeksi Akhir Bulan", value: projectedTotal, formattedValue: formatIDR(projectedTotal), color: "#ec4899" },
          { label: "Total Pengeluaran Saat Ini", value: totalOutflow, formattedValue: formatIDR(totalOutflow), color: "#6366f1" },
        ],
        statusBadge: {
          label: totalInflow > 0 && projectedTotal > totalInflow ? "Risiko Defisit ⚠️" : "Laju Aman ✅",
          isPositive: totalInflow === 0 || projectedTotal <= totalInflow,
        },
        tip: "Targetkan batas belanja harian (*daily allowance*) agar tidak terjadi 'kaget bon' di minggu terakhir bulan!",
      },
      suggestedPrompts: [
        "Berapa proyeksi pengeluaranku akhir bulan?",
        "Berapa bulan dana daruratku bisa bertahan?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // =========================================================================
  // PILAR 7: POS GAYA HIDUP & HOBI SPESIFIK (LIFESTYLE & HOBBIES)
  // =========================================================================

  // CASE 25: HIBURAN, BIOSKOP, GAME & REKREASI (ENTERTAINMENT & GAMING)
  if (
    q.includes("hiburan") ||
    q.includes("game") ||
    q.includes("gaming") ||
    q.includes("steam") ||
    q.includes("playstation") ||
    q.includes("ps5") ||
    q.includes("nintendo") ||
    q.includes("bioskop") ||
    q.includes("cinema") ||
    q.includes("xxi") ||
    q.includes("cgv") ||
    q.includes("konser") ||
    q.includes("karaoke") ||
    q.includes("topup") ||
    q.includes("mobile legends") ||
    q.includes("valorant") ||
    q.includes("rekreasi")
  ) {
    const keywords = [
      "game", "gaming", "steam", "playstation", "ps5", "ps4", "nintendo", "xbox",
      "bioskop", "cinema", "xxi", "cgv", "konser", "tiket", "karaoke", "topup",
      "top up", "mobile legends", "valorant", "genshin", "roblox", "hiburan", "rekreasi",
    ];

    const enterTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = enterTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);
    const count = enterTx.length;

    const items: GhostDataCardItem[] = enterTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Hiburan"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#ec4899",
    }));

    return {
      text:
        total > 0
          ? `Boo! 🎮🍿 Pos hiburan & rekreasi untuk **${timeFilter.rangeLabel}** tercatat **${formatIDR(
              total
            )}** dari **${count} transaksi**.`
          : `Boo! 🎮 Belum ada catatan belanja hiburan, game, atau bioskop untuk **${timeFilter.rangeLabel}**, ${userName}.`,
      mood: total > 500000 ? "spooky" : "happy",
      dataCard: {
        type: "entertainment",
        title: "🎮 Hiburan, Game & Rekreasi",
        subtitle: `${count} transaksi pada ${timeFilter.rangeLabel}`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: total > 500000 ? "Pos Kesenangan Tinggi 🍿" : "Terkendali Wajar 🎮",
          isPositive: total <= 500000,
        },
        tip: "Bagus untuk refreshing! Pastikan pos hiburan tidak melebihi 10% dari alokasi pos Keinginan (Wants).",
      },
      suggestedPrompts: [
        "Berapa pengeluaran makan di luar?",
        "Berapa pengeluaran belanja online?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
      ],
    };
  }

  // CASE 26: KESEHATAN, OBAT, DOKTER & MEDIS (HEALTH & MEDICAL)
  if (
    q.includes("kesehatan") ||
    q.includes("obat") ||
    q.includes("dokter") ||
    q.includes("rumah sakit") ||
    q.includes("apotek") ||
    q.includes("klinik") ||
    q.includes("halodoc") ||
    q.includes("alodokter") ||
    q.includes("kimia farma") ||
    q.includes("k24") ||
    q.includes("vitamin") ||
    q.includes("medis") ||
    (q.includes("bpjs") && !q.includes("ketenagakerjaan"))
  ) {
    const keywords = [
      "obat", "dokter", "klinik", "rs", "rumah sakit", "apotek", "halodoc",
      "alodokter", "kimia farma", "k24", "k-24", "century", "guardian", "watsons",
      "vitamin", "suplemen", "bpjs kesehatan", "medis", "kesehatan", "laboratorium", "lab",
    ];

    const healthTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = healthTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const items: GhostDataCardItem[] = healthTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Kesehatan"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#10b981",
    }));

    return {
      text:
        total > 0
          ? `Boo! 🩺👻 Pengeluaran kesehatan & medismu untuk **${timeFilter.rangeLabel}** adalah **${formatIDR(
              total
            )}** (${healthTx.length} transaksi). Kesehatan adalah aset nomor satu!`
          : `Boo! 🩺 Bersih dari biaya obat atau dokter untuk **${timeFilter.rangeLabel}**. Semoga selalu sehat walafiat, ${userName}!`,
      mood: "happy",
      dataCard: {
        type: "health",
        title: "🩺 Biaya Kesehatan & Medis",
        subtitle: `${healthTx.length} transaksi pada ${timeFilter.rangeLabel}`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Pos Perlindungan Diri 🏥",
          isPositive: true,
        },
        tip: "Biaya kesehatan termasuk pos 'Kebutuhan Utama' (Needs). Selalu jaga asuransi & dana darurat tetap aktif!",
      },
      suggestedPrompts: [
        "Berapa bulan dana daruratku bisa bertahan?",
        "Berapa total tagihan rutin saya?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // CASE 27: DONASI, ZAKAT & SEDEKAH (CHARITY & GIVING)
  if (
    q.includes("zakat") ||
    q.includes("sedekah") ||
    q.includes("donasi") ||
    q.includes("infak") ||
    q.includes("infaq") ||
    q.includes("amal") ||
    q.includes("kitabisa") ||
    q.includes("perpuluhan") ||
    q.includes("masjid") ||
    q.includes("gereja") ||
    q.includes("wakaf")
  ) {
    const keywords = [
      "zakat", "sedekah", "donasi", "infak", "infaq", "amal", "kitabisa",
      "perpuluhan", "masjid", "gereja", "wakaf", "pantiasuhan", "panti asuhan",
    ];

    const charityTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = charityTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const items: GhostDataCardItem[] = charityTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Kebaikan"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#06b6d4",
    }));

    return {
      text:
        total > 0
          ? `Alhamdulillah / Puji Tuhan! 🤲✨ Kamu telah menyalurkan **${formatIDR(
              total
            )}** untuk donasi, zakat, atau sedekah pada **${timeFilter.rangeLabel}**. Berbagi membawa berkah!`
          : `Boo! 🤲 Belum ada catatan zakat atau donasi untuk **${timeFilter.rangeLabel}**, ${userName}. Berbagi sedikit selalu membawa ketenangan batin!`,
      mood: "happy",
      dataCard: {
        type: "charity",
        title: "🤲 Zakat, Donasi & Sedekah",
        subtitle: `${charityTx.length} transaksi kebaikan tercatat`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Kebaikan Hati 💚",
          isPositive: true,
        },
        tip: "Alokasi sedekah/zakat 2.5% - 10% adalah kebiasaan finansial yang sangat mulia dan menenangkan batin.",
      },
      suggestedPrompts: [
        "Bagaimana arus kasku (cash flow)?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
        "Berapa pemasukanku bulan ini?",
      ],
    };
  }

  // CASE 28: PERAWATAN DIRI, SALON, BARBERSHOP & SKINCARE (PERSONAL CARE)
  if (
    q.includes("skincare") ||
    q.includes("salon") ||
    q.includes("barbershop") ||
    q.includes("cukur") ||
    q.includes("potong rambut") ||
    q.includes("makeup") ||
    q.includes("kosmetik") ||
    q.includes("spa") ||
    q.includes("facial") ||
    q.includes("treatment") ||
    q.includes("sociolla") ||
    q.includes("perawatan")
  ) {
    const keywords = [
      "skincare", "skin care", "salon", "barbershop", "barber", "cukur",
      "potong rambut", "makeup", "kosmetik", "spa", "facial", "treatment",
      "sociolla", "somethinc", "avouskin", "perawatan",
    ];

    const careTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = careTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const items: GhostDataCardItem[] = careTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Perawatan"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#ec4899",
    }));

    return {
      text:
        total > 0
          ? `Boo! 💅💈 Belanja perawatan diri & grooming kamu pada **${timeFilter.rangeLabel}** adalah **${formatIDR(
              total
            )}** (${careTx.length} transaksi). Self-care penting agar tetap percaya diri!`
          : `Boo! 💅 Belum ada transaksi skincare atau salon untuk **${timeFilter.rangeLabel}**, ${userName}.`,
      mood: "happy",
      dataCard: {
        type: "personal_care",
        title: "💅 Perawatan Diri & Skincare",
        subtitle: `${careTx.length} transaksi pada ${timeFilter.rangeLabel}`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Investasi Penampilan ✨",
          isPositive: true,
        },
        tip: "Perawatan diri masuk ke pos 'Keinginan' (Wants). Pastikan belinya karena habis, bukan sekadar FOMO promo!",
      },
      suggestedPrompts: [
        "Berapa pengeluaran belanja online?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // CASE 29: PENDIDIKAN, BUKU, KURSUS & BELAJAR (EDUCATION & UPSKILLING)
  if (
    q.includes("pendidikan") ||
    q.includes("kursus") ||
    q.includes("kuliah") ||
    q.includes("sekolah") ||
    q.includes("spp") ||
    q.includes("buku") ||
    q.includes("gramedia") ||
    q.includes("bootcamp") ||
    q.includes("udemy") ||
    q.includes("coursera") ||
    q.includes("seminar") ||
    q.includes("workshop") ||
    q.includes("les") ||
    q.includes("bimbel")
  ) {
    const keywords = [
      "kursus", "kuliah", "sekolah", "spp", "buku", "gramedia", "bootcamp",
      "udemy", "coursera", "seminar", "workshop", "les", "bimbel", "pendidikan", "training",
    ];

    const eduTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = eduTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const items: GhostDataCardItem[] = eduTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Pendidikan"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#3b82f6",
    }));

    return {
      text:
        total > 0
          ? `Boo! 📚🎓 Investasi leher ke atas! Kamu telah mengeluarkan **${formatIDR(
              total
            )}** untuk buku, kursus, atau pendidikan pada **${timeFilter.rangeLabel}**. Ini pengeluaran dengan ROI tertinggi!`
          : `Boo! 📚 Belum ada catatan buku atau kursus untuk **${timeFilter.rangeLabel}**. Selalu sempatkan upgrade ilmu ya, ${userName}!`,
      mood: "happy",
      dataCard: {
        type: "education",
        title: "📚 Pendidikan & Kursus",
        subtitle: `${eduTx.length} transaksi pada ${timeFilter.rangeLabel}`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Investasi Leher ke Atas 🧠",
          isPositive: true,
        },
        tip: "Uang yang dikeluarkan untuk skill dan pengetahuan baru akan melipatgandakan nilai earning power kamu!",
      },
      suggestedPrompts: [
        "Bagaimana arus kasku (cash flow)?",
        "Kondisi keuanganku sehat gak?",
        "Berapa pemasukanku bulan ini?",
      ],
    };
  }

  // CASE 30: HEWAN PELIHARAAN / ANABUL (PET CARE)
  if (
    q.includes("kucing") ||
    q.includes("anjing") ||
    q.includes("anabul") ||
    q.includes("petshop") ||
    q.includes("pet shop") ||
    q.includes("whiskas") ||
    q.includes("royal canin") ||
    q.includes("dokter hewan") ||
    q.includes("vet") ||
    q.includes("peliharaan")
  ) {
    const keywords = [
      "petshop", "pet shop", "kucing", "anjing", "cat", "dog", "whiskas",
      "royal canin", "pro plan", "pasir kucing", "dokter hewan", "vet", "grooming pet",
    ];

    const petTx = allTx.filter((t) => {
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return keywords.some((kw) => combined.includes(kw)) && timeFilter.matchesDate(t.date);
    });

    const total = petTx.reduce((sum, t) => sum + Number(t.amount || 0), 0);

    const items: GhostDataCardItem[] = petTx.slice(0, 5).map((t) => ({
      label: `${t.description || t.category?.name || "Anabul"} (${formatShortDate(t.date)})`,
      value: t.amount,
      formattedValue: formatIDR(t.amount),
      color: "#f59e0b",
    }));

    return {
      text:
        total > 0
          ? `Meow & Woof! 🐾👻 Biaya untuk anabul tersayang pada **${timeFilter.rangeLabel}** tercatat **${formatIDR(
              total
            )}** (${petTx.length} transaksi). Menjaga mereka tetap sehat & bahagia!`
          : `Boo! 🐾 Belum ada transaksi pet shop atau dokter hewan untuk **${timeFilter.rangeLabel}**, ${userName}.`,
      mood: "happy",
      dataCard: {
        type: "pet_care",
        title: "🐾 Biaya Hewan Peliharaan",
        subtitle: `${petTx.length} transaksi pada ${timeFilter.rangeLabel}`,
        totalAmount: total,
        formattedTotal: formatIDR(total),
        items,
        statusBadge: {
          label: "Demi Kesejahteraan Anabul 🐱",
          isPositive: true,
        },
        tip: "Beli makanan anabul dalam kemasan besar (karungan) biasanya hemat 20-30% dibanding kemasan sachet kecil!",
      },
      suggestedPrompts: [
        "Berapa total pengeluaranku?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Kategori apa yang paling boros?",
      ],
    };
  }

  // =========================================================================
  // PILAR 8: AUDIT KETAHANAN FINANSIAL & KEAMANAN KAS (SAFETY & PROJECTIONS)
  // =========================================================================

  // CASE 31: DANA DARURAT & RUNWAY KETAHANAN KAS (EMERGENCY FUND RUNWAY)
  if (
    q.includes("dana darurat") ||
    q.includes("emergency fund") ||
    q.includes("runway") ||
    q.includes("ketahanan") ||
    q.includes("bertahan berapa bulan") ||
    q.includes("bisa hidup berapa lama") ||
    q.includes("cadangan kas")
  ) {
    const monthlyExpense = totalOutflow > 0 ? totalOutflow : 1;
    const runwayMonths = totalBalance > 0 ? (totalBalance / monthlyExpense).toFixed(1) : "0.0";
    const runwayNum = parseFloat(runwayMonths);

    let status = "Waspada ⚠️ (Di bawah 3 Bulan)";
    let isPositive = false;
    let mood: GhostMood = "spooky";

    if (runwayNum >= 6) {
      status = "Sangat Kuat 🛡️ (6+ Bulan Aman)";
      isPositive = true;
      mood = "happy";
    } else if (runwayNum >= 3) {
      status = "Cukup Baik 🆗 (3-6 Bulan)";
      isPositive = true;
      mood = "thinking";
    }

    return {
      text: `Boo! 🛡️👻 Berdasarkan total saldo aktifmu (**${formatIDR(
        totalBalance
      )}**) dan laju belanja bulananmu (**${formatIDR(
        totalOutflow
      )}**), kasmu dapat bertahan selama **${runwayMonths} bulan** tanpa penghasilan baru.`,
      mood,
      dataCard: {
        type: "emergency_runway",
        title: "🛡️ Runway Dana Darurat",
        subtitle: `Ketahanan hidup: ${runwayMonths} bulan tanpa pemasukan`,
        totalAmount: totalBalance,
        formattedTotal: `${runwayMonths} Bulan`,
        items: [
          { label: "Total Kas Likuid", value: totalBalance, formattedValue: formatIDR(totalBalance), color: "#10b981" },
          { label: "Pengeluaran Bulanan", value: totalOutflow, formattedValue: formatIDR(totalOutflow), color: "#ef4444" },
          { label: "Target Minimal (3 Bulan)", value: totalOutflow * 3, formattedValue: formatIDR(totalOutflow * 3), color: "#f59e0b" },
          { label: "Target Ideal (6 Bulan)", value: totalOutflow * 6, formattedValue: formatIDR(totalOutflow * 6), color: "#3b82f6" },
        ],
        statusBadge: {
          label: status,
          isPositive,
        },
        tip: "Simpan dana darurat di instrumen likuid & aman seperti Reksa Dana Pasar Uang atau Bank Digital bunga tinggi!",
      },
      suggestedPrompts: [
        "Kondisi keuanganku sehat gak?",
        "Berapa total saldo rekening saya?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
      ],
    };
  }

  // CASE 32: PROYEKSI PENGELUARAN AKHIR BULAN (MONTH-END PROJECTION)
  if (
    q.includes("proyeksi") ||
    q.includes("perkiraan akhir bulan") ||
    q.includes("tembus berapa") ||
    q.includes("akhir bulan habis berapa") ||
    q.includes("estimasi akhir bulan") ||
    q.includes("prediksi pengeluaran")
  ) {
    const now = new Date();
    const daysPassed = Math.max(1, now.getDate());
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const dailyRate = totalOutflow / daysPassed;
    const projectedTotal = Math.round(dailyRate * daysInMonth);
    const projectedSurplus = totalInflow - projectedTotal;

    return {
      text: `Boo! 🔮👻 Dengan laju rata-rata belanja saat ini (**${formatIDR(
        Math.round(dailyRate)
      )}/hari**), total pengeluaranmu hingga akhir bulan diproyeksikan mencapai **${formatIDR(
        projectedTotal
      )}**. ${
        projectedSurplus >= 0
          ? `Kamu masih diprediksi surplus **+${formatIDR(projectedSurplus)}**! 👍`
          : `Waspada, kamu berisiko defisit **-${formatIDR(Math.abs(projectedSurplus))}** jika tidak direm! ⚠️`
      }`,
      mood: projectedSurplus >= 0 ? "happy" : "spooky",
      dataCard: {
        type: "projection",
        title: "🔮 Proyeksi Pengeluaran Akhir Bulan",
        subtitle: `Estimasi hingga tanggal ${daysInMonth} ${timeFilter.currentMonthName}`,
        totalAmount: projectedTotal,
        formattedTotal: formatIDR(projectedTotal),
        items: [
          { label: "Realisasi Saat Ini", value: totalOutflow, formattedValue: formatIDR(totalOutflow), color: "#6366f1" },
          { label: "Proyeksi Total Akhir Bulan", value: projectedTotal, formattedValue: formatIDR(projectedTotal), color: "#ec4899" },
          { label: "Total Pemasukan Bulan Ini", value: totalInflow, formattedValue: formatIDR(totalInflow), color: "#10b981" },
          { label: "Prediksi Selisih Net", value: projectedSurplus, formattedValue: formatIDR(projectedSurplus), color: projectedSurplus >= 0 ? "#10b981" : "#ef4444" },
        ],
        statusBadge: {
          label: projectedSurplus >= 0 ? "Prediksi Surplus ✅" : "Prediksi Defisit ⚠️",
          isPositive: projectedSurplus >= 0,
        },
        tip: "Jika proyeksi belanja mendekati atau melebihi pemasukan, segera tunda belanja non-primer sampai awal bulan depan!",
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Berapa rata-rata pengeluaranku sehari?",
        "Bagaimana arus kasku (cash flow)?",
      ],
    };
  }

  // CASE 33: POLA HARI & WEEKEND PALING BOROS (SPENDING PATTERN BY DAY)
  if (
    q.includes("kapan paling boros") ||
    q.includes("hari apa paling boros") ||
    q.includes("pola belanja") ||
    q.includes("weekend") ||
    q.includes("hari paling boros") ||
    q.includes("hari terboros")
  ) {
    let weekendTotal = 0;
    let weekdayTotal = 0;
    const dayTotals = [0, 0, 0, 0, 0, 0, 0]; // 0: Minggu s/d 6: Sabtu
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

    allExpenses.forEach((t) => {
      if (!t.date) return;
      const d = new Date(t.date);
      const day = d.getDay();
      const amt = Math.abs(t.amount || 0);
      dayTotals[day] += amt;
      if (day === 0 || day === 6) {
        weekendTotal += amt;
      } else {
        weekdayTotal += amt;
      }
    });

    let maxDayIdx = 0;
    let maxDayAmt = 0;
    dayTotals.forEach((amt, idx) => {
      if (amt > maxDayAmt) {
        maxDayAmt = amt;
        maxDayIdx = idx;
      }
    });

    return {
      text: `Boo! 📊👻 Analisis pola hari: Kamu paling banyak mengeluarkan uang pada hari **${dayNames[maxDayIdx]}** (total **${formatIDR(
        maxDayAmt
      )}**). Total belanja Weekend (Sabtu-Minggu) tercatat **${formatIDR(
        weekendTotal
      )}**, sedangkan Weekday (Senin-Jumat) sebesar **${formatIDR(weekdayTotal)}**.`,
      mood: "thinking",
      dataCard: {
        type: "spending_pattern",
        title: "📊 Hari Terboros & Pola Belanja",
        subtitle: `Puncak pengeluaran ada di hari ${dayNames[maxDayIdx]}`,
        totalAmount: maxDayAmt,
        formattedTotal: `${dayNames[maxDayIdx]} (${formatIDR(maxDayAmt)})`,
        items: [
          { label: `Puncak: Hari ${dayNames[maxDayIdx]}`, value: maxDayAmt, formattedValue: formatIDR(maxDayAmt), color: "#ef4444" },
          { label: "Total Akhir Pekan (Weekend)", value: weekendTotal, formattedValue: formatIDR(weekendTotal), color: "#f59e0b" },
          { label: "Total Hari Kerja (Weekday)", value: weekdayTotal, formattedValue: formatIDR(weekdayTotal), color: "#3b82f6" },
        ],
        statusBadge: {
          label: weekendTotal > weekdayTotal ? "Boros di Weekend 🏖️" : "Merata Sepanjang Minggu ⚖️",
          isPositive: weekendTotal <= weekdayTotal,
        },
        tip: "Akhir pekan sering jadi titik lemah 'bocor halus'. Buat anggaran jajan khusus weekend sebelum keluar rumah!",
      },
      suggestedPrompts: [
        "Pengeluaran receh apa yang numpuk?",
        "Berapa pengeluaran makan di luar?",
        "Berapa pengeluaran kopi saya bulan ini?",
      ],
    };
  }

  // CASE 34: BIAYA ADMIN BANK & BIAYA LAYANAN (BANK & PLATFORM FEES)
  if (
    q.includes("biaya admin") ||
    q.includes("admin bank") ||
    q.includes("fee transfer") ||
    q.includes("biaya transfer") ||
    q.includes("biaya layanan") ||
    q.includes("admin fee") ||
    q.includes("ongkir")
  ) {
    const feeKeywords = ["admin", "biaya layanan", "fee transfer", "biaya transfer", "biaya topup", "ongkir", "ongkos kirim"];
    const feeTx = allTx.filter((t) => {
      if (t.adminFee && t.adminFee > 0) return true;
      if (t.type !== "expense") return false;
      const combined = `${t.description || ""} ${t.note || ""} ${t.category?.name || ""}`.toLowerCase();
      return feeKeywords.some((kw) => combined.includes(kw));
    });

    const totalAdminFee = feeTx.reduce((sum, t) => sum + (t.adminFee || 0) + (t.amount < 20000 ? t.amount : 0), 0);

    return {
      text:
        totalAdminFee > 0
          ? `Boo! 💸👻 Total biaya admin & fee layanan yang terdeteksi adalah sekitar **${formatIDR(
              totalAdminFee
            )}** dari **${feeTx.length} transaksi**. Biaya kecil yang sering terabaikan!`
          : `Boo! 💸 Bersih dari biaya admin! Tidak terdeteksi potongan biaya transfer atau admin yang mencolok pada catatanmu.`,
      mood: totalAdminFee > 50000 ? "spooky" : "happy",
      dataCard: {
        type: "admin_fees",
        title: "💸 Biaya Admin & Fee Layanan",
        subtitle: `${feeTx.length} transaksi terdeteksi memiliki admin fee`,
        totalAmount: totalAdminFee,
        formattedTotal: formatIDR(totalAdminFee),
        items: feeTx.slice(0, 5).map((t) => ({
          label: t.description || "Biaya Layanan",
          value: t.adminFee || t.amount,
          formattedValue: formatIDR(t.adminFee || t.amount),
          color: "#f59e0b",
        })),
        statusBadge: {
          label: totalAdminFee > 50000 ? "Potongan Lumayan Tinggi ⚠️" : "Minimal & Efisien ✅",
          isPositive: totalAdminFee <= 50000,
        },
        tip: "Gunakan transfer BI-FAST (Rp 2.500) atau aplikasi transfer gratis (Flip / Bank Jago / SeaBank) untuk mengeliminasi biaya admin!",
      },
      suggestedPrompts: [
        "Pengeluaran receh apa yang numpuk?",
        "Berapa total pengeluaranku?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // CASE 35: TIPS FINANSIAL & CARA HEMAT (FINANCIAL TIPS & HACKS)
  if (
    q.includes("tips") ||
    q.includes("cara hemat") ||
    q.includes("saran hemat") ||
    q.includes("trik hemat") ||
    q.includes("nasihat") ||
    q.includes("tips keuangan") ||
    q.includes("rekomendasi hemat")
  ) {
    const sortedOutflow = [...outflowItems].sort((a, b) => b.value - a.value);
    const biggestCat = sortedOutflow[0]?.name || "kategori utama";

    return {
      text: `Boo! 💡👻 Ini 4 mantra hemat paling ampuh untuk kondisi keuanganmu saat ini, ${userName}:`,
      mood: "happy",
      dataCard: {
        type: "tips",
        title: "💡 Mantra & Tips Cerdas Berhemat",
        subtitle: "Rekomendasi taktis yang bisa langsung dipraktekkan hari ini",
        items: [
          { label: "1. Rem Pos Terbesar", value: 1, formattedValue: biggestCat, color: "#ef4444" },
          { label: "2. Aturan 24 Jam", value: 2, formattedValue: "Tunda checkout online 1 hari", color: "#f59e0b" },
          { label: "3. Pay Yourself First", value: 3, formattedValue: "Nabung 20% saat gajian tiba", color: "#10b981" },
          { label: "4. Audit Langganan", value: 4, formattedValue: "Unsubscribe OTT yang jarang ditonton", color: "#3b82f6" },
        ],
        tip: `Pos terbesarmu bulan ini adalah '${biggestCat}'. Fokus memotong 15% dari pos ini akan berdampak jauh lebih besar daripada menghemat hal-hal kecil!`,
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Apakah pembagian gajiku 50/30/20 ideal?",
        "Kondisi keuanganku sehat gak?",
      ],
    };
  }

  // CASE 36: UCAPAN TERIMA KASIH & APRESIASI (GRATITUDE & CLOSING)
  if (
    q.includes("makasih") ||
    q.includes("terima kasih") ||
    q.includes("thanks") ||
    q.includes("thank you") ||
    q.includes("keren") ||
    q.includes("mantap") ||
    q.includes("hebat") ||
    q.includes("bye") ||
    q.includes("dadah") ||
    q.includes("good job")
  ) {
    return {
      text: `Sama-sama, ${userName}! 👻💜 Senang bisa membantumu menjaga kestabilan dompet. Panggil aku lagi kapan saja lewat tab di samping kanan ini jika butuh audit catatan keuanganmu! Tetap cuan & bijak mengelola uang! 🚀✨`,
      mood: "happy",
      suggestedPrompts: [
        "Kondisi keuanganku sehat gak?",
        "Berapa total saldo rekening saya?",
        "Apa yang bisa kamu lakukan?",
      ],
    };
  }

  // =========================================================================
  // PILAR UMUM: PENGELUARAN UMUM & CAPABILITIES
  // =========================================================================

  // GENERAL EXPENSE (Jika hanya tanya "pengeluaran" secara global)
  if (
    q.includes("pengeluaran") ||
    q.includes("keluar") ||
    q.includes("belanja") ||
    q.includes("biaya") ||
    q.includes("boros") ||
    q.includes("outflow") ||
    q.includes("expense") ||
    q.includes("habis berapa")
  ) {
    const hasOutflows = outflowItems.length > 0;
    const sortedOutflow = [...outflowItems].sort((a, b) => b.value - a.value);
    const topOutflow = sortedOutflow[0];

    const items: GhostDataCardItem[] = sortedOutflow.slice(0, 5).map((item) => {
      const pct = totalOutflow > 0 ? (item.value / totalOutflow) * 100 : 0;
      return {
        label: item.name || "Pengeluaran Lainnya",
        value: item.value,
        formattedValue: formatIDR(item.value),
        percent: Math.round(pct),
        color: item.color || "#f43f5e",
      };
    });

    let mood: GhostMood = totalOutflow > totalInflow && totalInflow > 0 ? "spooky" : "idle";
    let tip =
      totalOutflow > totalInflow && totalInflow > 0
        ? "⚠️ Hati-hati! Pengeluaranmu bulan ini sudah melampaui total pemasukan. Waktunya mengerem pos sekunder!"
        : topOutflow
        ? `Pos paling dominan adalah ${topOutflow.name} (${formatIDR(topOutflow.value)}). Pantau pos ini agar tidak jebol!`
        : "Pertahankan pengeluaran agar selalu berada di bawah batas anggaran!";

    return {
      text: `Boo! 💸👻 Total pengeluaranmu pada periode ini tercatat **${formatIDR(totalOutflow)}**${
        topOutflow ? ` dengan pos terbesar pada kategori **${topOutflow.name}**` : ""
      }.`,
      mood,
      dataCard: {
        type: "expense",
        title: "💸 Rekapitulasi Pengeluaran",
        subtitle: hasOutflows ? `Terbagi ke dalam ${outflowItems.length} kategori pengeluaran` : "Belum ada riwayat pengeluaran",
        totalAmount: totalOutflow,
        formattedTotal: formatIDR(totalOutflow),
        items,
        statusBadge: {
          label: totalOutflow > totalInflow && totalInflow > 0 ? "Pengeluaran Tinggi ⚠️" : "Terkendali ✅",
          isPositive: totalOutflow <= totalInflow,
        },
        tip,
      },
      suggestedPrompts: [
        "Kategori apa yang paling boros?",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Bagaimana arus kasku (cash flow)?",
      ],
    };
  }

  // CAPABILITIES
  if (
    q.includes("apa yang bisa") ||
    q.includes("bisa apa") ||
    q.includes("kemampuan") ||
    q.includes("fitur") ||
    q.includes("bantuan") ||
    q.includes("help") ||
    q.includes("racks") ||
    q.includes("kiro") ||
    q.includes("kamu siapa") ||
    q.includes("fungsimu")
  ) {
    return {
      text: `Boo! 👻 Aku adalah **Racks**, asisten finansial pribadimu! Aku menguasai **52 analisis & mantra finansial** mendalam untuk mengawal kesehatan dompetmu:`,
      mood: "happy",
      dataCard: {
        type: "capabilities",
        title: "🔮 Mantra & Kemampuan Racks (52 Kasus)",
        subtitle: "Tanyakan hal-hal berikut atau perintahkan aku langsung:",
        items: [
          { label: "1. ⚡ Catat Transaksi Cepat", value: "Catat makan siang 35rb dari BCA", formattedValue: "1-Click Simpan", color: "#10b981" },
          { label: "2. 🔍 Cari Riwayat Merchant", value: "Cari transaksi Indomaret / Gojek", formattedValue: "Search Pintar", color: "#3b82f6" },
          { label: "3. 💳 Audit Rekening & Saldo", value: "Saldo BCA berapa? / Cek semua saldo", formattedValue: "Cek Akun", color: "#06b6d4" },
          { label: "4. 🛍️ Simulasi Daya Beli", value: "Boleh beli laptop 10jt gak?", formattedValue: "Affordability", color: "#f59e0b" },
          { label: "5. 🏛️ Audit Pajak (Coretax)", value: "Cek transaksi deductible pajak SPT", formattedValue: "Coretax DJP", color: "#8b5cf6" },
          { label: "6. 📊 Rasio Menabung (Saving Rate)", value: "Berapa persen gajiku ditabung?", formattedValue: "Saving Rate", color: "#10b981" },
          { label: "7. 🏖️ Kalkulator Pensiun (FIRE)", value: "Kapan saya bisa pensiun dini?", formattedValue: "4% FIRE Rule", color: "#8b5cf6" },
          { label: "8. 📺 Langganan Zombie & SaaS", value: "Cek langganan zombie yang jarang kepake", formattedValue: "Audit Recurring", color: "#a855f7" },
          { label: "9. 🛵 Ongkir & Food Delivery", value: "Berapa habis buat ongkir & GoFood?", formattedValue: "Markup Delivery", color: "#f97316" },
          { label: "10. 💎 Transaksi Termahal", value: "Transaksi termahal bulan ini apa?", formattedValue: "Puncak Belanja", color: "#ef4444" },
          { label: "11. 🎁 Alokasi Bonus / THR", value: "Dapat THR 10jt enaknya diapain?", formattedValue: "Formula 40-30-20-10", color: "#06b6d4" },
          { label: "12. 🪄 Simulasi Pemangkasan Kas", value: "Kalau hemat 500rb sebulan jadi berapa?", formattedValue: "Compound Growth", color: "#10b981" },
          { label: "13. 🛡️ Strategi Lunasi Utang", value: "Strategi lunasi cicilan (Snowball vs Avalanche)", formattedValue: "Bebas Utang", color: "#ef4444" },
          { label: "14. 📈 Inflasi Gaya Hidup", value: "Apakah gaya hidupku naik dibanding bulan lalu?", formattedValue: "Lifestyle Creep", color: "#ec4899" },
          { label: "15. 🏦 Bantalan Kas Likuid", value: "Apakah uang kasku aman? (Cash buffer)", formattedValue: "Likuiditas Kas", color: "#10b981" },
          { label: "16. ⚖️ Weekend vs Weekday", value: "Boros pas weekend atau hari kerja?", formattedValue: "Pola Mingguan", color: "#ec4899" },
          { label: "17. Skor Kesehatan Finansial", value: "Kondisi keuanganku sehat gak?", formattedValue: "Checkup dompet", color: "#10b981" },
          { label: "18. Dana Darurat & Runway", value: "Berapa bulan dana daruratku bertahan?", formattedValue: "Ketahanan hidup", color: "#3b82f6" },
          { label: "19. Proyeksi Akhir Bulan", value: "Berapa proyeksi belanja akhir bulan?", formattedValue: "Prediksi defisit", color: "#a855f7" },
          { label: "20. Burn Rate Harian", value: "Berapa rata-rata pengeluaranku sehari?", formattedValue: "Laju belanja", color: "#f59e0b" },
          { label: "21. Bocor Halus (Latte Factor)", value: "Pengeluaran receh apa yang numpuk?", formattedValue: "Audit belanja kecil", color: "#f59e0b" },
          { label: "22. Rasio Budget 50/30/20", value: "Apakah pembagian gajiku 50/30/20 ideal?", formattedValue: "Evaluasi piramida", color: "#3b82f6" },
          { label: "23. Simulasi Target & Impian", value: "Kapan saya bisa beli motor 20 juta?", formattedValue: "Target nabung", color: "#a855f7" },
          { label: "24. Deteksi Transaksi Duplikat", value: "Ada transaksi mencurigakan / ganda?", formattedValue: "Sensor anomali", color: "#ef4444" },
          { label: "25. Hari Paling Boros", value: "Kapan / hari apa saya paling boros?", formattedValue: "Pola belanja", color: "#ec4899" },
          { label: "26. Pengeluaran Hari Ini & Kemarin", value: "Hari ini / kemarin habis berapa?", formattedValue: "Audit harian", color: "#10b981" },
          { label: "27. Kopi & Kafein", value: "Berapa pengeluaran kopi bulan ini?", formattedValue: "Audit kafe", color: "#f59e0b" },
          { label: "28. Makanan & Kuliner", value: "Berapa belanja makan di luar / GoFood?", formattedValue: "Resto / delivery", color: "#f97316" },
          { label: "29. Belanja Online & E-Commerce", value: "Berapa belanja Shopee / Tokped?", formattedValue: "Keranjang belanja", color: "#ec4899" },
          { label: "30. Biaya Admin Bank", value: "Berapa biaya admin bank & transfer?", formattedValue: "Fee layanan", color: "#f59e0b" },
        ],
        tip: "Ketik perintahmu dalam bahasa sehari-hari atau klik tombol prompt di bawah!",
      },
      suggestedPrompts: [
        "Berapa rasio tabunganku?",
        "Kapan saya bisa pensiun?",
        "Cek langganan zombie",
        "Kalau hemat 500rb sebulan jadi berapa?",
      ],
    };
  }

  // GREETING
  if (
    q.includes("halo") ||
    q.includes("hai") ||
    q.includes("hey") ||
    q.includes("pagi") ||
    q.includes("siang") ||
    q.includes("malam") ||
    q.includes("assalamu") ||
    q.includes("tes") ||
    q.includes("test")
  ) {
    return {
      text: `Boo! Salam dari dimensi finansial, ${userName}! 👻✨ Ada yang perlu kuinspeksi hari ini? Kamu bisa mencatat transaksi baru secara instan, cari riwayat belanja merchant, cek saldo rekening, atau simulasi beli barang!`,
      mood: "happy",
      suggestedPrompts: [
        "Catat makan siang 35rb dari BCA",
        "Cari transaksi Indomaret",
        "Berapa pengeluaran kopi saya bulan ini?",
        "Apa yang bisa kamu lakukan?",
      ],
    };
  }

  // FALLBACK
  return {
    text: `Hmm, mataku yang menyala sedang mencoba membaca maksudmu... 👻 Pertanyaanmu menarik! Kamu bisa tanyakan tentang **kopi**, **makan di luar**, **belanja online**, **bensin**, **tagihan**, **pos paling boros**, atau ketik *"apa yang bisa kamu lakukan"* untuk melihat seluruh kemampuanku.`,
    mood: "thinking",
    suggestedPrompts: [
      "Berapa pengeluaran kopi saya bulan ini?",
      "Berapa pengeluaran makan di luar?",
      "Kategori apa yang paling boros?",
      "Apa yang bisa kamu lakukan?",
    ],
  };
}
