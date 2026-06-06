"use client";

import { useActionState, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff, Loader2, User, Mail, Lock, ArrowRight, Github } from "lucide-react";
import { register } from "@/app/actions/auth";
import { cn } from "@/lib/utils/cn";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Score kekuatan password 0..4 — heuristik ringan, dependency-free.
 */
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

export function RegisterForm() {
  const [state, formAction, pending] = useActionState(register, undefined);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const score = scorePassword(password);
  const meta = STRENGTH_META[score];

  return (
    <div className="space-y-7">
      <form action={formAction} className="space-y-5" noValidate>
        {/* Name */}
        <div className="space-y-2.5">
          <Label htmlFor="name">Nama Lengkap</Label>
          <div className="relative group">
            <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
            <Input
              id="name"
              name="name"
              autoComplete="name"
              placeholder="Mis. Caesa Putra"
              required
              className="pl-11"
              aria-invalid={!!state?.fieldErrors?.name?.[0]}
            />
          </div>
          {state?.fieldErrors?.name?.[0] ? (
            <p className="text-xs text-destructive flex items-center gap-1.5">
              <AlertCircle size={12} className="shrink-0" />
              {state.fieldErrors.name[0]}
            </p>
          ) : null}
        </div>

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
              placeholder="nama@email.com"
              required
              className="pl-11"
              aria-invalid={!!state?.fieldErrors?.email?.[0]}
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
          <Label htmlFor="password">Kata Sandi</Label>
          <div className="relative group">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground/40 group-focus-within:text-accent/70 transition-colors duration-300 pointer-events-none" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimal 8 karakter"
              className="pl-11 pr-12"
              aria-invalid={!!state?.fieldErrors?.password?.[0]}
              aria-describedby="password-strength"
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

          {/* Segmented strength meter */}
          <div id="password-strength" className="space-y-2 pt-0.5" aria-live="polite">
            <div className="flex gap-1">
              {[1, 2, 3, 4].map((segment) => (
                <div
                  key={segment}
                  className={cn(
                    "h-1 flex-1 rounded-full transition-all duration-500",
                    score >= segment ? meta.color : "bg-white/[0.06]",
                  )}
                />
              ))}
            </div>
            <div className="flex items-center justify-between">
              <span
                className={cn("text-[11px] font-medium", password ? meta.tone : "text-muted-foreground/40")}
              >
                {password ? meta.label : "Minimal 8 karakter"}
              </span>
              {password && score < 3 ? (
                <span className="text-[10px] text-muted-foreground/40">
                  Tambah huruf besar / angka / simbol
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
              Buat Akun Saya
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

      {/* Login link */}
      <p className="text-[13px] text-muted-foreground text-center pt-1">
        Sudah punya akun?{" "}
        <Link to="/login" className="text-accent hover:text-accent/80 font-semibold transition-colors">
          Masuk
        </Link>
      </p>
    </div>
  );
}
