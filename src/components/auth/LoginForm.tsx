import { useActionState, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Info, Loader2, Mail, Lock, ArrowRight } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useLanguage } from "@/lib/contexts/LanguageContext";

const isDev = import.meta.env.DEV && import.meta.env.VITE_SHOW_DEMO !== "false";

export function LoginForm() {
  const { t } = useLanguage();
  const [state, formAction, pending] = useActionState(login, undefined);
  const [showPassword, setShowPassword] = useState(false);

  const demoEmail = isDev ? "demo@maybe.local" : "";
  const demoPassword = isDev ? "password123" : "";

  return (
    <div className="space-y-7">
      {isDev ? (
        <div className="rounded-xl border border-accent/20 bg-accent/[0.04] px-4 py-3 flex items-start gap-2.5">
          <Info size={14} className="text-accent mt-0.5 shrink-0" />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Mode dev — kredensial demo sudah terisi.{" "}
            <span className="font-mono text-accent font-semibold">demo@maybe.local</span>
          </p>
        </div>
      ) : null}

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
              defaultValue={demoEmail}
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

        {/* Password */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">{t("passwordLabel")}</Label>
            <Link
              to="/forgot-password"
              className="text-[11px] text-accent/75 hover:text-accent font-medium transition-colors"
            >
              {t("forgotPassword")}
            </Link>
          </div>
          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              required
              defaultValue={demoPassword}
              placeholder="••••••••"
              className="pl-11 pr-12"
              aria-invalid={!!state?.fieldErrors?.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              tabIndex={-1}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-muted-foreground/40 hover:text-foreground hover:bg-white/[0.06] transition-all duration-200"
              aria-label={
                showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"
              }
            >
              {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {state?.fieldErrors?.password?.[0] ? (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0" />
              {state.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        {/* Remember Me */}
        <div className="flex items-center gap-2.5 py-0.5">
          <input
            type="checkbox"
            id="remember"
            name="remember"
            className="size-4 rounded border-border bg-elevated text-accent focus:ring-2 focus:ring-accent/50 focus:ring-offset-0 focus:outline-none transition-all duration-200 accent-accent cursor-pointer"
          />
          <Label htmlFor="remember" className="text-xs text-muted-foreground select-none cursor-pointer font-medium hover:text-text-primary transition-colors">
            {t("rememberMe")}
          </Label>
        </div>

        {/* Global error */}
        {state?.error && !state.fieldErrors ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 flex items-start gap-2.5">
            <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{state.error}</p>
          </div>
        ) : null}

        {/* Submit */}
        {/* <div className="pt-5"> */}
          <Button type="submit" className="w-full h-12 text-[15px] group" disabled={pending}>
            {pending ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <>
                {t("loginButton")}
                <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
              </>
            )}
          </Button>
        {/* </div> */}
      </form>


      {/* Register link */}
      <p className="text-[13px] text-muted-foreground text-center pt-1">
        {t("noAccount")}{" "}
        <Link
          to="/register"
          className="text-accent hover:text-accent/80 font-semibold transition-colors"
        >
          {t("registerFree")}
        </Link>
      </p>
    </div>
  );
}
