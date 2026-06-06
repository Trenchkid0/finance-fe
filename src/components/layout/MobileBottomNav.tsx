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
      className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-border bg-card/95 backdrop-blur-md supports-[backdrop-filter]:bg-card/80"
      aria-label="Mobile navigation"
    >
      <div className="grid grid-cols-5 gap-1 px-2 py-2 safe-area-inset-bottom">
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
                "flex flex-col items-center justify-center gap-1 rounded-lg py-2 px-1 transition-colors duration-150 min-h-[44px]",
                isActive
                  ? "text-accent bg-accent/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-elevated active:bg-elevated/80"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                className="shrink-0"
                aria-hidden="true"
              />
              <span className="text-[10px] font-medium leading-none">
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
