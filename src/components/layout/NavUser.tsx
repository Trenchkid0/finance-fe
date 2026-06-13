import { Link } from "react-router-dom";
import { ChevronRight, ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

import { useLanguage } from "@/lib/contexts/LanguageContext";
import { logout } from "@/app/actions/auth";

interface NavUserProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
}

/**
 * User card pinned to sidebar footer. Click → dropdown with profile,
 * settings, logout (mirrors dashboard-01 NavUser).
 */
export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { t } = useLanguage();

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "U";

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="rounded-xl hover:bg-white/[0.04] transition-all duration-300 data-[state=open]:bg-white/[0.06] data-[state=open]:text-foreground"
            >
              <Avatar className="h-8 w-8 rounded-xl border border-white/[0.08]">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                ) : null}
                <AvatarFallback className="rounded-xl text-[10px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left leading-tight">
                <span className="truncate text-[13px] font-semibold text-foreground">
                  {user.name ?? "User"}
                </span>
                <span className="truncate text-[11px] text-muted-foreground/50">
                  {user.email}
                </span>
              </div>
              <ChevronsUpDown size={14} className="ml-auto text-muted-foreground/30" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="min-w-[280px] rounded-2xl border border-border/40 bg-elevated/60 backdrop-blur-xl p-2 shadow-[0_10px_40px_rgba(0,0,0,0.5)] space-y-1 animate-in fade-in-0 zoom-in-95 duration-100 overflow-hidden"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-1 font-normal">
              <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-gradient-to-b from-surface/50 to-elevated/30 border border-border/40">
                <div className="relative">
                  <Avatar className="h-10 w-10 rounded-xl border border-white/[0.08]">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name ?? "User"} />
                    ) : null}
                    <AvatarFallback className="rounded-xl text-[11px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  {/* Status Indicator Dot */}
                  <span className="absolute -bottom-0.5 -right-0.5 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500 border border-elevated"></span>
                  </span>
                </div>
                <div className="grid flex-1 text-left leading-tight min-w-0">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="truncate text-[13px] font-bold text-text-primary">
                      {user.name ?? "User"}
                    </span>
                    <span className="text-[8px] bg-accent/15 text-accent font-bold px-1.5 py-0.5 rounded-full border border-accent/30 uppercase tracking-widest scale-90 origin-left shrink-0">
                      Demo
                    </span>
                  </div>
                  <span className="truncate text-[10px] text-text-muted mt-1 font-mono">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>

            <div className="h-px bg-border/60 my-1 mx-1" />

            <DropdownMenuGroup className="space-y-1">
              {/* Profile Item */}
              <DropdownMenuItem asChild className="rounded-xl mx-1 px-3 py-2 text-[12px] group/item hover:bg-white/[0.03] border border-transparent hover:border-border/30 transition-all duration-200 cursor-pointer">
                <Link to="/profile" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-accent/5 border border-accent/10 text-accent/70 group-hover/item:bg-accent/10 group-hover/item:text-accent transition-colors duration-200">
                      <UserCircle size={15} />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-semibold text-text-primary group-hover/item:text-accent transition-colors duration-200">{t("profile")}</span>
                      <span className="text-[9px] text-text-muted/60 mt-0.5 truncate">Kelola informasi detail akun Anda</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-text-muted/30 group-hover/item:text-accent group-hover/item:translate-x-0.5 transition-all duration-200 shrink-0" />
                </Link>
              </DropdownMenuItem>

              {/* Settings Item */}
              <DropdownMenuItem asChild className="rounded-xl mx-1 px-3 py-2 text-[12px] group/item hover:bg-white/[0.03] border border-transparent hover:border-border/30 transition-all duration-200 cursor-pointer">
                <Link to="/settings" className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="p-1.5 rounded-lg bg-accent/5 border border-accent/10 text-accent/70 group-hover/item:bg-accent/10 group-hover/item:text-accent transition-colors duration-200">
                      <Settings size={15} />
                    </div>
                    <div className="flex flex-col text-left min-w-0">
                      <span className="font-semibold text-text-primary group-hover/item:text-accent transition-colors duration-200">{t("settings")}</span>
                      <span className="text-[9px] text-text-muted/60 mt-0.5 truncate">Atur preferensi & konfigurasi aplikasi</span>
                    </div>
                  </div>
                  <ChevronRight size={12} className="text-text-muted/30 group-hover/item:text-accent group-hover/item:translate-x-0.5 transition-all duration-200 shrink-0" />
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <div className="h-px bg-border/60 my-1 mx-1" />

            {/* Logout Item */}
            <DropdownMenuItem
              variant="destructive"
              className="rounded-xl mx-1 px-3 py-2 text-[12px] cursor-pointer group/item hover:bg-expense/10 hover:text-expense border border-transparent hover:border-expense/20 transition-all duration-200 flex items-center justify-between w-full"
              onSelect={async (e) => {
                e.preventDefault();
                await logout();
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="p-1.5 rounded-lg bg-expense/5 border border-expense/10 text-expense/70 group-hover/item:bg-expense/20 group-hover/item:text-expense transition-colors duration-200">
                  <LogOut size={15} />
                </div>
                <div className="flex flex-col text-left min-w-0">
                  <span className="font-bold text-expense">{t("logout")}</span>
                  <span className="text-[9px] text-expense/60 mt-0.5 truncate">Akhiri sesi aktif Anda dengan aman</span>
                </div>
              </div>
              <ChevronRight size={12} className="text-expense/30 group-hover/item:text-expense group-hover/item:translate-x-0.5 transition-all duration-200 shrink-0" />
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
