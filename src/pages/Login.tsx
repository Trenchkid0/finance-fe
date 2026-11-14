import { LoginForm } from "@/components/auth/LoginForm";
import { SelfHostedShowcase } from "@/components/auth/SelfHostedShowcase";
import { RacksLogo } from "@/components/ui/RacksLogo";
import { Shield, Zap } from "lucide-react";
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
                className="h-8 gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-text-primary hover:bg-hover-surface transition-colors bg-elevated border border-border"
              >
                <span>{isId ? "Bahasa Indonesia" : "English (US)"}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="min-w-[150px] rounded-xl border border-border bg-popover shadow-lg shadow-black/10 dark:shadow-black/45">
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
          <RacksLogo size="md" showWordmark />

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

      {/* RIGHT COLUMN — SaaS + Self-Hosted Showcase */}
      <SelfHostedShowcase variant="login" language={language} />
    </div>
  );
}
