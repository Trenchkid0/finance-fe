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
                "relative flex flex-col items-center justify-center gap-1.5 rounded-xl py-2 px-1 transition-colors duration-200 min-h-[44px]",
                isActive
                  ? "text-accent bg-accent/10 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated/40 active:scale-95"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {/* Simple active indicator dot at top */}
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-b-full bg-accent" />
              )}
              
              <Icon
                size={18}
                strokeWidth={isActive ? 2.5 : 2}
                className={cn(
                  "shrink-0 transition-transform duration-200",
                  isActive && "scale-110"
                )}
                aria-hidden="true"
              />
              <span className="text-[9px] font-semibold tracking-wide uppercase leading-none scale-95">
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
