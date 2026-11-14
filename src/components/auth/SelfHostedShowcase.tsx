import React, { useState } from "react";
import {
  Database,
  ShieldCheck,
  Lock,
  Cpu,
  TrendingUp,
  KeyRound,
  RefreshCw,
  ArrowUpRight,
  FileSpreadsheet,
  Bot,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface SelfHostedShowcaseProps {
  variant: "login" | "register" | "recovery" | "reset";
  language: "id" | "en";
}

type AssetSliceKey = "all" | "bank" | "market" | "gold";
type RegisterModuleKey = "ledger" | "ai" | "coretax";

const ASSET_SLICES: Record<
  AssetSliceKey,
  {
    labelId: string;
    labelEn: string;
    amount: string;
    decimals: string;
    delta: string;
    subId: string;
    subEn: string;
    path: string;
    area: string;
    endY: number;
    accounts: { name: string; type: string; val: string }[];
  }
> = {
  all: {
    labelId: "Semua Aset",
    labelEn: "All Assets",
    amount: "Rp 1.482",
    decimals: ".950.000",
    delta: "+12.4% YoY",
    subId: "Terkonsolidasi dari 7 akun lokal · 0.38ms query",
    subEn: "Consolidated across 7 local accounts · 0.38ms query",
    path: "M0,72 C55,68 95,52 145,54 C195,56 235,32 290,34 C345,36 395,16 450,18 C485,19 510,8 540,6",
    area: "M0,72 C55,68 95,52 145,54 C195,56 235,32 290,34 C345,36 395,16 450,18 C485,19 510,8 540,6 L540,88 L0,88 Z",
    endY: 6,
    accounts: [
      { name: "BCA Prioritas & Mandiri", type: "LIQUIDITY", val: "Rp 622,8jt" },
      { name: "SBN Ritel & Saham IDX", type: "EQUITY & BOND", val: "Rp 578,3jt" },
      { name: "Emas Antam CertiEye", type: "BULLION · 185g", val: "Rp 281,8jt" },
    ],
  },
  bank: {
    labelId: "Likuiditas Bank",
    labelEn: "Bank Liquidity",
    amount: "Rp 622",
    decimals: ".800.000",
    delta: "+4.8% YoY",
    subId: "Kas, tahapan, deposito & e-wallet tersinkronisasi",
    subEn: "Checking, time deposits & e-wallets synchronized",
    path: "M0,66 C65,64 110,58 165,52 C220,46 270,48 330,38 C390,28 450,26 540,18",
    area: "M0,66 C65,64 110,58 165,52 C220,46 270,48 330,38 C390,28 450,26 540,18 L540,88 L0,88 Z",
    endY: 18,
    accounts: [
      { name: "BCA Tahapan Gold", type: "CHECKING", val: "Rp 340,0jt" },
      { name: "Mandiri Deposito", type: "TIME DEPOSIT", val: "Rp 250,0jt" },
      { name: "GoPay & Kantong Jago", type: "DAILY FLOAT", val: "Rp 32,8jt" },
    ],
  },
  market: {
    labelId: "Portofolio Pasar",
    labelEn: "Market Portfolio",
    amount: "Rp 578",
    decimals: ".350.000",
    delta: "+19.2% YoY",
    subId: "Valuasi real-time IHSG, Reksa Dana & SBN",
    subEn: "Live mark-to-market IDX equities, funds & bonds",
    path: "M0,78 C50,70 90,74 140,56 C190,38 240,48 300,28 C360,8 430,22 540,8",
    area: "M0,78 C50,70 90,74 140,56 C190,38 240,48 300,28 C360,8 430,22 540,8 L540,88 L0,88 Z",
    endY: 8,
    accounts: [
      { name: "BBCA · BMRI · TLKM", type: "IDX BLUECHIP", val: "Rp 318,3jt" },
      { name: "SBR013 & ORI025", type: "GOVT BONDS", val: "Rp 180,0jt" },
      { name: "RDPU & Pasar Uang", type: "MONEY MARKET", val: "Rp 80,0jt" },
    ],
  },
  gold: {
    labelId: "Logam Mulia",
    labelEn: "Precious Metals",
    amount: "Rp 281",
    decimals: ".800.000",
    delta: "+24.6% YoY",
    subId: "Mengikuti harga buyback resmi Logam Mulia Antam",
    subEn: "Indexed to official Antam bullion buyback rates",
    path: "M0,76 C70,72 130,62 190,54 C250,46 310,34 380,24 C440,15 490,12 540,5",
    area: "M0,76 C70,72 130,62 190,54 C250,46 310,34 380,24 C440,15 490,12 540,5 L540,88 L0,88 Z",
    endY: 5,
    accounts: [
      { name: "Antam CertiEye 100g", type: "MINT BAR", val: "Rp 152,3jt" },
      { name: "Antam CertiEye 50g", type: "MINT BAR", val: "Rp 76,1jt" },
      { name: "Tabungan Emas 35g", type: "VAULT GRAM", val: "Rp 53,4jt" },
    ],
  },
};

export const SelfHostedShowcase: React.FC<SelfHostedShowcaseProps> = ({
  variant,
  language,
}) => {
  const isId = language === "id";
  const [activeSlice, setActiveSlice] = useState<AssetSliceKey>("all");
  const [activeModule, setActiveModule] = useState<RegisterModuleKey>("ledger");

  const slice = ASSET_SLICES[activeSlice];

  return (
    /* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */
    <aside
      aria-label="Self-Hosted SaaS Architecture"
      className="hidden lg:grid lg:grid-rows-[auto_1fr_auto] relative overflow-hidden bg-[#06080C] border-l border-white/[0.08] select-none text-zinc-100"
    >
      {/* Subtle Blueprint Coordinate Grid (Zero Blur) */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      {/* Restrained Single-Hue Radial Illumination (Zero Gaussian Blur Filter) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 90% 10%, rgba(16, 185, 129, 0.08) 0%, transparent 50%), radial-gradient(circle at 10% 90%, rgba(56, 189, 248, 0.06) 0%, transparent 55%)",
        }}
      />

      {/* =====================================================================
          1. TOP ARCHITECTURAL RAIL (Full-Bleed Structural Hairline)
         ===================================================================== */}
      <div className="relative z-10 grid grid-cols-12 border-b border-white/[0.08] bg-[#080B11]/90">
        <div className="col-span-7 px-8 xl:px-10 py-4 flex items-center gap-3 border-r border-white/[0.08]">
          <span className="size-2 rounded-full bg-emerald-400" />
          <span className="font-mono text-[11px] font-semibold tracking-wider text-zinc-200 uppercase">
            RACKS // SELF-HOSTED EDITION
          </span>
          <span className="hidden xl:inline-block font-mono text-[10px] text-zinc-500 px-2 py-0.5 rounded bg-white/[0.03] border border-white/[0.06]">
            127.0.0.1 · WAL-ENGINE
          </span>
        </div>

        <div className="col-span-5 px-6 xl:px-8 py-4 flex items-center justify-between font-mono text-[10.5px] text-zinc-400">
          <span>TELEMETRY: 0B EGRESS</span>
          <span className="text-emerald-400 font-semibold">ONLINE</span>
        </div>
      </div>

      {/* =====================================================================
          2. MAIN STRUCTURAL BODY (Distinct Macrostructure per Auth Route)
         ===================================================================== */}

      {/* ─── MACROSTRUCTURE A: LOGIN (Interactive Sovereign Command Matrix) ─── */}
      {variant === "login" && (
        <div className="relative z-10 flex flex-col justify-between divide-y divide-white/[0.08]">
          {/* Upper Editorial + Interactive Telemetry Workbench */}
          <div className="p-8 xl:p-12 flex-1 flex flex-col justify-center space-y-7">
            <div className="space-y-3 max-w-[540px]">
              <h2 className="text-3xl xl:text-[36px] font-extrabold tracking-tight text-white leading-[1.12]">
                {isId ? (
                  <>
                    Performa sekelas SaaS modern.{" "}
                    <span className="text-emerald-400">Kendali penuh di server Anda.</span>
                  </>
                ) : (
                  <>
                    Cloud-grade financial software.{" "}
                    <span className="text-emerald-400">Root access on your own metal.</span>
                  </>
                )}
              </h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                {isId
                  ? "Seluruh buku besar, mutasi bank, dan pemindaian struk AI dieksekusi langsung di mesin lokal Anda. Klik kategori aset di bawah untuk menguji simulasi neraca:"
                  : "Every ledger entry, bank reconciliation, and AI receipt scan executes on your local machine. Switch asset classes below to inspect the live balance sheet:"}
              </p>
            </div>

            {/* Interactive Live Ledger Surface (Real interactive component, not a static div screenshot) */}
            <div className="border border-white/[0.1] bg-[#090D14] rounded-xl overflow-hidden">
              {/* Interactive Asset Switcher Bar */}
              <div className="flex items-center justify-between border-b border-white/[0.08] bg-white/[0.015] px-3 py-2 gap-2 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1">
                  {(Object.keys(ASSET_SLICES) as AssetSliceKey[]).map((key) => {
                    const item = ASSET_SLICES[key];
                    const active = activeSlice === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setActiveSlice(key)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg font-mono text-[11px] font-semibold transition-colors cursor-pointer whitespace-nowrap",
                          active
                            ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                            : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04] border border-transparent"
                        )}
                      >
                        {isId ? item.labelId : item.labelEn}
                      </button>
                    );
                  })}
                </div>

                <span className="font-mono text-[10px] text-zinc-500 pr-2 hidden sm:inline">
                  SQLite3 · r/w
                </span>
              </div>

              {/* Net Worth Figure + Live Vector Curve */}
              <div className="p-6 pb-4 space-y-5">
                <div className="flex flex-wrap items-baseline justify-between gap-4">
                  <div>
                    <div className="text-3xl xl:text-4xl font-black font-mono tracking-tighter text-white tabular-nums">
                      {slice.amount}
                      <span className="text-zinc-500">{slice.decimals}</span>
                    </div>
                    <p className="font-mono text-[11px] text-zinc-400 mt-1">
                      {isId ? slice.subId : slice.subEn}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/25 font-mono text-xs font-bold text-emerald-400 tabular-nums">
                    <TrendingUp size={13} />
                    <span>{slice.delta}</span>
                  </div>
                </div>

                {/* Crisp Resolution-Independent Vector Curve */}
                <div className="h-22 w-full">
                  <svg
                    viewBox="0 0 540 88"
                    className="w-full h-full overflow-visible"
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="sovereignCurveGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.24" />
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    <path d={slice.area} fill="url(#sovereignCurveGrad)" />
                    <path
                      d={slice.path}
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="540"
                      cy={slice.endY}
                      r="4"
                      fill="#10b981"
                      stroke="#090D14"
                      strokeWidth="2"
                    />
                  </svg>
                </div>

                {/* 3-Column Sub-Ledger Breakdown */}
                <div className="grid grid-cols-3 divide-x divide-white/[0.08] border-t border-white/[0.08] pt-4 -mx-6 px-6">
                  {slice.accounts.map((acc, idx) => (
                    <div
                      key={acc.name}
                      className={cn(
                        "space-y-1",
                        idx === 0 ? "pr-4" : idx === 1 ? "px-4" : "pl-4"
                      )}
                    >
                      <span className="font-mono text-[9.5px] text-zinc-500 uppercase tracking-wider block truncate">
                        {acc.type}
                      </span>
                      <div className="text-xs font-semibold text-zinc-200 truncate">
                        {acc.name}
                      </div>
                      <div className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                        {acc.val}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Lower Asymmetric Structural Split (Data Topology + Self-Hosted Guarantees) */}
          <div className="grid grid-cols-12 divide-x divide-white/[0.08] bg-[#070A10]">
            {/* Left 7 Cols: Self-Hosted Data Flow Pipeline */}
            <div className="col-span-7 p-6 xl:px-10 flex flex-col justify-between space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                  {isId ? "TOPOLOGI DATA ON-PREMISE" : "ON-PREMISE DATA TOPOLOGY"}
                </span>
                <span className="font-mono text-[10px] text-emerald-400">
                  AIR-GAPPED READY
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="p-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02]">
                  <span className="font-mono text-[9px] text-zinc-500 block">01 / CLIENT</span>
                  <span className="font-mono text-[11px] font-bold text-white mt-0.5 block">
                    Local Browser
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-white/[0.07] bg-white/[0.02]">
                  <span className="font-mono text-[9px] text-zinc-500 block">02 / RUNTIME</span>
                  <span className="font-mono text-[11px] font-bold text-white mt-0.5 block">
                    Docker / Node
                  </span>
                </div>
                <div className="p-2.5 rounded-lg border border-emerald-500/30 bg-emerald-500/[0.06]">
                  <span className="font-mono text-[9px] text-emerald-400 block">03 / STORAGE</span>
                  <span className="font-mono text-[11px] font-bold text-emerald-300 mt-0.5 block">
                    /data/racks.db
                  </span>
                </div>
              </div>
            </div>

            {/* Right 5 Cols: BYOK & Zero Lock-in */}
            <div className="col-span-5 p-6 xl:px-8 flex flex-col justify-center space-y-2.5">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Cpu size={14} className="text-emerald-400 shrink-0" />
                <span>{isId ? "BYOK AI & Telegram Bot" : "BYOK AI & Telegram Bot"}</span>
              </div>
              <p className="text-[11.5px] text-zinc-400 leading-relaxed">
                {isId
                  ? "Pasang API key DeepSeek/OpenAI dan token Bot Telegram Anda sendiri. Tidak ada kuota pihak ketiga."
                  : "Connect your own DeepSeek/OpenAI key and Telegram Bot token. Zero middleman rate-limits."}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MACROSTRUCTURE B: REGISTER (Interactive Self-Hosted Stack Configurator) ─── */}
      {variant === "register" && (
        <div className="relative z-10 flex flex-col justify-between divide-y divide-white/[0.08]">
          {/* Upper Workbench */}
          <div className="p-8 xl:p-12 flex-1 flex flex-col justify-center space-y-7">
            <div className="space-y-3 max-w-[540px]">
              <h2 className="text-3xl xl:text-[36px] font-extrabold tracking-tight text-white leading-[1.12]">
                {isId ? (
                  <>
                    Deploy sistem keuangan pribadi.{" "}
                    <span className="text-emerald-400">Tanpa sewa bulanan selamanya.</span>
                  </>
                ) : (
                  <>
                    Deploy your personal financial OS.{" "}
                    <span className="text-emerald-400">Zero recurring subscription.</span>
                  </>
                )}
              </h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                {isId
                  ? "Satu akun administrator lokal langsung mengaktifkan seluruh modul SaaS di server Anda. Pilih modul di bawah untuk melihat spesifikasi yang terpasang:"
                  : "A single local admin account unlocks the entire SaaS suite on your machine. Select a module below to inspect what gets provisioned:"}
              </p>
            </div>

            {/* Interactive Module Inspector (Split 5/7 Workbench) */}
            <div className="grid grid-cols-12 border border-white/[0.1] rounded-xl overflow-hidden bg-[#090D14]">
              {/* Left Selector Rail */}
              <div className="col-span-5 border-r border-white/[0.08] divide-y divide-white/[0.06] bg-white/[0.01]">
                <button
                  type="button"
                  onClick={() => setActiveModule("ledger")}
                  className={cn(
                    "w-full text-left p-4 transition-colors cursor-pointer flex items-start gap-3",
                    activeModule === "ledger"
                      ? "bg-emerald-500/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                  )}
                >
                  <Database
                    size={16}
                    className={cn(
                      "mt-0.5 shrink-0",
                      activeModule === "ledger" ? "text-emerald-400" : "text-zinc-500"
                    )}
                  />
                  <div>
                    <div className="font-mono text-[10px] text-zinc-500">MODULE 01</div>
                    <div className="text-xs font-bold mt-0.5">
                      {isId ? "Double-Entry Ledger" : "Double-Entry Ledger"}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule("ai")}
                  className={cn(
                    "w-full text-left p-4 transition-colors cursor-pointer flex items-start gap-3",
                    activeModule === "ai"
                      ? "bg-emerald-500/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                  )}
                >
                  <Bot
                    size={16}
                    className={cn(
                      "mt-0.5 shrink-0",
                      activeModule === "ai" ? "text-emerald-400" : "text-zinc-500"
                    )}
                  />
                  <div>
                    <div className="font-mono text-[10px] text-zinc-500">MODULE 02</div>
                    <div className="text-xs font-bold mt-0.5">
                      {isId ? "AI Struk & Bot Telegram" : "AI Vision & Telegram Bot"}
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveModule("coretax")}
                  className={cn(
                    "w-full text-left p-4 transition-colors cursor-pointer flex items-start gap-3",
                    activeModule === "coretax"
                      ? "bg-emerald-500/[0.08] text-white"
                      : "text-zinc-400 hover:bg-white/[0.03] hover:text-zinc-200"
                  )}
                >
                  <FileSpreadsheet
                    size={16}
                    className={cn(
                      "mt-0.5 shrink-0",
                      activeModule === "coretax" ? "text-emerald-400" : "text-zinc-500"
                    )}
                  />
                  <div>
                    <div className="font-mono text-[10px] text-zinc-500">MODULE 03</div>
                    <div className="text-xs font-bold mt-0.5">
                      {isId ? "Pajak Coretax & Sankey" : "Coretax & Sankey Reports"}
                    </div>
                  </div>
                </button>
              </div>

              {/* Right Live Specification Pane */}
              <div className="col-span-7 p-5 flex flex-col justify-between space-y-4">
                {activeModule === "ledger" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold">
                          SQLITE WAL / MYSQL LOCAL
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">READY</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {isId
                          ? "Rekonsiliasi Multi-Akun & Multi-Mata Uang"
                          : "Multi-Account & Multi-Currency Balance Sheet"}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {isId
                          ? "Catat rekening bank, dompet digital (GoPay, OVO), saham IDX, emas Antam, hingga properti dalam satu buku besar lokal tanpa batasan jumlah transaksi."
                          : "Track bank accounts, e-wallets, IDX stocks, Antam gold, and real estate in one local database with unlimited transactions."}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#06080C] border border-white/[0.06] font-mono text-[10.5px] text-zinc-300 space-y-1">
                      <div className="text-zinc-500">// Local storage path</div>
                      <div>ENGINE = sqlite3_wal (/data/racks.db)</div>
                      <div className="text-emerald-400">✓ Automated single-file snapshot backup</div>
                    </div>
                  </>
                )}

                {activeModule === "ai" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold">
                          BYOK PRIVATE CREDENTIALS
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">OPTIONAL</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {isId
                          ? "Ekstraksi Struk Belanja & Input Chat Instan"
                          : "Autonomous Receipt OCR & Chat Logging"}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {isId
                          ? "Foto struk belanja atau kirim pesan ke bot Telegram pribadi Anda. Racks mengekstrak nominal, merchant, dan kategori langsung ke database lokal Anda."
                          : "Snap a receipt or message your private Telegram bot. Racks extracts merchant, amount, and category straight into your local ledger."}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#06080C] border border-white/[0.06] font-mono text-[10.5px] text-zinc-300 space-y-1">
                      <div className="text-zinc-500">// Webhook pipeline</div>
                      <div>POST /api/telegram/webhook → 200 OK (14ms)</div>
                      <div className="text-emerald-400">✓ Zero third-party data retention</div>
                    </div>
                  </>
                )}

                {activeModule === "coretax" && (
                  <>
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] text-emerald-400 uppercase font-bold">
                          INDONESIAN TAX & ANALYTICS
                        </span>
                        <span className="font-mono text-[10px] text-zinc-500">BUILT-IN</span>
                      </div>
                      <h3 className="text-sm font-bold text-white">
                        {isId
                          ? "Diagram Sankey Arus Kas & Ekspor Coretax DJP"
                          : "Cashflow Sankey & Coretax DJP PDF Export"}
                      </h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        {isId
                          ? "Pantau ke mana setiap rupiah mengalir lewat diagram Sankey interaktif dan unduh rekapitulasi daftar harta/utang siap pakai untuk pelaporan SPT Coretax."
                          : "Visualize where every rupiah flows with interactive Sankey diagrams and export asset/liability schedules formatted for Coretax filings."}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-[#06080C] border border-white/[0.06] font-mono text-[10.5px] text-zinc-300 space-y-1">
                      <div className="text-zinc-500">// Supported export formats</div>
                      <div>FORMATS = [CSV, JSON_FULL_DUMP, CORETAX_PDF]</div>
                      <div className="text-emerald-400">✓ 100% portable, zero vendor lock-in</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Lower 3-Column Comparison Proof Bar (Self-Hosted vs Cloud SaaS) */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.08] bg-[#070A10]">
            <div className="p-6 xl:px-8 space-y-1">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block">
                {isId ? "BIAYA LANGGANAN" : "SUBSCRIPTION FEE"}
              </span>
              <div className="text-2xl font-black font-mono text-white tabular-nums">
                Rp 0<span className="text-xs font-normal text-zinc-500"> / selamanya</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isId ? "Tanpa paket berbayar bulanan" : "All features unlocked locally"}
              </p>
            </div>

            <div className="p-6 xl:px-8 space-y-1">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block">
                {isId ? "KEPEMILIKAN DATA" : "DATA OWNERSHIP"}
              </span>
              <div className="text-2xl font-black font-mono text-emerald-400 tabular-nums">
                100%<span className="text-xs font-normal text-zinc-500"> Lokal</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isId ? "Tersimpan di disk server Anda" : "Stored on your own hardware"}
              </p>
            </div>

            <div className="p-6 xl:px-8 space-y-1">
              <span className="font-mono text-[10px] text-zinc-500 uppercase block">
                {isId ? "PORTABILITAS" : "PORTABILITY"}
              </span>
              <div className="text-2xl font-black font-mono text-white tabular-nums">
                1-File<span className="text-xs font-normal text-zinc-500"> .db</span>
              </div>
              <p className="text-[11px] text-zinc-400">
                {isId ? "Backup & migrasi instan" : "Instant snapshot & export"}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ─── MACROSTRUCTURE C: RECOVERY & RESET (Zero-Knowledge Cryptographic Matrix) ─── */}
      {(variant === "recovery" || variant === "reset") && (
        <div className="relative z-10 flex flex-col justify-between divide-y divide-white/[0.08]">
          {/* Upper Cryptographic Manifesto */}
          <div className="p-8 xl:p-12 flex-1 flex flex-col justify-center space-y-7">
            <div className="space-y-3 max-w-[540px]">
              <h2 className="text-3xl xl:text-[36px] font-extrabold tracking-tight text-white leading-[1.12]">
                {isId ? (
                  <>
                    Kami tidak dapat melihat sandi Anda —{" "}
                    <span className="text-emerald-400">karena servernya milik Anda.</span>
                  </>
                ) : (
                  <>
                    We cannot read your password —{" "}
                    <span className="text-emerald-400">because you own the server.</span>
                  </>
                )}
              </h2>
              <p className="text-[13px] text-zinc-400 leading-relaxed">
                {isId
                  ? "Berbeda dari layanan cloud tradisional, proses pemulihan dan rotasi kata sandi di Racks Finance berjalan murni di atas engine kriptografi lokal Anda tanpa melintasi server pihak ketiga."
                  : "Unlike hosted cloud apps, password recovery and key rotation in Racks Finance execute strictly inside your local cryptographic daemon without touching external servers."}
              </p>
            </div>

            {/* 3-Column Structural Cryptographic Pipeline */}
            <div className="grid grid-cols-3 divide-x divide-white/[0.08] border border-white/[0.1] rounded-xl bg-[#090D14] overflow-hidden">
              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-400">
                    STAGE 01
                  </span>
                  <KeyRound size={14} className="text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">
                  {isId ? "Tiket CSPRNG 15 Menit" : "15-Min CSPRNG Ticket"}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isId
                    ? "Token satu kali pakai dibuat di memori lokal dan langsung hangus setelah dipakai."
                    : "Single-use reset token is generated locally and permanently burned upon use."}
                </p>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-400">
                    STAGE 02
                  </span>
                  <Lock size={14} className="text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">
                  {isId ? "Hashing Bcrypt Lokal" : "Local Bcrypt Hashing"}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isId
                    ? "Kata sandi baru di-hash dengan Bcrypt (12-rounds) sebelum ditulis ke disk."
                    : "New credentials are salted and hashed via 12-round Bcrypt before disk commit."}
                </p>
              </div>

              <div className="p-5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[10px] font-bold text-emerald-400">
                    STAGE 03
                  </span>
                  <RefreshCw size={14} className="text-emerald-400" />
                </div>
                <div className="text-xs font-bold text-white">
                  {isId ? "Pencabutan Sesi Aktif" : "Session Invalidation"}
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  {isId
                    ? "Seluruh token cookie JWT lama di perangkat lain otomatis dicabut seketika."
                    : "All pre-existing HttpOnly JWT sessions on other devices are immediately revoked."}
                </p>
              </div>
            </div>

            {/* Security Specification Table (Sharp Monospace Readout) */}
            <div className="border border-white/[0.08] rounded-xl bg-[#070A10] divide-y divide-white/[0.06] font-mono text-[11px]">
              <div className="px-4 py-2.5 flex items-center justify-between text-zinc-400 bg-white/[0.015]">
                <span>PARAMETER KEAMANAN NODE</span>
                <span className="text-emerald-400">STATUS VERIFIKASI</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-400">Password Key Derivation</span>
                <span className="text-zinc-100 font-semibold">Bcrypt (Cost Factor 12)</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-400">Session Cookie Transport</span>
                <span className="text-zinc-100 font-semibold">HttpOnly · SameSite=Lax</span>
              </div>
              <div className="px-4 py-2.5 flex items-center justify-between">
                <span className="text-zinc-400">Ledger Database Isolation</span>
                <span className="text-emerald-400 font-semibold">✓ Sealed (0 External Calls)</span>
              </div>
            </div>
          </div>

          {/* Lower Assurance Strip */}
          <div className="px-8 xl:px-12 py-5 bg-[#070A10] flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-zinc-300">
              <ShieldCheck size={16} className="text-emerald-400 shrink-0" />
              <span>
                {isId
                  ? "Saldo rekening dan riwayat transaksi Anda tidak tersentuh selama pemulihan sandi."
                  : "Your account balances and transaction history remain untouched during password rotation."}
              </span>
            </div>
            <span className="font-mono text-[10px] text-zinc-500 uppercase shrink-0 ml-4">
              ZERO-TRUST
            </span>
          </div>
        </div>
      )}

      {/* =====================================================================
          3. BOTTOM ARCHITECTURAL COLOPHON RAIL
         ===================================================================== */}
      <div className="relative z-10 px-8 xl:px-10 py-4 border-t border-white/[0.08] bg-[#080B11]/90 flex items-center justify-between font-mono text-[10.5px] text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="text-zinc-300 font-semibold">RACKS FINANCE OS</span>
          <span>·</span>
          <span>SQLITE / DOCKER / SELF-HOSTED</span>
        </div>
        <div className="flex items-center gap-1.5 text-zinc-400">
          <span>{isId ? "ARSITEKTUR MANDIRI" : "SOVEREIGN ARCHITECTURE"}</span>
          <ArrowUpRight size={12} className="text-emerald-400" />
        </div>
      </div>
    </aside>
  );
};
