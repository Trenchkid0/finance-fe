import { useActionState, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2, ArrowRight, CheckCircle, Lock } from "lucide-react";
import { resetPassword } from "@/app/actions/auth";
import { SelfHostedShowcase } from "@/components/auth/SelfHostedShowcase";
import { RacksLogo } from "@/components/ui/RacksLogo";
import { cn } from "@/lib/utils/cn";
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

function scorePassword(pw: string): number {
  if (pw.length < 8) return 0;
  let score = 1;
  const hasLower = /[a-z]/.test(pw);
  const hasUpper = /[A-Z]/.test(pw);
  const hasDigit = /\d/.test(pw);
  const hasSymbol = /[^A-Za-z0-9]/.test(pw);

  const variety = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  if (pw.length >= 12 || variety >= 2) score = 2;
  if (variety >= 3) score = 3;
  if (pw.length >= 16 && variety === 4) score = 4;

  return score;
}

const STRENGTH_META: Record<
  number,
  { label: string; tone: string; color: string }
> = {
  0: { label: "Terlalu pendek", tone: "text-muted-foreground/60", color: "bg-transparent" },
  1: { label: "Lemah", tone: "text-destructive", color: "bg-destructive" },
  2: { label: "Cukup", tone: "text-warning", color: "bg-warning" },
  3: { label: "Kuat", tone: "text-income", color: "bg-income" },
  4: { label: "Sangat kuat", tone: "text-income", color: "bg-income" },
};

export default function ResetPassword() {
  const { t, language, setLanguage } = useLanguage();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";

  const [state, formAction, pending] = useActionState(resetPassword, undefined);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState("");

  const score = scorePassword(password);
  const meta = STRENGTH_META[score];

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    const formData = new FormData(e.currentTarget);
    const password = formData.get("password")?.toString() || "";
    
    if (password !== confirmPassword) {
      e.preventDefault();
      setLocalError(
        language === "id"
          ? "Konfirmasi kata sandi tidak cocok."
          : "Password confirmation does not match."
      );
      return;
    }
    setLocalError("");
  };

  return (
    <div className="grid min-h-screen w-full lg:grid-cols-[5fr_7fr] overflow-hidden bg-canvas font-sans selection:bg-accent/20">
      {/* LEFT COLUMN — Form */}
      <div className="relative flex flex-col justify-center px-6 py-10 sm:px-10 lg:px-14 xl:px-18 z-10">
        {/* Language selector */}
        <div className="absolute top-5 right-5 z-20">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-hover-surface transition-colors bg-elevated border border-border"
              >
                <span>{language === "id" ? "Bahasa Indonesia" : "English (US)"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border border-border bg-popover shadow-lg shadow-black/10 dark:shadow-black/45">
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

        {/* Ambient background grid texture */}
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, var(--foreground) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

        <div className="relative mx-auto w-full max-w-[360px] space-y-10 animate-fade-in-up">
          {/* Brand */}
          <RacksLogo size="md" showWordmark />

          {/* Heading */}
          <div className="space-y-3">
            <h1 className="text-[2rem] leading-[1.15] font-extrabold tracking-tight text-foreground">
              {t("resetPasswordTitle")}
            </h1>
            <p className="text-[13px] text-muted-foreground leading-relaxed">
              {t("resetPasswordSubtitle")}
            </p>
          </div>

          {/* Form */}
          <div className="space-y-7">
            {state?.ok ? (
              <div className="rounded-xl border border-income/20 bg-income/[0.04] p-5 space-y-4 text-center flex flex-col items-center">
                <CheckCircle size={40} className="text-income" />
                <div className="space-y-1.5">
                  <h3 className="text-sm font-bold text-text-primary">
                    {language === "id" ? "Kata Sandi Diperbarui" : "Password Updated"}
                  </h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {language === "id"
                      ? "Kata sandi akun Anda telah sukses diperbarui. Silakan gunakan kata sandi baru untuk masuk."
                      : "Your account password has been successfully updated. Please use your new password to log in."}
                  </p>
                </div>
                <Button asChild className="w-full bg-accent hover:bg-accent/80 text-white text-xs h-10 mt-2">
                  <Link to="/login">
                    {language === "id" ? "Masuk ke Akun Sekarang" : "Log In Now"}
                    <ArrowRight size={14} className="ml-1.5" />
                  </Link>
                </Button>
              </div>
            ) : (
              <form onSubmit={handleFormSubmit} action={formAction} className="space-y-5" noValidate>
                {/* Hidden Token & Email payload */}
                <input type="hidden" name="token" value={token} />
                <input type="hidden" name="email" value={email} />

                {/* Email (Disabled Display) */}
                <div className="space-y-2.5">
                  <Label>{t("emailLabel")}</Label>
                  <Input
                    type="email"
                    value={email}
                    disabled
                    className="bg-elevated border-border text-muted-foreground/60 cursor-not-allowed"
                  />
                </div>

                {/* New Password */}
                <div className="space-y-2.5">
                  <Label htmlFor="password">{t("newPasswordLabel")}</Label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={language === "id" ? "Minimal 8 karakter" : "Minimum 8 characters"}
                      className="pl-11 pr-12"
                      aria-invalid={!!state?.fieldErrors?.password}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all duration-200"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>

                  {/* Segmented strength meter */}
                  <div className="space-y-2 pt-0.5">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((segment) => (
                        <div
                          key={segment}
                          className={cn(
                            "h-1 flex-1 rounded-full transition-all duration-500",
                            score >= segment ? meta.color : "bg-white/[0.06]"
                          )}
                        />
                      ))}
                    </div>
                    <div className="flex items-center justify-between">
                      <span
                        className={cn("text-[11px] font-medium", password ? meta.tone : "text-muted-foreground/40")}
                      >
                        {password ? (
                          (() => {
                            const labels: Record<number, Record<"id" | "en", string>> = {
                              0: { id: "Terlalu pendek", en: "Too short" },
                              1: { id: "Lemah", en: "Weak" },
                              2: { id: "Cukup", en: "Fair" },
                              3: { id: "Kuat", en: "Strong" },
                              4: { id: "Sangat kuat", en: "Very strong" }
                            };
                            return labels[score]?.[language] || labels[score]?.["id"] || "";
                          })()
                        ) : (
                          language === "id" ? "Minimal 8 karakter" : "Minimum 8 characters"
                        )}
                      </span>
                      {password && score < 3 ? (
                        <span className="text-[10px] text-muted-foreground/40">
                          {language === "id" ? "Tambah huruf besar / angka / simbol" : "Add uppercase / number / symbol"}
                        </span>
                      ) : null}
                    </div>
                  </div>

                  {state?.fieldErrors?.password?.[0] ? (
                    <p className="text-xs text-destructive flex items-center gap-1.5">
                      <AlertCircle size={12} className="shrink-0" />
                      {state.fieldErrors.password[0]}
                    </p>
                  ) : null}
                </div>

                {/* Confirm New Password */}
                <div className="space-y-2.5">
                  <Label htmlFor="confirmPassword">{t("confirmNewPasswordLabel")}</Label>
                  <div className="relative group">
                    <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder={language === "id" ? "Minimal 8 karakter" : "Minimum 8 characters"}
                      className="pl-11 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      tabIndex={-1}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all duration-200"
                    >
                      {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Validation errors */}
                {(state?.error && !state.fieldErrors) || localError ? (
                  <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 flex items-start gap-2.5">
                    <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
                    <p className="text-xs text-destructive">{localError || state?.error}</p>
                  </div>
                ) : null}

                {/* Submit */}
                <div className="pt-2">
                  <Button type="submit" className="w-full h-12 text-[15px] group" disabled={pending}>
                    {pending ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        {t("updatePasswordButton")}
                        <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}
          </div>

          <p className="text-[13px] text-muted-foreground text-center pt-1">
            <Link
              to="/login"
              className="text-muted-foreground hover:text-text-primary font-medium transition-colors"
            >
              {t("backToLogin")}
            </Link>
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN — SaaS + Self-Hosted Showcase */}
      <SelfHostedShowcase variant="reset" language={language} />
    </div>
  );
}
