import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Plus } from "lucide-react";
import { formatIDR } from "@/lib/utils/formatters";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { Card } from "@/components/ui/card";

/**
 * Balance sheet — pola Maybe Finance asli.
 *
 *   Assets · Rp 4.175.137
 *   ████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (stacked bar by group)
 *   ● Cash 16%   ● Investments 84%
 *
 *   ┌─────────────────────────────────────┐
 *   │ ▶ Cash               ▮▮░░░░░░░░ 16% │ Rp675.137
 *   │   • BNI               ▮░░░░░░░░  9% │ Rp377.628
 *   │   • Jago              ▮░░░░░░░░  1% │ Rp 52.000
 *   ├─────────────────────────────────────┤
 *   │ ▶ Investments        ▮▮▮▮▮▮▮▮▮░ 84% │ Rp3.500.000
 *   └─────────────────────────────────────┘
 *
 * Asset / Liability dipisah jadi dua kolom side-by-side. Setiap group
 * (Cash / Investments / Bank / dll) collapsible dengan <details>.
 */

export interface BalanceAccount {
  id: string;
  name: string;
  /** Rupiah whole number — sudah di-flip sign untuk liability bila perlu. */
  value: number;
  /** Persentase relatif terhadap total side (0..100). */
  percent: number;
  /** Inisial untuk avatar bulat (mis. "B" dari "BNI"). */
  initial: string;
}

export interface BalanceGroup {
  /** Mis. "Cash", "Investments", "Bank", "E-wallet". */
  name: string;
  color: string;
  total: number;
  percent: number;
  accounts: BalanceAccount[];
}

interface SideProps {
  title: "Assets" | "Liabilities";
  total: number;
  groups: BalanceGroup[];
}

interface Props {
  assets: SideProps;
  liabilities: SideProps;
  /** When true, hides the Liabilities panel if its groups are empty. */
  hideEmptyLiabilities?: boolean;
}

export function BalanceSheet({ assets, liabilities, hideEmptyLiabilities }: Props) {
  const showLiabilities = !hideEmptyLiabilities || liabilities.groups.length > 0;
  return (
    <section className={showLiabilities ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : ""}>
      <BalanceSide {...assets} />
      {showLiabilities ? <BalanceSide {...liabilities} /> : null}
    </section>
  );
}

function BalanceSide({ title, total, groups }: SideProps) {
  const { language } = useLanguage();
  const sideTitle = language === "id"
    ? (title === "Assets" ? "Aset" : "Liabilitas")
    : title;

  return (
    <Card className="p-6 space-y-5">
      <div className="flex items-baseline gap-2.5">
        <h2 className="text-sm font-semibold text-foreground">{sideTitle}</h2>
        <span className="text-muted-foreground/30">·</span>
        <p className="text-sm font-semibold font-mono tabular-nums text-muted-foreground/70">
          {formatIDR(total)}
        </p>
      </div>

      {groups.length === 0 ? (
        <EmptySide title={title} />
      ) : (
        <>
          {/* Stacked bar */}
          <div className="space-y-3">
            <div className="h-1.5 w-full bg-border/30 rounded-full overflow-hidden flex">
              {groups.map((g) => (
                <div
                  key={g.name}
                  className="h-full transition-all"
                  style={{
                    width: `${g.percent}%`,
                    backgroundColor: g.color,
                  }}
                  aria-label={`${g.name}: ${g.percent.toFixed(1)}%`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1.5">
              {groups.map((g) => (
                <div
                  key={g.name}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span
                    className="size-2 rounded-full"
                    style={{ backgroundColor: g.color }}
                  />
                  <span className="text-muted-foreground">{g.name}</span>
                  <span className="font-mono tabular-nums text-foreground font-medium">
                    {Math.round(g.percent)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Group list */}
          <div className="rounded-xl bg-white/[0.01] overflow-hidden border border-border/30">
            <header className="px-4 py-2.5 flex items-center text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest">
              <span className="flex-1 min-w-0">{language === "id" ? "Nama" : "Name"}</span>
              <span className="ml-auto flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="hidden sm:inline-block w-36 text-right">{language === "id" ? "Bobot" : "Weight"}</span>
                <span className="w-24 sm:w-32 text-right">{language === "id" ? "Nilai" : "Value"}</span>
              </span>
            </header>
            <div className="bg-card/35 rounded-md m-1 mt-0">
              {groups.map((g, idx) => (
                <GroupRow
                  key={g.name}
                  group={g}
                  isLast={idx === groups.length - 1}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </Card>
  );
}

function EmptySide({ title }: { title: "Assets" | "Liabilities" }) {
  const { language } = useLanguage();
  const isAssets = title === "Assets";
  return (
    <div className="py-10 flex flex-col items-center text-center">
      <span className="size-8 rounded-md bg-elevated text-muted-foreground flex items-center justify-center mb-3">
        <Plus size={16} />
      </span>
      <p className="text-sm font-medium text-foreground mb-1">
        {isAssets
          ? (language === "id" ? "Belum ada aset" : "No assets yet")
          : (language === "id" ? "Belum ada liabilitas" : "No liabilities yet")}
      </p>
      <p className="text-xs text-muted-foreground max-w-xs">
        {isAssets
          ? (language === "id"
              ? "Tambahkan akun pertama untuk melihat distribusi aset Anda."
              : "Add your first account to view your asset distribution.")
          : (language === "id"
              ? "Tambahkan kartu kredit atau pinjaman untuk melacak liabilitas."
              : "Add a credit card or loan to track liabilities.")}
      </p>
      {isAssets ? (
        <Link
          to="/accounts"
          className="mt-3 text-xs text-primary hover:underline font-medium"
        >
          {language === "id" ? "Tambah akun" : "Add account"} →
        </Link>
      ) : null}
    </div>
  );
}

function GroupRow({ group, isLast }: { group: BalanceGroup; isLast: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className={cn(!isLast && "border-b border-border")}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="group w-full px-4 py-3 flex items-center hover:bg-elevated/40 transition-all duration-200 hover:pl-5"
      >
        <span className="flex-1 min-w-0 flex items-center gap-2 text-sm font-medium text-foreground transition-colors duration-200 group-hover:text-accent">
          <ChevronRight
            size={14}
            className={cn(
              "text-muted-foreground transition-all duration-300 group-hover:text-accent shrink-0",
              open && "rotate-90",
            )}
          />
          <span className="truncate">{group.name}</span>
        </span>
        <span className="ml-auto flex items-center gap-4 sm:gap-6 text-sm shrink-0">
          <span className="hidden sm:flex w-36 justify-end">
            <DotWeight percent={group.percent} color={group.color} />
          </span>
          <span className="w-24 sm:w-32 text-right font-mono tabular-nums text-foreground transition-all duration-200 group-hover:scale-105 group-hover:font-bold">
            {formatIDR(group.total)}
          </span>
        </span>
      </button>

      {open ? (
        <div className="bg-elevated/30 animate-in slide-in-from-top-2 duration-300">
          {group.accounts.map((acc, idx) => (
            <Link
              key={acc.id}
              to={`/accounts/${acc.id}`}
              className={cn(
                "group/account pl-12 pr-4 py-2.5 flex items-center text-sm hover:bg-elevated/60 transition-all duration-200 hover:pl-14",
                idx > 0 && "border-t border-border/60",
              )}
            >
              <span className="flex-1 min-w-0 flex items-center gap-2.5">
                <span
                  className="size-6 rounded-full border flex items-center justify-center text-[10px] font-medium uppercase shrink-0 transition-all duration-200 group-hover/account:scale-110 group-hover/account:shadow-lg"
                  style={{
                    backgroundColor: `color-mix(in oklab, ${group.color} 12%, transparent)`,
                    borderColor: `color-mix(in oklab, ${group.color} 30%, transparent)`,
                    color: group.color,
                  }}
                >
                  {acc.initial}
                </span>
                <span className="text-foreground truncate transition-colors duration-200 group-hover/account:text-accent">{acc.name}</span>
              </span>
              <span className="ml-auto flex items-center gap-4 sm:gap-6 shrink-0">
                <span className="hidden sm:flex w-36 justify-end">
                  <DotWeight percent={acc.percent} color={group.color} />
                </span>
                <span className="w-24 sm:w-32 text-right font-mono tabular-nums text-foreground transition-all duration-200 group-hover/account:scale-105 group-hover/account:font-bold group-hover/account:text-accent">
                  {formatIDR(acc.value)}
                </span>
              </span>
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * 10-dot weight indicator (Maybe Finance style).
 *
 *   ▮▮▮▮░░░░░░ 42%
 *
 * Dot count = ceil(percent / 10), max 10. Dot inactive di-render dengan
 * opacity 20% dari color yang sama supaya konsisten dengan group.
 */
function DotWeight({ percent, color }: { percent: number; color: string }) {
  return (
    <span className="flex items-center gap-2">
      <div className="h-1.5 w-16 bg-border/30 rounded-full overflow-hidden shrink-0">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percent}%`,
            backgroundColor: color,
          }}
        />
      </div>
      <span className="font-mono tabular-nums text-xs text-foreground min-w-[45px] text-right shrink-0">
        {percent.toFixed(1)}%
      </span>
    </span>
  );
}
