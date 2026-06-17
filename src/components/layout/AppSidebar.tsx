import * as React from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowLeftRight,
  LayoutDashboard,
  PiggyBank,
  Settings,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  CalendarRange,
  Target,
  Briefcase,
  type LucideIcon,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { NavUser } from "./NavUser";
import { cn } from "@/lib/utils/cn";
import { useLanguage } from "@/lib/contexts/LanguageContext";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  badge?: number;
  badgeTone?: "neutral" | "warning";
}

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  counts?: {
    accounts?: number;
    transactions?: number;
    accountsAtRisk?: number;
  };
}

export function AppSidebar({ user, counts, ...props }: AppSidebarProps) {
  const { pathname } = useLocation();
  const { t, language } = useLanguage();
  const { setOpenMobile, isMobile } = useSidebar();

  // Auto-close sidebar on mobile when route changes
  React.useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [pathname, isMobile, setOpenMobile]);

  const navMain: NavItem[] = [
    { href: "/", label: t("dashboard"), icon: LayoutDashboard },
    {
      href: "/accounts",
      label: language === "id" ? "Rekening" : t("accounts"),
      icon: Wallet,
      badge: counts?.accounts && counts.accounts > 0 ? counts.accounts : undefined,
    },
    {
      href: "/transactions",
      label: t("transactions"),
      icon: ArrowLeftRight,
      badge:
        counts?.transactions && counts.transactions > 0
          ? counts.transactions
          : undefined,
    },
    {
      href: "/investments",
      label: language === "id" ? "Investasi & Aset" : "Investments",
      icon: Briefcase,
    },
    {
      href: "/goals",
      label: language === "id" ? "Target Tabungan" : "Savings Goals",
      icon: Target,
    },
  ];

  const navAnalytics: NavItem[] = [
    { href: "/income", label: t("income"), icon: TrendingUp },
    { href: "/expenses", label: t("expenses"), icon: TrendingDown },
    { href: "/budget", label: t("budget"), icon: PiggyBank },
    {
      href: "/recurring",
      label: language === "id" ? "Tagihan Berulang" : "Recurring Bills",
      icon: CalendarRange,
    },
  ];

  const navPrefs: NavItem[] = [
    { href: "/settings", label: t("settings"), icon: Settings },
    { href: "/profile", label: t("profile"), icon: User },
  ];

  return (
    <Sidebar collapsible="icon" {...props}>
      {/* ─── Brand Header ─── */}
      <SidebarHeader className="p-4 pb-5 flex flex-row items-center justify-start group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:py-4 transition-all duration-300">
        <Link to="/" className="flex items-center gap-3 group/brand">
          <div className="relative">
            {/* Main Logo Container with dynamic accent color */}
            <span
              className="relative flex size-9 shrink-0 items-center justify-center rounded-xl text-white font-black text-base border shadow-lg transition-all duration-300 group-hover/brand:scale-105"
              style={{
                background: `linear-gradient(135deg, var(--accent) 0%, color-mix(in srgb, var(--accent) 80%, #000) 100%)`,
                borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
                boxShadow: '0 4px 12px color-mix(in srgb, var(--accent) 25%, transparent)'
              }}
              aria-hidden
            >
              R
            </span>
          </div>
          
          {/* Text section (hidden when collapsed) */}
          <div className="flex flex-col group-data-[collapsible=icon]:hidden transition-all duration-300">
            <span className="text-sm font-bold tracking-tight text-text-primary leading-tight flex items-center gap-1.5 group-hover/brand:text-accent transition-colors duration-200">
              Racks Finance
            </span>
            <div className="flex items-center mt-0.5">
              <span className="text-[10px] text-text-muted font-medium tracking-wide">
                Personal Dashboard
              </span>
            </div>
          </div>
        </Link>
      </SidebarHeader>

      {/* ─── Separator with subtle glow ─── */}
      <div className="mx-4 mb-1">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/40 to-transparent" />
      </div>

      <SidebarContent>
        <NavGroup label={language === "id" ? "Menu Utama" : "Main Menu"} items={navMain} pathname={pathname} />
        <NavGroup
          label={language === "id" ? "Analisis & Anggaran" : "Analytics & Budget"}
          items={navAnalytics}
          pathname={pathname}
        />



        <NavGroup
          label={language === "id" ? "Preferensi" : "Preferences"}
          items={navPrefs}
          pathname={pathname}
          className="mt-auto"
        />
      </SidebarContent>

      {/* ─── User Footer ─── */}
      <div className="mx-4 mb-1">
        <div className="h-px bg-gradient-to-r from-transparent via-sidebar-border/40 to-transparent" />
      </div>
      <SidebarFooter className="p-3">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  className,
}: {
  label: string;
  items: NavItem[];
  pathname: string;
  className?: string;
}) {
  return (
    <SidebarGroup className={className}>
      <SidebarGroupLabel className="px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground/40">
        {label}
      </SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu className="px-2 gap-0.5">
          {items.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  tooltip={item.label}
                  className={cn(
                    "transition-colors duration-200 relative rounded-lg h-9 px-3 group/btn",
                    isActive
                      ? "bg-accent text-sidebar font-medium shadow-sm"
                      : "text-muted-foreground/70 hover:text-foreground hover:bg-sidebar-accent"
                  )}
                >
                  <Link to={item.href}>
                    <Icon
                      size={16}
                      strokeWidth={isActive ? 2.5 : 2}
                      className="transition-colors duration-200 shrink-0"
                    />
                    <span className="text-[13px]">{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {typeof item.badge === "number" ? (
                  <SidebarMenuBadge
                    className={cn(
                      "rounded-full min-w-[18px] h-[18px] text-[10px] font-bold flex items-center justify-center transition-colors duration-200",
                      isActive
                        ? "bg-sidebar text-accent"
                        : "bg-sidebar-accent text-muted-foreground/60"
                    )}
                  >
                    {item.badge}
                  </SidebarMenuBadge>
                ) : null}
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
