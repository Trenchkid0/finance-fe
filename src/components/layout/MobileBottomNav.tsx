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
import { useLanguage } from "@/lib/contexts/LanguageContext";

/**
 * Mobile bottom navigation bar — fixed at bottom, hidden on desktop (md:hidden).
 *
 * Design goals:
 *  - Floating pill card with glassmorphism
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

const NAV_ITEMS: NavItem[] = [
  { href: "/", labelId: "Dasbor", labelEn: "Home", icon: LayoutDashboard },
  { href: "/transactions", labelId: "Transaksi", labelEn: "Transactions", icon: ArrowLeftRight },
  { href: "/income", labelId: "Masuk", labelEn: "Income", icon: TrendingUp },
  { href: "/expenses", labelId: "Keluar", labelEn: "Expenses", icon: TrendingDown },
  { href: "/budget", labelId: "Anggaran", labelEn: "Budget", icon: PiggyBank },
];

export function MobileBottomNav() {
  const { pathname } = useLocation();
  const { language } = useLanguage();

  return (
    <nav
      className="md:hidden fixed bottom-4 left-3 right-3 z-50"
      aria-label="Mobile navigation"
    >
      {/* Floating pill container */}
      <div className="rounded-2xl border border-white/[0.08] bg-surface/80 backdrop-blur-xl shadow-[0_8px_40px_rgba(0,0,0,0.55)] p-1.5">
        <div className="grid grid-cols-5 gap-0.5">
          {NAV_ITEMS.map((item) => {
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
                  "group relative flex flex-col items-center justify-center gap-1 py-2 px-1 rounded-xl transition-all duration-200 min-h-[52px] select-none",
                  isActive
                    ? "text-accent"
                    : "text-text-muted active:scale-95 hover:text-text-primary"
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
                      : "text-text-muted group-hover:text-text-primary group-hover:scale-110"
                  )}
                  aria-hidden="true"
                />

                {/* Label */}
                <span
                  className={cn(
                    "relative z-10 text-[9px] font-semibold tracking-wide uppercase leading-none transition-colors duration-200 truncate max-w-full px-0.5",
                    isActive
                      ? "text-accent"
                      : "text-text-muted group-hover:text-text-primary"
                  )}
                >
                  {label}
                </span>
              </Link>
            );
          })}
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
