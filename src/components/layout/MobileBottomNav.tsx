import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  TrendingDown,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils/cn";

/**
 * Mobile bottom navigation bar — AGENTS.md improvement recommendation.
 *
 * Provides quick access to main sections without opening sidebar on mobile.
 * Hidden on desktop (md:hidden), fixed at bottom on mobile devices.
 *
 * Design:
 *  - 5 primary destinations (Dashboard, Transactions, Income, Expenses, Budget)
 *  - Active state with accent color + icon fill
 *  - Touch-friendly tap targets (min 44x44px)
 *  - Glassmorphism backdrop for content overlap
 */

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transaksi", icon: ArrowLeftRight },
  { href: "/income", label: "Masuk", icon: TrendingUp },
  { href: "/expenses", label: "Keluar", icon: TrendingDown },
  { href: "/budget", label: "Anggaran", icon: PiggyBank },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();

  return (
    <nav
      className="md:hidden fixed bottom-4 left-4 right-4 z-50 rounded-2xl border border-border/40 bg-card/65 backdrop-blur-lg supports-[backdrop-filter]:bg-card/60 shadow-[0_8px_32px_rgba(0,0,0,0.5)]"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 gap-0.5 p-1.5">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "group relative flex flex-col items-center justify-center rounded-xl py-1.5 transition-colors duration-200 min-h-[44px]",
                isActive
                  ? "text-accent font-bold"
                  : "text-text-muted active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div
                className={cn(
                  "flex items-center justify-center rounded-full transition-all duration-300",
                  isActive
                    ? "bg-accent/10 px-4 py-1 text-accent border border-accent/20 shadow-[0_0_15px_rgba(56,139,253,0.15)]"
                    : "px-4 py-1 text-text-muted group-hover:text-text-primary"
                )}
              >
                <Icon
                  size={18}
                  strokeWidth={isActive ? 2.5 : 2}
                  className={cn(
                    "shrink-0 transition-transform duration-300",
                    isActive && "scale-105"
                  )}
                  aria-hidden="true"
                />
              </div>
              <span className={cn(
                "text-[9px] font-semibold tracking-wide uppercase leading-none mt-1 transition-colors duration-200",
                isActive ? "text-accent" : "text-text-muted group-hover:text-text-primary"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

/**
 * Spacer component to prevent content from being hidden behind bottom nav.
 * Add this at the end of your main content area on mobile.
 */
export function MobileBottomNavSpacer() {
  return <div className="md:hidden h-20" aria-hidden="true" />;
}

// Made with Bob
