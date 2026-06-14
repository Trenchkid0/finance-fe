import { Link } from "react-router-dom";
import {LogOut, MoreVertical, Settings, UserCircle } from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  SidebarMenu,
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

export function NavUser({ user }: NavUserProps) {
  const { isMobile } = useSidebar();
  const { language } = useLanguage();

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
        <DropdownMenu.Root modal={false}>
          <DropdownMenu.Trigger asChild>
            <button
              type="button"
              data-slot="dropdown-menu-trigger"
              data-sidebar="menu-button"
              data-size="lg"
              className="peer/menu-button flex w-full items-center gap-2 overflow-hidden rounded-md p-2 text-left ring-sidebar-ring outline-hidden transition-[width,height,padding] group-has-data-[sidebar=menu-action]/menu-item:pr-8 group-data-[collapsible=icon]:!size-8 focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:hover:bg-sidebar-accent data-[state=open]:hover:text-sidebar-accent-foreground [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground h-12 text-sm group-data-[collapsible=icon]:!p-0 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="rounded-lg text-[10px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                {user.image ? (
                  <AvatarImage src={user.image} alt={user.name ?? "User"} />
                ) : null}
                <AvatarFallback className="rounded-lg text-[10px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium text-foreground">
                  {user.name ?? "User"}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {user.email}
                </span>
              </div>
              <MoreVertical size={16} className="ml-auto text-muted-foreground/30 size-4 shrink-0" />
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              side={isMobile ? "bottom" : "right"}
              align="end"
              sideOffset={4}
              data-slot="dropdown-menu-content"
              className="z-50 max-h-[var(--radix-dropdown-menu-content-available-height)] overflow-x-hidden overflow-y-auto border border-sidebar-border bg-sidebar p-1 text-sidebar-foreground shadow-md data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 w-[var(--radix-dropdown-menu-trigger-width)] min-w-56 rounded-lg outline-none"
            >
              <div data-slot="dropdown-menu-label" className="text-sm data-[inset]:pl-8 p-0 font-normal">
                <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                  <Avatar className="h-8 w-8 rounded-lg">
                    {user.image ? (
                      <AvatarImage src={user.image} alt={user.name ?? "User"} />
                    ) : null}
                    <AvatarFallback className="rounded-lg text-[10px] font-bold bg-gradient-to-br from-accent/20 to-indigo-500/20 text-accent">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium text-sidebar-foreground">
                      {user.name ?? "User"}
                    </span>
                    <span className="truncate text-xs text-sidebar-foreground/60">
                      {user.email}
                    </span>
                  </div>
                </div>
              </div>

              <div role="separator" aria-orientation="horizontal" data-slot="dropdown-menu-separator" className="-mx-1 my-1 h-px bg-sidebar-border" />

              <div role="group" data-slot="dropdown-menu-group" className="space-y-0.5">
                <DropdownMenu.Item asChild>
                  <Link
                    to="/profile"
                    className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-sidebar-foreground/60"
                  >
                    <UserCircle />
                    {language === "id" ? "Akun" : "Account"}
                  </Link>
                </DropdownMenu.Item>

                <DropdownMenu.Item asChild>
                  <Link
                    to="/settings"
                    className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-sidebar-accent focus:text-sidebar-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-sidebar-foreground/60"
                  >
                    <Settings />
                    {language === "id" ? "Pengaturan" : "Settings"}
                  </Link>
                </DropdownMenu.Item>
              </div>

              <div role="separator" aria-orientation="horizontal" data-slot="dropdown-menu-separator" className="-mx-1 my-1 h-px bg-sidebar-border" />

              <DropdownMenu.Item
                onSelect={async () => {
                  await logout();
                }}
                className="relative flex cursor-pointer select-none items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none focus:bg-expense/10 focus:text-expense data-[disabled]:pointer-events-none data-[disabled]:opacity-50 text-expense [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-expense"
              >
                <LogOut />
                {language === "id" ? "Keluar" : "Log out"}
              </DropdownMenu.Item>
            </DropdownMenu.Content>
          </DropdownMenu.Portal>
        </DropdownMenu.Root>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}