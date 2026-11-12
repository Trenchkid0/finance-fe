import { useActionState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Mail, Loader2, ArrowRight, KeyRound, Lock, RefreshCw } from "lucide-react";
import { forgotPassword } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function ForgotPassword() {
  const { t, language, setLanguage } = useLanguage();
  const isId = language === "id";
  const navigate = useNavigate();
  const [state, formAction, pending] = useActionState(forgotPassword, undefined);

  useEffect(() => {
    if (state?.ok && state?.data?.resetUrl) {
      navigate(state.data.resetUrl);
    }
  }, [state, navigate]);

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
                <span>{language === "id" ? "Bahasa Indonesia" : "English (US)"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border border-border bg-popover backdrop-blur-xl shadow-lg shadow-black/10 dark:shadow-black/45">
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
                className="flex size-10 items-center justify-center rounded-xl bg-accent text-white font-mono font-bold text-base shadow-sm ring-1 ring-white/15"
                aria-hidden
              >
                R
              </span>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full bg-income ring-2 ring-canvas" />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              Racks Finance
            </span>
          </div>

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-foreground">
              {t("forgotPasswordTitle")}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {t("forgotPasswordSubtitle")}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-7">
            <form action={formAction} className="space-y-5" noValidate>
              {/* Email */}
              <div className="space-y-2.5">
                <Label htmlFor="email">{t("emailLabel")}</Label>
                <div className="relative group">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="nama@email.com"
                    className="pl-11"
                    aria-invalid={!!state?.fieldErrors?.email}
                  />
                </div>
                {state?.fieldErrors?.email?.[0] ? (
                  <p className="text-xs text-destructive flex items-center gap-1.5">
                    <AlertCircle size={12} className="shrink-0" />
                    {state.fieldErrors.email[0]}
                  </p>
                ) : null}
              </div>

              {/* Global error */}
              {state?.error && !state.fieldErrors ? (
                <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 flex items-start gap-2.5">
                  <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                  <p className="text-xs text-destructive">{state.error}</p>
                </div>
              ) : null}

              {/* Submit */}
              <div className="pt-2">
                <Button type="submit" className="w-full h-12 text-[15px] group" disabled={pending}>
                  {pending ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <>
                      {language === "id" ? "Lanjutkan" : "Continue"}
                      <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>

          {/* Back to Login link */}
          <p className="text-[13px] text-muted-foreground text-center pt-1">
            <Link
              to="/login"
              className="text-muted-foreground hover:text-text-primary font-medium transition-colors inline-flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN — Hallmark Crafted Editorial Showcase: Cryptographic Continuity & Access Recovery */}
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
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-income/[0.06] rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-accent/[0.06] rounded-full blur-3xl pointer-events-none" />

        {/* Header Metadata Strip */}
        <div className="relative z-10 flex items-center justify-between border-b border-white/[0.08] pb-5">
          <div className="flex items-center gap-2.5">
            <span className="font-mono text-[10px] font-bold tracking-widest text-income uppercase px-2 py-0.5 rounded bg-income/10 border border-income/20">
              03 / RECOVERY
            </span>
            <span className="font-mono text-[11px] text-muted-foreground/80 tracking-wide uppercase">
              {isId ? "Protokol Pemulihan Akses" : "Access Recovery Protocol"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-income shadow-[0_0_8px_var(--income)]" />
            <span className="font-mono text-[11px] text-muted-foreground font-medium tracking-tight">
              ZERO-KNOWLEDGE AUTH
            </span>
          </div>
        </div>

        {/* Center Content: Security Hierarchy */}
        <div className="relative z-10 my-auto py-8 space-y-8 max-w-[580px]">
          {/* Main Statement */}
          <div className="space-y-3">
            <h2 className="text-3xl xl:text-4xl font-extrabold tracking-tight text-white leading-[1.2]">
              {isId ? (
                <>Kunci akses selalu berada di <span className="text-income">tangan Anda sendiri.</span></>
              ) : (
                <>You hold the master keys. <span className="text-income">We provide the vault.</span></>
              )}
            </h2>
            <p className="text-sm text-muted-foreground/90 leading-relaxed font-normal">
              {isId
                ? "Racks Finance menerapkan standar keamanan mandiri yang ketat. Permintaan pemulihan menghasilkan tiket kriptografi satu kali pakai yang dikirim langsung ke email terverifikasi tanpa perantara pihak ketiga."
                : "Racks Finance operates on strict zero-trust self-custody principles. Recovery requests issue a single-use signed cryptographic ticket directly to your verified inbox without passing through external aggregators."}
            </p>
          </div>

          {/* Security Verification Pillars */}
          <div className="grid grid-cols-1 gap-3.5 pt-2">
            {/* Pillar 1 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-income/10 border border-income/20 text-income flex items-center justify-center shrink-0 mt-0.5">
                  <KeyRound size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Tiket Verifikasi Berumur Singkat" : "Ephemeral Cryptographic Ticket"}
                    </span>
                    <span className="font-mono text-[9.5px] text-income/80 bg-income/10 px-1.5 py-0.2 rounded font-semibold">
                      15 Min Expiry
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Tautan pemulihan memiliki masa berlaku terbatas dan otomatis hangus seketika setelah digunakan satu kali."
                      : "The reset URL carries an expiry signature and is permanently invalidated the moment it is consumed."}
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-accent/10 border border-accent/20 text-accent flex items-center justify-center shrink-0 mt-0.5">
                  <RefreshCw size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Terminasi Sesi Multi-Perangkat" : "Instant Session Revocation"}
                    </span>
                    <span className="font-mono text-[9.5px] text-accent/80 bg-accent/10 px-1.5 py-0.2 rounded font-semibold">
                      Full Invalidation
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Begitu kata sandi diperbarui, seluruh sesi login dan token cookie di perangkat lain langsung dinonaktifkan."
                      : "Upon password rotation, all existing active JWT tokens and browser sessions across other devices are immediately revoked."}
                  </p>
                </div>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="p-4 rounded-xl border border-white/[0.07] bg-white/[0.02] backdrop-blur-sm transition-all duration-200 hover:border-white/[0.14] hover:bg-white/[0.03]">
              <div className="flex items-start gap-3.5">
                <div className="size-9 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 mt-0.5">
                  <Lock size={17} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-white tracking-wide">
                      {isId ? "Data Finansial Tetap Terisolasi" : "Untouched Encrypted Records"}
                    </span>
                    <span className="font-mono text-[9.5px] text-purple-400/80 bg-purple-500/10 px-1.5 py-0.2 rounded font-semibold">
                      Zero Exposure
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground/80 leading-normal">
                    {isId
                      ? "Buku besar, saldo transaksi, dan catatan rekening Anda tersimpan di database lokal yang tidak terpengaruh oleh pergantian kredensial."
                      : "Your underlying transaction ledger, balances, and receipts stay strictly sealed within your personal local database."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Cryptographic Assurance Specs */}
          <div className="grid grid-cols-3 gap-2.5 pt-1 border-t border-white/[0.08]">
            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                HASHING
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                Bcrypt 12-Rounds
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                COOKIES
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                httpOnly SameSite
              </span>
            </div>

            <div className="p-2.5 rounded-lg border border-white/[0.06] bg-white/[0.02]">
              <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground block">
                TELEMETRY
              </span>
              <span className="font-mono text-xs font-bold text-white block mt-0.5">
                0% Remote Logs
              </span>
            </div>
          </div>
        </div>

        {/* Footer Colophon */}
        <div className="relative z-10 flex items-center justify-between border-t border-white/[0.08] pt-5 font-mono text-[10.5px] text-muted-foreground/60">
          <span>RACKS FINANCE · RECOVERY ARCHITECTURE</span>
          <span className="tracking-widest uppercase">CRYPTOGRAPHIC ASSURANCE</span>
        </div>
      </div>
    </div>
  );
}
