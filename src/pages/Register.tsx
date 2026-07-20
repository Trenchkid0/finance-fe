import { RegisterForm } from "@/components/auth/RegisterForm";
import { Shield, Zap, ArrowUpRight, LayoutDashboard, Wallet, PiggyBank, Target, Settings, FileText, ArrowDownRight } from "lucide-react";
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
      {/* LEFT COLUMN — 40% — Form */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-20 z-10">
        {/* Language selector */}
        <div className="absolute top-5 right-5 z-20">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-hover-surface transition-all bg-elevated border border-border"
              >
                <span>{language === "id" ? "Bahasa Indonesia" : "English (US)"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border border-border bg-popover backdrop-blur-xl shadow-lg shadow-black/10 dark:shadow-black/45">
              <DropdownMenuItem className="text-xs font-semibold cursor-pointer" onSelect={() => setLanguage("id")}>
                Bahasa Indonesia
              </DropdownMenuItem>
              <DropdownMenuItem className="text-xs font-semibold cursor-pointer" onSelect={() => setLanguage("en")}>
                English (US)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Ambient glow */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-[400px] h-[400px] bg-accent/[0.04] rounded-full blur-[100px]" />
          <div className="absolute bottom-0 right-0 w-[300px] h-[300px] bg-indigo-500/[0.03] rounded-full blur-[80px]" />
        </div>

        <div className="relative mx-auto w-full max-w-[360px] space-y-10 animate-fade-in-up">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-10 items-center justify-center rounded-2xl bg-gradient-to-br from-accent via-blue-500 to-indigo-600 text-white font-black text-lg shadow-[0_4px_20px_rgba(56,139,253,0.4)]" aria-hidden>
                R
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full bg-income border-2 border-canvas" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Racks Finance</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-foreground">
              {language === "id" ? (
                <>Buat akun<br /><span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">Anda sekarang.</span></>
              ) : (
                <>Create<br /><span className="bg-gradient-to-r from-accent to-indigo-400 bg-clip-text text-transparent">your account.</span></>
              )}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px]">
              {language === "id"
                ? "Mulailah mengelola aset, melacak pengeluaran, dan merencanakan masa depan finansial Anda."
                : "Start managing assets, tracking expenses, and planning your financial future."}
            </p>
          </div>

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

      <div className="hidden lg:flex relative flex-col items-center justify-center overflow-hidden bg-[#07090e] border-l border-border/40 font-sans p-10 xl:p-16">
        {/* 1. Subtle horizontal and vertical grid lines */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, var(--text-muted) 1px, transparent 1px), linear-gradient(to bottom, var(--text-muted) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
        
        {/* 2. Overlaid dot-grid pattern for texture */}
        <div
          className="absolute inset-0 opacity-[0.05] pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--text-muted) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* 3. Deep colorful ambient aura glows */}
        <div className="absolute top-12 left-12 w-[350px] h-[350px] bg-income/[0.04] rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-12 right-12 w-[400px] h-[400px] bg-indigo-500/[0.04] rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[580px] h-[580px] bg-accent/[0.07] rounded-full blur-[140px] pointer-events-none" />

        {/* 4. Tech decorative corner crosshairs */}
        <div className="absolute top-8 left-8 size-4 border-t border-l border-border/20 pointer-events-none" />
        <div className="absolute top-8 right-8 size-4 border-t border-r border-border/20 pointer-events-none" />
        <div className="absolute bottom-8 left-8 size-4 border-b border-l border-border/20 pointer-events-none" />
        <div className="absolute bottom-8 right-8 size-4 border-b border-r border-border/20 pointer-events-none" />

        {/* Floating SaaS Window Mockup */}
        <div className="relative z-10 w-full max-w-[620px] bg-elevated/45 backdrop-blur-lg border border-border/80 rounded-2xl shadow-[0_35px_70px_rgba(0,0,0,0.35)] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3.5 bg-surface/40 border-b border-border/40">
            <div className="flex gap-2 items-center">
              <span className="size-2.5 rounded-full bg-red-500/40" />
              <span className="size-2.5 rounded-full bg-yellow-500/40" />
              <span className="size-2.5 rounded-full bg-green-500/40" />
            </div>
            
            <div className="flex items-center gap-2 px-4 py-1 rounded-md bg-surface/60 border border-border/30 text-[10px] text-text-muted/65 font-mono w-[240px] justify-center select-none">
              <span className="size-1.5 rounded-full bg-income/80 mr-1 animate-pulse" />
              racks.finance/dashboard
            </div>

            <div className="size-6 rounded-full bg-border/40 flex items-center justify-center text-[10px] font-bold text-text-muted">
              U
            </div>
          </div>

          <div className="flex flex-row h-[420px] bg-canvas/20">
            {/* Sidebar Mockup (More filled with 6 items) */}
            <div className="w-[56px] border-r border-border/30 bg-surface/10 py-5 flex flex-col items-center gap-5">
              <div className="size-8 rounded-xl bg-accent flex items-center justify-center text-white text-[11px] font-black shadow-[0_2px_10px_rgba(56,139,253,0.3)]">
                R
              </div>
              <div className="flex flex-col gap-4 mt-3">
                <div className="size-7 rounded-lg bg-accent/15 text-accent flex items-center justify-center">
                  <LayoutDashboard size={14} />
                </div>
                <div className="size-7 rounded-lg text-text-muted/50 hover:text-text-primary flex items-center justify-center transition-colors">
                  <Wallet size={14} />
                </div>
                <div className="size-7 rounded-lg text-text-muted/50 hover:text-text-primary flex items-center justify-center transition-colors">
                  <PiggyBank size={14} />
                </div>
                <div className="size-7 rounded-lg text-text-muted/50 hover:text-text-primary flex items-center justify-center transition-colors">
                  <Target size={14} />
                </div>
                <div className="size-7 rounded-lg text-text-muted/50 hover:text-text-primary flex items-center justify-center transition-colors">
                  <FileText size={14} />
                </div>
              </div>
              <div className="mt-auto text-text-muted/30 hover:text-text-primary transition-colors">
                <Settings size={14} />
              </div>
            </div>

            {/* Main Mock Content */}
            <div className="flex-1 p-6 overflow-hidden space-y-5 flex flex-col justify-between">
              {/* Top Stats Row (3 Metrics instead of 2 to fill space) */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-surface/30 border border-border/25 space-y-1">
                  <span className="text-[9px] font-bold text-text-muted/70 uppercase tracking-wider block">
                    {language === "id" ? "Kekayaan Bersih" : "Net Worth"}
                  </span>
                  <p className="text-[13px] font-black font-mono tracking-tight text-text-primary">
                    Rp 1.482.950K
                  </p>
                  <span className="text-[8px] font-bold text-income flex items-center gap-0.5">
                    <ArrowUpRight size={8} /> +12.4%
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface/30 border border-border/25 space-y-1">
                  <span className="text-[9px] font-bold text-text-muted/70 uppercase tracking-wider block">
                    {language === "id" ? "Total Aset" : "Total Assets"}
                  </span>
                  <p className="text-[13px] font-black font-mono tracking-tight text-text-primary">
                    Rp 1.620.000K
                  </p>
                  <span className="text-[8px] font-bold text-text-muted/50">
                    {language === "id" ? "8 Rekening" : "8 Accounts"}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-surface/30 border border-border/25 space-y-1">
                  <span className="text-[9px] font-bold text-text-muted/70 uppercase tracking-wider block">
                    {language === "id" ? "Liabilitas" : "Liabilities"}
                  </span>
                  <p className="text-[13px] font-black font-mono tracking-tight text-text-muted">
                    Rp 137.050K
                  </p>
                  <span className="text-[8px] font-bold text-expense flex items-center gap-0.5">
                    <ArrowDownRight size={8} /> -2.1%
                  </span>
                </div>
              </div>

              {/* Dynamic Chart Section (Added Y-axis markings and gridlines) */}
              <div className="p-4 rounded-xl bg-surface/30 border border-border/25 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-bold text-text-muted/70 uppercase tracking-wider">
                    {language === "id" ? "Ikhtisar Investasi" : "Investment Overview"}
                  </span>
                  <span className="text-[9px] font-bold text-accent">
                    7 {language === "id" ? "Bulan Terakhir" : "Months Performance"}
                  </span>
                </div>
                
                {/* SVG Line Chart with Gridlines */}
                <div className="w-full h-[95px] relative">
                  <svg viewBox="0 0 400 100" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.20" />
                        <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Gridlines */}
                    <line x1="0" y1="20" x2="400" y2="20" stroke="var(--border)" strokeOpacity="0.15" strokeDasharray="3 3" />
                    <line x1="0" y1="50" x2="400" y2="50" stroke="var(--border)" strokeOpacity="0.15" strokeDasharray="3 3" />
                    <line x1="0" y1="80" x2="400" y2="80" stroke="var(--border)" strokeOpacity="0.15" strokeDasharray="3 3" />

                    {/* Gradient Area */}
                    <path
                      d="M0,85 C40,78 80,62 120,55 S200,32 240,26 S320,12 360,6 L400,2 L400,100 L0,100 Z"
                      fill="url(#chartGradient)"
                    />
                    {/* Main Line */}
                    <path
                      d="M0,85 C40,78 80,62 120,55 S200,32 240,26 S320,12 360,6 L400,2"
                      fill="none"
                      stroke="var(--accent)"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />
                    {/* Active Point marker */}
                    <circle cx="240" cy="26" r="4" fill="var(--accent)" stroke="var(--canvas)" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              {/* Recent Activity List (4 items instead of 2 to fill height) */}
              <div className="space-y-2">
                <span className="text-[9px] font-bold text-text-muted/70 uppercase tracking-wider block">
                  {language === "id" ? "Aktivitas Terakhir" : "Recent Activity"}
                </span>
                <div className="grid grid-cols-1 gap-1">
                  <div className="flex justify-between items-center py-1.5 border-b border-border/15">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-income" />
                      <span className="text-[11px] font-semibold text-text-primary">BCA Payroll</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-income">+Rp 15.000.000</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5 border-b border-border/15">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-indigo-500" />
                      <span className="text-[11px] font-semibold text-text-primary">Mandiri Investment</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-text-muted">−Rp 2.450.000</span>
                  </div>
                  <div className="flex justify-between items-center py-1.5">
                    <div className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-warning" />
                      <span className="text-[11px] font-semibold text-text-primary">Tokopedia Billing</span>
                    </div>
                    <span className="text-[11px] font-bold font-mono text-text-muted">−Rp 320.000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature subtitle */}
        <div className="relative z-10 mt-8 text-center max-w-[380px] space-y-2">
          <p className="text-[13.5px] font-extrabold text-text-primary tracking-tight">
            {language === "id" ? "Dasbor Finansial Pribadi Self-Hosted Anda" : "Your Self-Hosted Personal Finance Dashboard"}
          </p>
          <p className="text-[11.5px] text-text-muted leading-relaxed max-w-[340px] mx-auto">
            {language === "id"
              ? "Jaga privasi data keuangan Anda. Host di server sendiri, pantau kekayaan bersih, dan kelola aset dengan kepemilikan data penuh."
              : "Keep your financial data private. Host on your own server, track your net worth, and monitor assets with full data ownership."}
          </p>
        </div>
      </div>
    </div>
  );
}
