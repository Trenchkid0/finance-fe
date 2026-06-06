"use client";

import { Plus, Search, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useQuickAdd } from "@/components/transactions/QuickAddProvider";
import { openCommandPalette } from "@/components/command-palette/CommandPalette";

/**
 * Sticky top bar — sidebar trigger + global actions.
 *
 *   - Search button → membuka command palette (Cmd+K)
 *   - Tambah button → membuka quick-add dialog (shortcut: N)
 *
 * Page title sengaja tidak dipasang di sini karena setiap page sudah
 * render <h1>-nya sendiri (audit poin 2 — hindari duplikasi visual).
 */
export function SiteHeader() {
  const { open: openQuickAdd, canCreate } = useQuickAdd();

  return (
    <header className="flex h-14 shrink-0 items-center gap-2 border-b border-white/[0.04] bg-canvas/80 backdrop-blur-xl sticky top-0 z-30">
      <div className="flex w-full items-center gap-3 px-4 lg:px-6">
        {/* Sidebar trigger */}
        <SidebarTrigger className="-ml-1 text-muted-foreground/50 hover:text-foreground hover:bg-white/[0.04] transition-all duration-200 rounded-lg" />
        <Separator
          orientation="vertical"
          className="mx-0.5 h-4 bg-white/[0.06]"
        />

        {/* Search trigger — command palette */}
        <button
          type="button"
          onClick={openCommandPalette}
          className="hidden md:flex items-center gap-2.5 h-9 px-3.5 rounded-xl border border-white/[0.06] bg-white/[0.02] text-xs text-muted-foreground/50 hover:text-foreground/80 hover:border-white/[0.12] hover:bg-white/[0.04] transition-all duration-300 w-64 lg:w-80 group"
          aria-label="Buka pencarian cepat"
        >
          <Search size={14} className="shrink-0 text-muted-foreground/40 group-hover:text-accent/60 transition-colors" />
          <span className="flex-1 text-left text-[12px]">Cari halaman, akun, transaksi…</span>
          <kbd className="ml-auto text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.08] text-muted-foreground/40 tracking-wide">
            ⌘K
          </kbd>
        </button>

        {/* Right side actions */}
        <div className="ml-auto flex items-center gap-1.5">
          {/* Mobile search */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Cari"
            className="h-9 w-9 md:hidden rounded-xl text-muted-foreground/50 hover:text-foreground"
            onClick={openCommandPalette}
          >
            <Search size={16} />
          </Button>

          {/* Notifications bell (placeholder) */}
          <Button
            variant="ghost"
            size="icon"
            aria-label="Notifikasi"
            className="h-9 w-9 rounded-xl text-muted-foreground/50 hover:text-foreground relative"
            disabled
          >
            <Bell size={16} />
            {/* Badge dot */}
            <span className="absolute top-2 right-2 size-1.5 rounded-full bg-accent" />
          </Button>

          {/* Separator */}
          <Separator
            orientation="vertical"
            className="mx-1 h-5 bg-white/[0.06] hidden sm:block"
          />

          {/* Add transaction */}
          <Button
            size="sm"
            onClick={openQuickAdd}
            disabled={!canCreate}
            title={
              canCreate
                ? "Tambah transaksi (N)"
                : "Tambahkan akun terlebih dahulu"
            }
            className="h-9 gap-2 rounded-xl text-[12px] px-4"
          >
            <Plus size={14} strokeWidth={2.5} />
            <span className="hidden sm:inline">Tambah</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
