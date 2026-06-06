"use client";

import { Link } from "react-router-dom";
import { ChevronsUpDown, LogOut, Settings, UserCircle } from "lucide-react";
import { api } from "@/lib/api";
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
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

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
        <DropdownMenu>
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
            className="min-w-56 rounded-xl border-white/[0.08] bg-popover/95 backdrop-blur-xl shadow-2xl shadow-black/40"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={8}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-3 px-3 py-3">
                <Avatar className="h-9 w-9 rounded-xl border border-white/[0.08]">
                  {user.image ? (
                    <AvatarImage src={user.image} alt={user.name ?? "User"} />
                  ) : null}
                  <AvatarFallback className="rounded-xl text-[10px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left leading-tight">
                  <span className="truncate text-sm font-semibold text-foreground">
                    {user.name ?? "User"}
                  </span>
                  <span className="truncate text-[11px] text-muted-foreground/60">
                    {user.email}
                  </span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuGroup>
              <DropdownMenuItem asChild className="rounded-lg mx-1 px-3 py-2 text-[13px]">
                <Link to="/profile" className="cursor-pointer">
                  <UserCircle size={14} className="text-muted-foreground/60" />
                  Profil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-lg mx-1 px-3 py-2 text-[13px]">
                <Link to="/settings" className="cursor-pointer">
                  <Settings size={14} className="text-muted-foreground/60" />
                  Pengaturan
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator className="bg-white/[0.06]" />
            <DropdownMenuItem
              variant="destructive"
              className="rounded-lg mx-1 px-3 py-2 text-[13px]"
              onSelect={async (e) => {
                e.preventDefault();
                try {
                  await api.post("/api/auth/logout", {});
                  window.location.href = "/login";
                } catch (err) {
                  console.error("Logout failed:", err);
                }
              }}
            >
              <LogOut size={14} />
              Keluar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
