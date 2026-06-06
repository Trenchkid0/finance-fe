"use client";

import { useActionState, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Info, Loader2, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { login } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const isDev = import.meta.env.DEV;

export function LoginForm() {
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
          <Label htmlFor="email">Alamat Email</Label>
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
            <Label htmlFor="password">Kata Sandi</Label>
            <Link
              to="#"
              tabIndex={-1}
              className="text-[11px] text-accent/60 hover:text-accent transition-colors pointer-events-none"
              aria-disabled
            >
              Lupa kata sandi?
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

        {/* Global error */}
        {state?.error && !state.fieldErrors ? (
          <div className="rounded-xl border border-destructive/25 bg-destructive/[0.04] px-4 py-3 flex items-start gap-2.5">
            <AlertCircle size={14} className="text-destructive mt-0.5 shrink-0" />
            <p className="text-xs text-destructive">{state.error}</p>
          </div>
        ) : null}

        {/* Submit */}
        <Button type="submit" className="w-full h-12 text-[15px] group" disabled={pending}>
          {pending ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              Masuk ke Akun
              <ArrowRight size={16} className="transition-transform duration-300 group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-white/[0.06]" />
        </div>
        <div className="relative flex justify-center">
          <span className="bg-canvas px-4 text-[10px] uppercase tracking-[0.15em] text-muted-foreground/40 font-semibold">atau</span>
        </div>
      </div>

      {/* Social login placeholder */}
      <Button variant="outline" className="w-full h-11 gap-2.5 text-[13px]" type="button" disabled>
        <Github size={16} />
        Lanjutkan dengan GitHub
      </Button>

      {/* Register link */}
      <p className="text-[13px] text-muted-foreground text-center pt-1">
        Belum punya akun?{" "}
        <Link
          to="/register"
          className="text-accent hover:text-accent/80 font-semibold transition-colors"
        >
          Daftar gratis
        </Link>
      </p>
    </div>
  );
}
