import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Plus,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";
import { useQuickAdd } from "@/components/transactions/QuickAddProvider";

/**
 * Mobile bottom navigation bar — fixed at bottom, hidden on desktop (md:hidden).
 *
 * Design goals:
 *  - Floating pill card with glassmorphism
 *  - Ergonomic layout: Home, Transactions, Center QuickAdd Action (+), Budget, Accounts
 *  - Active item highlighted with accent pill background
 *  - Icon + label layout, touch targets ≥ 44px
 *  - Smooth scale + color transitions
 *  - Language-aware labels (ID / EN)
 */

interface NavItem {
  href: string;
  labelId: string;
  labelEn: string;
  icon: LucideIcon;
}

const NAV_ITEMS_LEFT: NavItem[] = [
  { href: "/", labelId: "Dasbor", labelEn: "Home", icon: LayoutDashboard },
  { href: "/transactions", labelId: "Transaksi", labelEn: "Transactions", icon: ArrowLeftRight },
];

const NAV_ITEMS_RIGHT: NavItem[] = [
  { href: "/budget", labelId: "Anggaran", labelEn: "Budget", icon: PiggyBank },
  { href: "/accounts", labelId: "Rekening", labelEn: "Accounts", icon: Wallet },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { language } = useLanguage();
  const { open: openQuickAdd, canCreate } = useQuickAdd();

  const renderNavItem = (item: NavItem) => {
    const isActive =
      item.href === "/"
        ? pathname === "/"
        : pathname.startsWith(item.href);
    const Icon = item.icon;
    const label = language === "id" ? item.labelId : item.labelEn;

    return (
      <Link
        key={item.href}
        to={item.href}
        className={cn(
          "group relative flex flex-col items-center justify-center gap-1 py-1.5 px-1 rounded-xl transition-all duration-200 min-h-[50px] select-none",
          isActive
            ? "text-accent"
            : "text-muted-foreground/75 active:scale-95 hover:text-foreground"
        )}
        aria-current={isActive ? "page" : undefined}
      >
        {/* Active pill background */}
        {isActive && (
          <span className="absolute inset-0 rounded-xl bg-accent/10 border border-accent/20" />
        )}

        {/* Icon */}
        <Icon
          size={18}
          strokeWidth={isActive ? 2.5 : 1.8}
          className={cn(
            "relative z-10 shrink-0 transition-all duration-200",
            isActive
              ? "text-accent drop-shadow-[0_0_6px_rgba(56,139,253,0.5)]"
              : "text-muted-foreground/75 group-hover:text-foreground group-hover:scale-110"
          )}
          aria-hidden="true"
        />

        {/* Label */}
        <span
          className={cn(
            "relative z-10 text-[9.5px] font-semibold tracking-wide uppercase leading-none transition-colors duration-200 truncate max-w-full px-0.5",
            isActive
              ? "text-accent font-bold"
              : "text-muted-foreground/75 group-hover:text-foreground"
          )}
        >
          {label}
        </span>
      </Link>
    );
  };

  return (
    <nav
      className="md:hidden fixed bottom-4 left-3 right-3 z-50 pointer-events-auto"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      aria-label="Mobile navigation"
    >
      {/* Floating pill container */}
      <div className="rounded-2xl border border-white/[0.1] bg-surface/90 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.65)] p-1.5">
        <div className="grid grid-cols-5 items-center gap-0.5">
          {/* Left items: Dashboard & Transactions */}
          {NAV_ITEMS_LEFT.map(renderNavItem)}

          {/* Center elevated QuickAdd button */}
          <div className="flex flex-col items-center justify-center">
            <button
              type="button"
              onClick={openQuickAdd}
              disabled={!canCreate}
              aria-label={language === "id" ? "Tambah transaksi" : "Add transaction"}
              title={
                canCreate
                  ? language === "id"
                    ? "Tambah transaksi cepat"
                    : "Quick add transaction"
                  : language === "id"
                  ? "Tambahkan rekening terlebih dahulu"
                  : "Add an account first"
              }
              className={cn(
                "group relative flex flex-col items-center justify-center -my-2.5 select-none focus:outline-none",
                !canCreate && "opacity-40 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "size-11 rounded-full flex items-center justify-center shadow-lg border-2 border-surface transition-all duration-200 active:scale-95 group-hover:scale-105",
                  canCreate
                    ? "bg-accent text-white shadow-accent/35"
                    : "bg-muted-foreground/30 text-muted-foreground"
                )}
                style={{
                  background: canCreate
                    ? "linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #000) 100%)"
                    : undefined,
                }}
              >
                <Plus size={22} strokeWidth={2.5} className="group-hover:rotate-90 transition-transform duration-200" />
              </div>
              <span className="text-[9px] font-bold tracking-wide uppercase leading-none mt-1 text-accent">
                {language === "id" ? "Tambah" : "Add"}
              </span>
            </button>
          </div>

          {/* Right items: Budget & Accounts */}
          {NAV_ITEMS_RIGHT.map(renderNavItem)}
        </div>
      </div>
    </nav>
  );
}

/**
 * Spacer to prevent content from being hidden behind the bottom nav.
 * Add at the end of main content area on mobile.
 */
export function MobileBottomNavSpacer() {
  return <div className="md:hidden h-24" aria-hidden="true" />;
}
