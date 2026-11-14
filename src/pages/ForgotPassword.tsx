import { useActionState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Mail, Loader2, ArrowRight } from "lucide-react";
import { forgotPassword } from "@/app/actions/auth";
import { SelfHostedShowcase } from "@/components/auth/SelfHostedShowcase";
import { RacksLogo } from "@/components/ui/RacksLogo";
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

      {/* RIGHT COLUMN — SaaS + Self-Hosted Showcase */}
      <SelfHostedShowcase variant="recovery" language={language} />
    </div>
  );
}
