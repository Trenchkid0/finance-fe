import { RegisterForm } from "@/components/auth/RegisterForm";
import { Shield, Zap } from "lucide-react";
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
  const isId = language === "id";

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[5fr_7fr] overflow-hidden bg-canvas font-sans selection:bg-accent/20">
      {/* LEFT COLUMN — Form Area */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-18 z-10">
        {/* Language selector */}
        <div className="absolute top-5 right-5 z-20">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-hover-surface transition-all bg-elevated border border-border"
              >
                <span>{isId ? "Bahasa Indonesia" : "English (US)"}</span>
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

        {/* Ambient background grid texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative mx-auto w-full max-w-[360px] space-y-10 animate-fade-in-up">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <span className="flex size-10 items-center justify-center rounded-xl bg-accent text-white font-mono font-bold text-base shadow-sm ring-1 ring-white/15" aria-hidden>
                R
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-income ring-2 ring-canvas" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">Racks Finance</span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-foreground">
              {isId ? (
                <>Buat akun<br />Anda sekarang.</>
              ) : (
                <>Create<br />your account.</>
              )}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px]">
              {isId
                ? "Mulailah mengelola aset, melacak pengeluaran, dan merencanakan masa depan finansial Anda."
                : "Start managing assets, tracking expenses, and planning your financial future."}
            </p>
          </div>

          <RegisterForm />

          {/* Trust badges */}
          <div className="flex flex-wrap items-center gap-4 pt-2">
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75">
              <Shield size={12} className="text-income" />
              <span>{isId ? "Self-hosted & terenkripsi" : "Self-hosted & encrypted"}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/75">
              <Zap size={12} className="text-accent" />
              <span>{isId ? "Zero-latency SQLite engine" : "Zero-latency SQLite engine"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN — Hallmark Crafted Editorial Showcase: The Architecture of Wealth */}
      {/* Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 */}
      <div className="hidden lg:flex relative flex-col justify-between overflow-hidden bg-[#0A0D14] border-l border-white/[0.08] p-12 xl:p-16 select-none">
        {/* Subtle geometric grid background */}
        <div
          className="absolute inset-0 opacity-[0.035] pointer-events-none"
          style={{
            backgroundImage: 'linear-gradient(to right, #ffffff 1px, transparent 1px), linear-gradient(to bottom, #ffffff 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Ambient lighting accent */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-purple-500/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* Header Metadata Strip */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-bold tracking-widest text-purple-400 uppercase px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/20">
              02 / GENESIS
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/80 tracking-wide uppercase">
              {isId ? "Struktur Pertumbuhan" : "Architecture of Wealth"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
            <span className="font-mono text-[11px] text-muted-foreground font-medium tracking-tight">
              INITIAL SETUP PROTOCOL
            </span>
          </div>
        </div>

        {/* Center Content: Three-Stage Wealth Architecture */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-[580px]">
          {/* Main Statement */}
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              {isId ? (
                <>Dari pencatatan harian menuju <span className="text-purple-400">kejelasan finansial sejati.</span></>
              ) : (
                <>From daily entries to <span className="text-purple-400">enduring financial clarity.</span></>
              )}
            </h2>
            <p className="text-sm text-muted-foreground/90 leading-relaxed font-normal">
              {isId
                ? "Daftarkan akun admin Anda untuk mengaktifkan sistem pembukuan double-entry lokal. Kelola arus kas multi-rekening, simulasikan pajak Coretax, dan pantau kekayaan dalam tiga tahap terstruktur."
                : "Initialize your admin profile to activate the local double-entry ledger. Orchestrate multi-account liquidity, prepare Coretax filings, and compound net worth across three disciplined phases."}
            </p>
          </div>

          {/* Vertical Progressive Milestones */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-px before:bg-white/[0.1]">
            {/* Step 1 */}
            <div className="relative group">
              <span className="absolute -left-6 top-1 size-5 rounded-full border border-purple-500/40 bg-purple-500/10 text-purple-400 flex items-center justify-center font-mono text-[10px] font-bold">
                1
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {isId ? "Petakan Sumber Dana & Likuiditas" : "Map Accounts & Funding Liquidity"}
                  </h3>
                  <span className="font-mono text-[9.5px] text-muted-foreground/70 uppercase">Phase 01</span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-normal">
                  {isId
                    ? "Satukan rekening bank, e-wallet (GoPay, OVO), kas tunai, dan akun investasi dalam neraca tersinkronisasi."
                    : "Consolidate checking, e-wallets, cash reserves, and brokerage accounts into a single synchronized balance sheet."}
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <span className="absolute -left-6 top-1 size-5 rounded-full border border-accent/40 bg-accent/10 text-accent flex items-center justify-center font-mono text-[10px] font-bold">
                2
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {isId ? "Otomatisasi Catatan & AI Struk" : "Automate Cashflow & AI Receipt Vision"}
                  </h3>
                  <span className="font-mono text-[9.5px] text-muted-foreground/70 uppercase">Phase 02</span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-normal">
                  {isId
                    ? "Pindai struk fisik secara instan via DeepSeek OCR atau catat pengeluaran cepat via Telegram bot saat bepergian."
                    : "Extract merchant data from receipts via DeepSeek OCR and log expenses on-the-go with your personal Telegram bot."}
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <span className="absolute -left-6 top-1 size-5 rounded-full border border-income/40 bg-income/10 text-income flex items-center justify-center font-mono text-[10px] font-bold">
                3
              </span>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-white tracking-wide">
                    {isId ? "Analisis Pertumbuhan & Kepatuhan Pajak" : "Track Net Worth & Coretax Readiness"}
                  </h3>
                  <span className="font-mono text-[9.5px] text-muted-foreground/70 uppercase">Phase 03</span>
                </div>
                <p className="text-xs text-muted-foreground/80 leading-normal">
                  {isId
                    ? "Pantau rasio tabungan bulanan, proyeksi target dana darurat, serta ekspor laporan pajak Coretax format PDF resmi."
                    : "Monitor monthly savings rate, model emergency fund targets, and export tax reports formatted for Indonesian Coretax."}
                </p>
              </div>
            </div>
          </div>

          {/* Technical Guarantee Strip */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-white/[0.08]">
            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                SECURITY
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                Bcrypt + JWT
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                DATABASE
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                Zero Cloud Lock-in
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                EXPORT
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                CSV · JSON · PDF
              </span>
            </div>
          </div>
        </div>

        {/* Footer Colophon */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-5 font-mono text-[10.5px] text-muted-foreground/60">
          <span>RACKS FINANCE · SOVEREIGN REGISTRATION</span>
          <span className="tracking-widest uppercase">ENDURING CLARITY</span>
        </div>
      </div>
    </div>
  );
}
