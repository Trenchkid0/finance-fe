import { Link } from "react-router-dom";
import { ArrowRight, FolderTree, Plus, Sparkles, Wallet } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * First-time onboarding — ditampilkan saat user belum punya akun.
 *
 * Dashboard kosong total (semua chart empty, semua angka 0) bingungin
 * user baru. Tiga step jelas + CTA langsung ke aksi yang dibutuhkan.
 */

interface Props {
  userName: string;
}

export function OnboardingHero({ userName }: Props) {
  return (
    <div className="space-y-8 animate-fade-in-up">
      <header className="space-y-2">
        <h1 className="text-2xl lg:text-[1.75rem] font-extrabold tracking-tight text-foreground">
          Halo, {userName}
        </h1>
        <p className="text-sm text-muted-foreground/80">
          Ayo siapkan akun keuangan Anda — cuma butuh tiga langkah cepat.
        </p>
      </header>

      <Card className="p-6 lg:p-8">
        <div className="flex items-start gap-3 mb-6">
          <span className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Sparkles size={18} />
          </span>
          <div>
            <h2 className="text-base font-medium text-foreground">
              Mulai pakai Racks Finance
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              Setelah satu transaksi pertama, dashboard akan langsung
              menampilkan ringkasan, chart arus kas, dan distribusi aset.
            </p>
          </div>
        </div>

        <ol className="space-y-3">
          <Step
            number={1}
            icon={<Wallet size={16} />}
            title="Tambah akun keuangan"
            description="Bank, e-wallet, atau dompet tunai. Saldo awal jadi titik mulai net worth Anda."
            href="/accounts"
            cta="Tambah akun pertama"
          />
          <Step
            number={2}
            icon={<Plus size={16} />}
            title="Catat transaksi pertama"
            description="Tekan tombol Tambah di header (atau pintasan N). Bisa scan struk pakai AI."
            href="/transactions"
            cta="Buka halaman transaksi"
          />
          <Step
            number={3}
            icon={<FolderTree size={16} />}
            title="Atur kategori (opsional)"
            description="Sudah ada 12 kategori bawaan. Tambah custom Anda di pengaturan."
            href="/settings"
            cta="Buka pengaturan"
            secondary
          />
        </ol>
      </Card>
    </div>
  );
}

function Step({
  number,
  icon,
  title,
  description,
  href,
  cta,
  secondary,
}: {
  number: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  href: string;
  cta: string;
  secondary?: boolean;
}) {
  return (
    <li className="flex items-start gap-4 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:-translate-y-0.5 transition-all duration-300">
      <div className="flex items-center gap-3 shrink-0">
        <span className="size-7 rounded-full bg-card border border-border text-muted-foreground flex items-center justify-center text-xs font-mono tabular-nums">
          {number}
        </span>
        <span className="size-9 rounded-md bg-primary/10 text-primary flex items-center justify-center hidden sm:flex">
          {icon}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
          {description}
        </p>
      </div>

      <Button
        asChild
        variant={secondary ? "secondary" : "default"}
        size="sm"
        className="shrink-0 text-xs"
      >
        <Link to={href}>
          {cta}
          <ArrowRight size={12} />
        </Link>
      </Button>
    </li>
  );
}
