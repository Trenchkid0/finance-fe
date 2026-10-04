import * as React from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  Plus,
  PiggyBank,
  Settings,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  type LucideIcon,
} from "lucide-react";

import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "@/components/ui/command";
import { createPortal } from "react-dom";
import { useQuickAdd } from "@/components/transactions/QuickAddProvider";

interface AccountQuickEntry {
  id: string;
  name: string;
}

interface Props {
  /** Daftar akun untuk jump cepat ke detail. */
  accounts: AccountQuickEntry[];
}

interface NavEntry {
  href: string;
  label: string;
  icon: LucideIcon;
  keywords?: string[];
}

const NAV_ENTRIES: NavEntry[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard, keywords: ["beranda", "home"] },
  { href: "/accounts", label: "Akun", icon: Wallet, keywords: ["account", "rekening", "wallet"] },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight, keywords: ["transaction", "history"] },
  { href: "/income", label: "Pemasukan", icon: TrendingUp, keywords: ["income"] },
  { href: "/expenses", label: "Pengeluaran", icon: TrendingDown, keywords: ["expense", "spending"] },
  { href: "/budget", label: "Anggaran", icon: PiggyBank, keywords: ["budget", "limit"] },
  { href: "/settings", label: "Pengaturan", icon: Settings, keywords: ["setting", "kategori"] },
  { href: "/profile", label: "Profil", icon: User, keywords: ["profile", "user"] },
];

/**
 * Command palette — Cmd+K / Ctrl+K untuk navigasi cepat.
 *
 * Dipasang di dashboard layout. Memberikan akses cepat ke:
 *  - "Tambah transaksi" (langsung membuka QuickAddDialog)
 *  - 8 page utama dengan ikon
 *  - List akun user (jump ke `/accounts/:id`)
 *
 * Search default cmdk pakai fuzzy substring match yang case-insensitive,
 * jadi user bisa ketik "trx" → ketemu "Transaksi".
 */
export function CommandPalette({ accounts }: Props) {
  const [open, setOpen] = React.useState(false);
  const navigate = useNavigate();
  const { open: openQuickAdd, canCreate } = useQuickAdd();

  // Cmd+K / Ctrl+K toggle palette. Sengaja terpisah dari QuickAdd ("n")
  // supaya keduanya bisa hidup bersamaan.
  React.useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Expose lewat custom event biar SiteHeader bisa membuka tanpa import circular.
  React.useEffect(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener("command-palette:open", onOpen);
    return () => window.removeEventListener("command-palette:open", onOpen);
  }, []);

  // Esc + lock scroll exactly like TransactionForm (create transaction)
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  function go(path: string) {
    setOpen(false);
    navigate(path);
  }

  function triggerQuickAdd() {
    setOpen(false);
    // Beri waktu dialog command tertutup dulu sebelum buka dialog quick-add
    setTimeout(() => openQuickAdd(), 50);
  }

  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 p-4 pt-[12vh] sm:pt-[15vh] backdrop-blur-sm animate-in fade-in-0 duration-150"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div
        className="flex max-h-[calc(100dvh-48px)] w-full max-w-xl flex-col overflow-hidden rounded-[22px] border border-white/[0.12] dark:border-white/[0.08] bg-popover/98 shadow-2xl backdrop-blur-2xl animate-in zoom-in-95 duration-150"
        role="dialog"
        aria-modal="true"
        aria-label="Pencarian Cepat"
      >
        <Command className="[&_[cmdk-group-heading]]:px-3">
          <CommandInput placeholder="Cari halaman, akun, atau aksi…" />
          <CommandList className="max-h-[min(52vh,380px)] overflow-y-auto px-1 py-1.5">
            <CommandEmpty>Tidak ada hasil ditemukan.</CommandEmpty>

            <CommandGroup heading="Aksi">
              <CommandItem
                onSelect={triggerQuickAdd}
                disabled={!canCreate}
                value="tambah transaksi add new"
              >
                <Plus />
                <span>Tambah transaksi</span>
                <CommandShortcut>N</CommandShortcut>
              </CommandItem>
            </CommandGroup>

            <CommandSeparator />

            <CommandGroup heading="Halaman">
              {NAV_ENTRIES.map((nav) => {
                const Icon = nav.icon;
                return (
                  <CommandItem
                    key={nav.href}
                    onSelect={() => go(nav.href)}
                    value={[nav.label, ...(nav.keywords ?? [])].join(" ")}
                  >
                    <Icon />
                    <span>{nav.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>

            {accounts.length > 0 ? (
              <>
                <CommandSeparator />
                <CommandGroup heading="Akun">
                  {accounts.map((acc) => (
                    <CommandItem
                      key={acc.id}
                      onSelect={() => go(`/accounts/${acc.id}`)}
                      value={`akun ${acc.name}`}
                    >
                      <Wallet />
                      <span>{acc.name}</span>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </>
            ) : null}
          </CommandList>

          {/* Footer Shortcuts */}
          <div className="flex items-center justify-between border-t border-border/60 px-4 py-2.5 bg-muted/20 text-[11px] text-muted-foreground/80 select-none">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] border border-border/40 text-foreground/80">↑</kbd>
                <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] border border-border/40 text-foreground/80">↓</kbd>
                <span className="text-muted-foreground/70">Navigasi</span>
              </span>
              <span className="flex items-center gap-1">
                <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] border border-border/40 text-foreground/80">↵</kbd>
                <span className="text-muted-foreground/70">Pilih</span>
              </span>
            </div>
            <div className="flex items-center gap-1">
              <kbd className="rounded bg-muted/60 px-1.5 py-0.5 font-mono text-[10px] border border-border/40 text-foreground/80">ESC</kbd>
              <span className="text-muted-foreground/70">Tutup</span>
            </div>
          </div>
        </Command>
      </div>
    </div>,
    document.body
  );
}

/** Helper untuk komponen lain (mis. SiteHeader) untuk membuka palette. */
export function openCommandPalette() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event("command-palette:open"));
  }
}
