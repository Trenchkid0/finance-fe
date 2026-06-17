import { RegisterForm } from "@/components/auth/RegisterForm";
import { TrendingUp, Wallet, PiggyBank, BarChart3, Shield, Zap } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Register() {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[2fr_3fr] overflow-hidden bg-canvas font-sans">
      {/* ═══════════════════════════════════════════════════════════════
          LEFT COLUMN — 40% — Form
      ═══════════════════════════════════════════════════════════════ */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20 z-10">
        {/* Language selector floating top right */}
        <div className="absolute top-5 right-5 z-20">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-white/[0.04] transition-all bg-elevated border border-border"
              >
                <span>{language === "id" ? "Bahasa Indonesia" : "English (US)"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl">
              <DropdownMenuItem
                className="text-xs font-semibold cursor-pointer"
                onSelect={() => setLanguage("id")}
              >
                Bahasa Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-xs font-semibold cursor-pointer"
                onSelect={() => setLanguage("en")}
              >
                English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Subtle ambient glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-500/[0.03] rounded-full blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[360px] space-y-10 animate-fade-in-up">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span
                className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-blue-500 to-indigo-600 text-white font-black text-lg shadow-[0_4px_20px_rgba(56,139,253,0.4)]"
                aria-hidden
              >
                R
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-income border-2 border-canvas" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Racks Finance
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-foreground">
              {language === "id" ? (
                <>
                  Buat akun<br />
                  <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">Anda sekarang.</span>
                </>
              ) : (
                <>
                  Create<br />
                  <span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">your account.</span>
                </>
              )}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px]">
              {language === "id"
                ? "Mulailah mengelola aset, melacak pengeluaran, dan merencanakan masa depan finansial Anda."
                : "Start managing assets, tracking expenses, and planning your financial future."}
            </p>
          </div>

          {/* Form — no card wrapper */}
          <RegisterForm />

          {/* Trust badges */}
          <div className="flex items-center gap-5 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Shield size={12} className="text-income/60" />
              <span>{language === "id" ? "Terenkripsi" : "Encrypted"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Zap size={12} className="text-warning/60" />
              <span>{language === "id" ? "Sinkronisasi real-time" : "Real-time sync"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════
          RIGHT COLUMN — 60% — Visual Showcase
      ═══════════════════════════════════════════════════════════════ */}
      <div className="hidden lg:flex relative flex-col overflow-hidden bg-gradient-to-br from-sidebar via-canvas to-elevated border-l border-border/40">
        {/* Animated ambient glow blobs */}
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-accent/[0.08] rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '7s' }} />
        <div className="absolute bottom-[5%] left-[15%] w-[450px] h-[450px] bg-progress/[0.06] rounded-full blur-[130px] animate-pulse" style={{ animationDuration: '11s' }} />
        <div className="absolute top-[50%] left-[50%] -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-warning/[0.04] rounded-full blur-[100px]" />

        {/* Grid dots pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--border) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-10 xl:p-14">
          {/* Top status bar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex size-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-income opacity-75" />
                <span className="relative inline-flex size-2 rounded-full bg-income" />
              </span>
              <span className="text-[11px] font-semibold tracking-wider text-text-muted uppercase">Sistem aktif</span>
            </div>
            <div className="text-[11px] text-text-muted/40 font-mono">v2.4.0</div>
          </div>

          {/* Main showcase — tilted perspective mockup */}
          <div className="flex-1 flex items-center justify-center py-10">
            <div className="w-full max-w-lg space-y-5" style={{ perspective: '1200px' }}>
              {/* Hero net worth card */}
              <div
                className="rounded-2xl border border-border bg-surface/30 backdrop-blur-xl p-7 shadow-2xl shadow-black/10"
                style={{ transform: 'rotateY(-2deg) rotateX(1deg)' }}
              >
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-1">
                    <p className="text-[11px] font-semibold uppercase tracking-widest text-text-muted">Total Kekayaan Bersih</p>
                    <div className="text-4xl font-black font-mono tracking-tight text-text-primary">
                      Rp 1.482<span className="text-text-primary/45">.950.000</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs font-bold text-income bg-income/10 px-3 py-1.5 rounded-full border border-income/20">
                    <TrendingUp size={13} />
                    +12.4%
                  </div>
                </div>

                {/* Chart area */}
                <div className="h-28 w-full">
                  <svg viewBox="0 0 200 60" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="registerChartFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,50 C20,45 35,30 50,35 S70,15 90,20 S120,5 140,10 S170,3 200,2 L200,60 L0,60 Z"
                      fill="url(#registerChartFill)"
                    />
                    <path
                      d="M0,50 C20,45 35,30 50,35 S70,15 90,20 S120,5 140,10 S170,3 200,2"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* Glowing endpoint */}
                    <circle cx="200" cy="2" r="4" fill="var(--accent)" opacity="0.3">
                      <animate attributeName="r" values="4;8;4" dur="2s" repeatCount="indefinite" />
                      <animate attributeName="opacity" values="0.3;0.1;0.3" dur="2s" repeatCount="indefinite" />
                    </circle>
                    <circle cx="200" cy="2" r="3" fill="var(--accent)" />
                  </svg>
                </div>

                {/* Time range pills */}
                <div className="flex gap-1.5 mt-4">
                  {["1H", "1M", "3B", "1T", "YTD", "ALL"].map((label, i) => (
                    <span
                      key={label}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-full transition-all ${i === 3
                          ? "bg-accent/15 text-accent border border-accent/30"
                          : "text-text-muted hover:text-text-primary hover:bg-hover-surface"
                        }`}
                    >
                      {label}
                    </span>
                  ))}
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-3">
                <div
                  className="rounded-xl border border-border bg-surface/30 backdrop-blur-md p-4"
                  style={{ transform: 'rotateY(-2deg)' }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-income/10 text-income">
                      <Wallet size={14} />
                    </div>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Pemasukan</span>
                  </div>
                  <p className="text-lg font-black font-mono text-income">+12.5<span className="text-sm text-income/60">jt</span></p>
                </div>

                <div
                  className="rounded-xl border border-border bg-surface/30 backdrop-blur-md p-4"
                  style={{ transform: 'rotateY(-2deg)' }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-accent/10 text-accent">
                      <PiggyBank size={14} />
                    </div>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Tabungan</span>
                  </div>
                  <p className="text-lg font-black font-mono text-text-primary">480<span className="text-sm text-text-primary/45">jt</span></p>
                </div>

                <div
                  className="rounded-xl border border-border bg-surface/30 backdrop-blur-md p-4"
                  style={{ transform: 'rotateY(-2deg)' }}
                >
                  <div className="flex items-center gap-2 mb-2.5">
                    <div className="flex size-7 items-center justify-center rounded-lg bg-indigo-500/10" style={{ color: 'var(--progress)' }}>
                      <BarChart3 size={14} />
                    </div>
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">Investasi</span>
                  </div>
                  <p className="text-lg font-black font-mono text-text-primary">534<span className="text-sm text-text-primary/45">jt</span></p>
                </div>
              </div>

              {/* Portfolio bar */}
              <div
                className="rounded-xl border border-border bg-surface/30 backdrop-blur-md p-5"
                style={{ transform: 'rotateY(-2deg)' }}
              >
                <div className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-3">Alokasi Portofolio</div>
                <div className="flex h-2.5 rounded-full overflow-hidden gap-0.5">
                  <div className="rounded-l-full" style={{ width: '54%', backgroundColor: 'var(--accent)' }} />
                  <div style={{ width: '36%', backgroundColor: 'var(--progress)' }} />
                  <div className="rounded-r-full" style={{ width: '10%', backgroundColor: 'var(--income)' }} />
                </div>
                <div className="flex justify-between mt-3 text-[11px]">
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--accent)' }} />
                    <span className="text-text-muted">Bank <span className="text-text-primary font-semibold ml-0.5">54%</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--progress)' }} />
                    <span className="text-text-muted">Saham <span className="text-text-primary font-semibold ml-0.5">36%</span></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="size-1.5 rounded-full" style={{ backgroundColor: 'var(--income)' }} />
                    <span className="text-text-muted">Tunai <span className="text-text-primary font-semibold ml-0.5">10%</span></span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom tagline */}
          <div className="space-y-2 max-w-md border-t border-border/40 pt-6 mt-6">
            <p className="text-base font-bold text-text-primary leading-snug">
              {language === "id"
                ? "Satu dasbor terpadu untuk seluruh aset finansial Anda."
                : "One unified dashboard for all your financial assets."}
            </p>
            <p className="text-xs text-text-muted leading-relaxed">
              {language === "id"
                ? "Rekening bank, dompet digital, portofolio saham, properti — pantau semuanya secara real-time dalam satu tempat yang aman."
                : "Bank accounts, digital wallets, stock portfolios, real estate — track it all in real-time in one secure place."}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
