import { LoginForm } from "@/components/auth/LoginForm";
import { Shield, Zap, Database, Cpu, Layers } from "lucide-react";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Login() {
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
                <>Selamat datang<br />kembali.</>
              ) : (
                <>Welcome<br />back.</>
              )}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed max-w-[300px]">
              {isId
                ? "Masuk untuk melacak kekayaan, memantau investasi, dan mengelola kesehatan finansial Anda."
                : "Log in to track wealth, monitor investments, and manage your financial health."}
            </p>
          </div>

          <LoginForm />

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

      {/* RIGHT COLUMN — Hallmark Crafted Editorial Showcase: The Sovereign Ledger */}
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
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-accent/[0.07] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-income/[0.05] rounded-full blur-3xl pointer-events-none" />

        {/* Header Metadata Strip */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-bold tracking-widest text-accent uppercase px-2 py-0.5 rounded bg-accent/10 border border-accent/20">
              01 / ARCHITECTURE
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/80 tracking-wide uppercase">
              {isId ? "Sovereign Ledger" : "The Sovereign Ledger"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-income shadow-[0_0_8px_var(--income)]" />
            <span className="font-mono text-[11px] text-muted-foreground font-medium tracking-tight">
              LOCAL ENGINE ACTIVE
            </span>
          </div>
        </div>

        {/* Center Content: Manifesto & Ledger Matrix */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-[580px]">
          {/* Main Statement */}
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              {isId ? (
                <>Kekayaan Anda. Infrastruktur milik Anda. <span className="text-accent">Bebas pengawasan.</span></>
              ) : (
                <>Your wealth. Your infrastructure. <span className="text-accent">Zero surveillance.</span></>
              )}
            </h2>
            <p className="text-sm text-muted-foreground/90 leading-relaxed font-normal">
              {isId
                ? "Racks Finance dibangun dengan filosofi kedaulatan data. Setiap transaksi, saldo rekening, dan struk belanja tersimpan di server pribadi Anda — tanpa perantara cloud yang memonetisasi data finansial Anda."
                : "Racks Finance is engineered around data sovereignty. Every transaction, account balance, and receipt stays on your personal infrastructure — never brokered, mined, or monetized by cloud intermediaries."}
            </p>
          </div>

          {/* Architectural Pillar Cards */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {/* Card 1 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <Database size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Mesin Database Lokal Mandiri" : "Self-Hosted Local Database"}
                    </span>
                    <span className="font-mono text-[9.5px] text-accent/80 bg-accent/10 px-1.5 py-0.2 rounded font-semibold">
                      SQLite / MySQL
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Penyimpanan data lokal berkecepatan tinggi tanpa dependensi layanan eksternal. Backup instan dalam satu file."
                      : "High-speed local persistence with zero external service dependencies. Instant one-file snapshot backups."}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-income/10 border border-income/20 text-income flex items-center justify-center shrink-0 mt-0.5">
                  <Layers size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Rekonsiliasi Neraca Multi-Akun" : "Multi-Account Balance Sheet"}
                    </span>
                    <span className="font-mono text-[9.5px] text-income/80 bg-income/10 px-1.5 py-0.2 rounded font-semibold">
                      Unified Liquidity
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Integrasi menyeluruh rekening bank, dompet digital, tunai, dan portofolio investasi dalam perhitungan kekayaan bersih akurat."
                      : "Unified tracking across bank deposits, e-wallets, physical cash, and market portfolios with exact net worth math."}
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Cpu size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Pemindaian Struk AI & Telegram Bot" : "Private AI Vision & Telegram Bot"}
                    </span>
                    <span className="font-mono text-[9.5px] text-purple-400/80 bg-purple-500/10 px-1.5 py-0.2 rounded font-semibold">
                      Your Own Keys
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Ekstraksi struk otomatis (OCR) dan input transaksi via Telegram bot menggunakan API key Anda sendiri."
                      : "Autonomous receipt scanning and Telegram transaction logging using your personal bot credentials."}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Colophon */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-5 font-mono text-[10.5px] text-muted-foreground/60">
          <span>RACKS FINANCE · REVISION 2026</span>
          <span className="tracking-widest uppercase">PRIVACY BY ARCHITECTURE</span>
        </div>
      </div>
    </div>
  );
}
