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
  | "investment";

export interface GhostDataCardItem {
  label: string;
  value: number | string;
  formattedValue?: string;
  percent?: number;
  color?: string;
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
  let isAllTime = false;

  if (q.includes("bulan lalu") || q.includes("last month") || q.includes("kemarin bulan")) {
    isLastMonth = true;
    isMonth = false;
    const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
    rangeLabel = `Bulan Lalu (${MONTH_NAMES_ID[targetMonth]} ${targetYear})`;
  } else if (q.includes("hari ini") || q.includes("today")) {
    isToday = true;
    isMonth = false;
    rangeLabel = "Hari Ini";
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
    if (isToday) {
      return (
        d.getFullYear() === currentYear &&
        d.getMonth() === currentMonth &&
        d.getDate() === now.getDate()
      );
    }
    return true;
  };

  return {
    rangeLabel,
    isMonth,
    isLastMonth,
    isToday,
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

/**
 * Core engine answering 15 financial cases with Kiro Ghost persona.
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
    q.includes("kiro") ||
    q.includes("kamu siapa") ||
    q.includes("fungsimu")
  ) {
    return {
      text: `Boo! 👻 Aku adalah **Kiro Ghost**, roh asisten finansial pribadimu! Aku bisa melacak berbagai pos pengeluaran spesifik dan mengaudit kesehatan dompetmu:`,
      mood: "happy",
      dataCard: {
        type: "capabilities",
        title: "🔮 Mantra & Kemampuan Kiro Ghost (15 Kasus)",
        subtitle: "Tanyakan hal-hal berikut kapan saja kepadaku:",
        items: [
          { label: "1. Jajan Kopi & Kafe", value: "Berapa pengeluaran kopi bulan ini?", formattedValue: "Audit kafein", color: "#f59e0b" },
          { label: "2. Kuliner & Pesan Antar", value: "Berapa pengeluaran makan di luar?", formattedValue: "GoFood / resto", color: "#f97316" },
          { label: "3. Belanja Online", value: "Berapa belanja Shopee / Tokped?", formattedValue: "Keranjang belanja", color: "#ec4899" },
          { label: "4. Transportasi & BBM", value: "Berapa ongkos bensin dan transport?", formattedValue: "BBM / ojol / tol", color: "#6366f1" },
          { label: "5. Tagihan Rutin", value: "Berapa tagihan listrik & wifi?", formattedValue: "PLN / PDAM / wifi", color: "#06b6d4" },
          { label: "6. Langganan Digital", value: "Berapa biaya langganan Netflix/Spotify?", formattedValue: "Langganan aktif", color: "#a855f7" },
          { label: "7. Cicilan & Paylater", value: "Berapa cicilan atau paylater saya?", formattedValue: "Kewajiban utang", color: "#ef4444" },
          { label: "8. Pos Paling Boros", value: "Kategori apa yang paling boros?", formattedValue: "Audit penguras saldo", color: "#e11d48" },
          { label: "9. Transaksi Terbesar", value: "Transaksi terbesar bulan ini apa?", formattedValue: "Pengeluaran puncak", color: "#fb7185" },
          { label: "10. Arus Kas & Saldo", value: "Arus kasku surplus atau defisit?", formattedValue: "Cek saldo rekening", color: "#38bdf8" },
        ],
        tip: "Ketik pertanyaanmu langsung atau klik salah satu tombol prompt di bawah!",
      },
      suggestedPrompts: [
        "Berapa pengeluaran kopi saya bulan ini?",
        "Berapa pengeluaran makan di luar?",
        "Kategori apa yang paling boros?",
        "Arus kasku surplus atau defisit?",
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
      text: `Boo! Salam dari dimensi finansial, ${userName}! 👻✨ Ada yang perlu kuinspeksi hari ini? Kamu bisa tanya jajan kopi, makan di luar, belanja online, tagihan, atau cek saldo rekeningmu!`,
      mood: "happy",
      suggestedPrompts: [
        "Berapa pengeluaran kopi saya bulan ini?",
        "Berapa pengeluaran makan di luar?",
        "Kategori apa yang paling boros?",
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
